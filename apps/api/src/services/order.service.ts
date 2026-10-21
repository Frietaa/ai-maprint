// Order use cases. Framework-free: no Express types. The service owns every
// business rule of a submission — identity association, schedule checks,
// active location, ATK availability and snapshots, totals, the public ID,
// the type-specific extension, the single transaction and the storage
// compensation — so controllers only translate HTTP.
import { ORDER_LIMITS } from '@maba-printing/shared'
import type { DbClient } from '../db/prisma.js'
import { inTransaction } from '../db/transaction.js'
import {
  AppError,
  type FieldErrors,
  ValidationError,
} from '../errors/app-error.js'
import { findLocationById } from '../repositories/location.repository.js'
import {
  createOrder,
  type NewOrder,
  type NewOrderFile,
  type NewOrderItem,
  type OrderReceiptRecord,
  publicIdExists,
} from '../repositories/order.repository.js'
import { findProductsByIds } from '../repositories/product-catalog.repository.js'
import {
  newOrderFileKey,
  type StorageService,
} from '../storage/storage-service.js'
import type { PublicOrderIdGenerator } from '../utils/public-order-id.js'
import type { CreateOrderInput } from '../validators/order.validator.js'
import { isUniqueViolation } from './auth.service.js'

export interface OrderServiceDeps {
  db: DbClient
  storage: StorageService
  generatePublicId: PublicOrderIdGenerator
  now: () => Date
}

// Who submits: the resolved principal, or null for a guest.
export interface OrderSubmitter {
  id: string
  role: 'MEMBER' | 'ADMIN'
}

// An uploaded file that already passed the upload policy (type, size).
export interface AcceptedUpload {
  tempPath: string
  // Sanitized display name.
  originalName: string
  // Canonical MIME type of the detected content.
  mimeType: string
  sizeBytes: number
}

// Stored in software_installation_requests.license_note for every request;
// the customer only confirms it (licenseAcknowledged: true).
export const SOFTWARE_LICENSE_NOTE =
  'Pelanggan menyatakan software yang diminta berlisensi sah, gratis (freeware), atau open-source, dan bertanggung jawab atas lisensinya.'

const MAX_DB_INTEGER = 2_147_483_647
const PUBLIC_ID_ATTEMPTS = 5
const DAY_MS = 24 * 60 * 60 * 1000

export const LOCATION_UNAVAILABLE_MESSAGE = 'Location unavailable'
export const PRODUCTS_UNAVAILABLE_MESSAGE = 'Some products are unavailable'

// Submits a new order (status SUBMITTED). Files are stored first; if
// anything fails afterwards they are deleted again, so no order points to a
// missing file and no known failure leaves orphaned files behind.
export async function submitOrder(
  deps: OrderServiceDeps,
  input: CreateOrderInput,
  submitter: OrderSubmitter | null,
  uploads: readonly AcceptedUpload[],
): Promise<OrderReceiptRecord> {
  const now = deps.now()
  checkRequest(input, uploads, now)
  // Only MEMBER sessions own orders. ADMIN sessions submit like a guest:
  // the order is not linked to the admin account (no member history).
  const memberId = submitter?.role === 'MEMBER' ? submitter.id : null

  const files = await storeUploads(deps.storage, uploads)
  try {
    for (let attempt = 1; attempt <= PUBLIC_ID_ATTEMPTS; attempt += 1) {
      const publicId = deps.generatePublicId(now)
      try {
        return await inTransaction(deps.db, (tx) =>
          createInTransaction(tx, input, { publicId, memberId, files }),
        )
      } catch (error) {
        // A unique violation is retried only if it really was the public ID.
        if (
          isUniqueViolation(error) &&
          (await publicIdExists(deps.db, publicId))
        ) {
          continue
        }
        throw error
      }
    }
    throw new Error('Could not allocate a unique public order ID')
  } catch (error) {
    await removeStored(deps.storage, files)
    throw error
  }
}

function checkRequest(
  input: CreateOrderInput,
  uploads: readonly AcceptedUpload[],
  now: Date,
): void {
  const errors: FieldErrors = {}
  const latest = now.getTime() + ORDER_LIMITS.maxScheduleAheadDays * DAY_MS

  const checkInstant = (field: string, value: Date | null) => {
    if (value === null) return
    if (value.getTime() <= now.getTime()) {
      errors[field] = ['Must be in the future']
    } else if (value.getTime() > latest) {
      errors[field] = ['Must be within one year']
    }
  }

  // ATK purchase requests may leave the time open; the other request types
  // need a preferred completion time (a preference, not a promise).
  if (input.requestedCompletionAt === null && input.type !== 'ATK') {
    errors.requestedCompletionAt = ['Requested completion is required']
  }
  checkInstant('requestedCompletionAt', input.requestedCompletionAt)
  if (input.type === 'LAPTOP_SERVICE') {
    checkInstant('handoverAt', input.handoverAt)
  }

  if (uploads.length > 0 && input.type !== 'PRINTING') {
    errors.files = ['Files are only accepted for printing orders']
  }
  if (
    input.type === 'PRINTING' &&
    input.description === null &&
    uploads.length === 0
  ) {
    errors.description = ['Add a description or at least one file']
  }

  if (Object.keys(errors).length > 0) throw new ValidationError(errors)
}

