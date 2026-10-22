// Persistence access for orders — only the Phase-04 use cases: create an
// order with everything that belongs to it, find one for public tracking,
// and the member's own history/detail. Explicit selects throughout; the
// internal order/user IDs, storage keys, admin notes and status-change actors
// are never selected for reads that leave the API.
import type { DbClient } from '../db/prisma.js'
import type {
  HandoverMethod,
  OrderType,
  Prisma,
} from '../generated/prisma/client.js'

export interface NewOrderItem {
  productId: string
  nameSnapshot: string
  descriptionSnapshot: string | null
  quantity: number
  unitPriceSnapshot: number
  subtotal: number
}

export interface NewOrderFile {
  storageKey: string
  originalName: string
  mimeType: string
  sizeBytes: number
}

export interface NewOrder {
  publicId: string
  type: OrderType
  // null for guests (and for ADMIN sessions, which are not linked).
  userId: string | null
  locationId: string | null
  customerName: string
  customerWhatsapp: string
  customerEmail: string | null
  description: string | null
  requestedCompletionAt: Date | null
  estimatedTotal: number | null
  items: NewOrderItem[]
  files: NewOrderFile[]
  laptopService: {
    complaint: string
    handoverMethod: HandoverMethod
    handoverAt: Date | null
    pickupAddress: string | null
  } | null
  softwareInstallation: {
    softwareName: string
    requirements: string | null
    licenseNote: string
  } | null
  // Actor of the initial SUBMITTED history row (member id or null).
  submittedByUserId: string | null
}

export const receiptSelect = {
  publicId: true,
  type: true,
  status: true,
  createdAt: true,
  requestedCompletionAt: true,
  estimatedTotal: true,
} satisfies Prisma.OrderSelect

export type OrderReceiptRecord = Prisma.OrderGetPayload<{
  select: typeof receiptSelect
}>

// Creates the order, its items, type extension, file metadata and the
// initial status-history row (null → SUBMITTED) in one statement graph.
// Call inside a transaction so a failure leaves nothing behind.
export function createOrder(
  db: DbClient,
  order: NewOrder,
): Promise<OrderReceiptRecord> {
  return db.order.create({
    data: {
      publicId: order.publicId,
      type: order.type,
      status: 'SUBMITTED',
      userId: order.userId,
      locationId: order.locationId,
      customerName: order.customerName,
      customerWhatsapp: order.customerWhatsapp,
      customerEmail: order.customerEmail,
      description: order.description,
      requestedCompletionAt: order.requestedCompletionAt,
      estimatedTotal: order.estimatedTotal,
      items: { create: order.items },
      files: { create: order.files },
      ...(order.laptopService && {
        laptopServiceRequest: { create: order.laptopService },
      }),
      ...(order.softwareInstallation && {
        softwareInstallationRequest: { create: order.softwareInstallation },
      }),
      statusHistory: {
        create: {
          fromStatus: null,
          toStatus: 'SUBMITTED',
          changedByUserId: order.submittedByUserId,
        },
      },
    },
    select: receiptSelect,
  })
}

export async function publicIdExists(
  db: DbClient,
  publicId: string,
): Promise<boolean> {
  const row = await db.order.findUnique({
    where: { publicId },
    select: { publicId: true },
  })
  return row !== null
}

const timelineSelect = {
  select: { toStatus: true, createdAt: true },
  orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
} satisfies Prisma.Order$statusHistoryArgs

const trackedSelect = {
  publicId: true,
  type: true,
  status: true,
  createdAt: true,
  requestedCompletionAt: true,
  location: { select: { name: true } },
  statusHistory: timelineSelect,
} satisfies Prisma.OrderSelect

export type TrackedOrderRecord = Prisma.OrderGetPayload<{
  select: typeof trackedSelect
}>

// Exact public-ID lookup for guest tracking (no customer data selected).
export function findTrackedOrder(
  db: DbClient,
  publicId: string,
): Promise<TrackedOrderRecord | null> {
  return db.order.findUnique({ where: { publicId }, select: trackedSelect })
}

const summarySelect = {
  publicId: true,
  type: true,
  status: true,
  createdAt: true,
  requestedCompletionAt: true,
  estimatedTotal: true,
  finalTotal: true,
} satisfies Prisma.OrderSelect

export type MemberOrderSummaryRecord = Prisma.OrderGetPayload<{
  select: typeof summarySelect
}>

export async function listMemberOrders(
  db: DbClient,
  userId: string,
  { skip, take }: { skip: number; take: number },
): Promise<{ orders: MemberOrderSummaryRecord[]; total: number }> {
  const where = { userId } satisfies Prisma.OrderWhereInput
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      select: summarySelect,
      // Uses orders_user_id_created_at_idx.
      orderBy: [{ createdAt: 'desc' }, { publicId: 'desc' }],
      skip,
      take,
    }),
    db.order.count({ where }),
  ])
  return { orders, total }
}

const detailSelect = {
  ...summarySelect,
  customerName: true,
  customerWhatsapp: true,
  customerEmail: true,
  description: true,
  location: { select: { name: true, address: true } },
  items: {
    select: {
      nameSnapshot: true,
      descriptionSnapshot: true,
      quantity: true,
      unitPriceSnapshot: true,
      subtotal: true,
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
  laptopServiceRequest: {
    select: {
      complaint: true,
      handoverMethod: true,
      handoverAt: true,
      pickupAddress: true,
      distanceKm: true,
      pickupFee: true,
    },
  },
  softwareInstallationRequest: {
    select: { softwareName: true, requirements: true, licenseNote: true },
  },
  files: {
    // Display metadata only; never the storage key.
    where: { deletedAt: null },
    select: { originalName: true, mimeType: true, sizeBytes: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
  // Customer-safe payment fields only: never the payment ID or the
  // confirming Admin.
  payment: { select: { method: true, status: true, amount: true } },
  statusHistory: timelineSelect,
} satisfies Prisma.OrderSelect

export type MemberOrderDetailRecord = Prisma.OrderGetPayload<{
  select: typeof detailSelect
}>

// The member's own order: both the public ID and the owner must match, so
// another member's order is indistinguishable from a missing one.
export function findMemberOrder(
  db: DbClient,
  userId: string,
  publicId: string,
): Promise<MemberOrderDetailRecord | null> {
  return db.order.findFirst({
    where: { publicId, userId },
    select: detailSelect,
  })
}