interface CreateContext {
  publicId: string
  memberId: string | null
  files: NewOrderFile[]
}

async function createInTransaction(
  tx: DbClient,
  input: CreateOrderInput,
  { publicId, memberId, files }: CreateContext,
): Promise<OrderReceiptRecord> {
  if (input.locationId !== null) {
    const location = await findLocationById(tx, input.locationId)
    if (!location?.isActive) {
      throw new AppError(409, LOCATION_UNAVAILABLE_MESSAGE, {
        locationId: ['This location is not available'],
      })
    }
  }

  const items = input.type === 'ATK' ? await snapshotItems(tx, input.items) : []
  const estimatedTotal =
    input.type === 'ATK' ? sumTotal(items.map((item) => item.subtotal)) : null

  const order: NewOrder = {
    publicId,
    type: input.type,
    userId: memberId,
    locationId: input.locationId,
    customerName: input.customerName,
    customerWhatsapp: input.customerWhatsapp,
    customerEmail: input.customerEmail,
    description:
      input.type === 'PRINTING' || input.type === 'ATK'
        ? input.description
        : null,
    requestedCompletionAt: input.requestedCompletionAt,
    estimatedTotal,
    items,
    files,
    laptopService:
      input.type === 'LAPTOP_SERVICE'
        ? {
            complaint: input.complaint,
            handoverMethod: input.handoverMethod,
            handoverAt: input.handoverAt,
            pickupAddress:
              input.handoverMethod === 'PICKUP' ? input.pickupAddress : null,
          }
        : null,
    softwareInstallation:
      input.type === 'SOFTWARE_INSTALLATION'
        ? {
            softwareName: input.softwareName,
            requirements: input.requirements,
            licenseNote: SOFTWARE_LICENSE_NOTE,
          }
        : null,
    submittedByUserId: memberId,
  }
  return createOrder(tx, order)
}

// Server-authoritative ATK snapshot: the current catalog row's name,
// description and price — never values from the browser. Read inside the
// order transaction; with binary availability there is no stock to reserve.
async function snapshotItems(
  tx: DbClient,
  requested: readonly { productId: string; quantity: number }[],
): Promise<NewOrderItem[]> {
  const products = new Map(
    (
      await findProductsByIds(
        tx,
        requested.map((item) => item.productId),
      )
    ).map((product) => [product.id, product]),
  )

  const errors: FieldErrors = {}
  const items: NewOrderItem[] = []
  requested.forEach((item, index) => {
    const product = products.get(item.productId)
    if (
      !product?.isActive ||
      !product.category.isActive ||
      product.availability !== 'AVAILABLE'
    ) {
      errors[`items.${index}.productId`] = ['This product is not available']
      return
    }
    const subtotal = product.price * item.quantity
    items.push({
      productId: product.id,
      nameSnapshot: product.name,
      descriptionSnapshot: product.description,
      quantity: item.quantity,
      unitPriceSnapshot: product.price,
      subtotal,
    })
  })
  if (Object.keys(errors).length > 0) {
    throw new AppError(409, PRODUCTS_UNAVAILABLE_MESSAGE, errors)
  }
  return items
}

// Whole Rupiah within PostgreSQL INTEGER.
function sumTotal(subtotals: readonly number[]): number {
  let total = 0
  for (const subtotal of subtotals) {
    total += subtotal
    if (!Number.isSafeInteger(total) || total > MAX_DB_INTEGER) {
      throw new ValidationError({ items: ['Order total is too large'] })
    }
  }
  return total
}

async function storeUploads(
  storage: StorageService,
  uploads: readonly AcceptedUpload[],
): Promise<NewOrderFile[]> {
  const stored: NewOrderFile[] = []
  try {
    for (const upload of uploads) {
      const storageKey = newOrderFileKey()
      await storage.put(storageKey, upload.tempPath)
      stored.push({
        storageKey,
        originalName: upload.originalName,
        mimeType: upload.mimeType,
        sizeBytes: upload.sizeBytes,
      })
    }
  } catch (error) {
    await removeStored(storage, stored)
    throw error
  }
  return stored
}

// Compensation. A failed deletion is logged with the random storage keys
// only (no file names, paths or contents) for manual cleanup.
async function removeStored(
  storage: StorageService,
  files: readonly NewOrderFile[],
): Promise<void> {
  const results = await Promise.allSettled(
    files.map((file) => storage.delete(file.storageKey)),
  )
  const failed = files.filter(
    (_file, index) => results[index]?.status === 'rejected',
  )
  if (failed.length > 0) {
    console.error(
      `Order file compensation failed for ${failed.length} stored file(s): ${failed
        .map((file) => file.storageKey)
        .join(', ')}`,
    )
  }
}
