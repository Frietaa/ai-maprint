// Admin catalog, location and business-settings management. Each change and
// its audit row are written in one transaction. Records are never deleted:
// `isActive` is the lifecycle (Architecture §27), and product availability
// (AVAILABLE/UNAVAILABLE) stays a separate concept.
import type {
  AdminCategoryDto,
  AdminLocationDto,
  AdminProductDto,
  AdminServiceDto,
  AdminSettingsDto,
} from '@maba-printing/shared'
import { parseOpeningHours } from '@maba-printing/shared'
import type { z } from 'zod'
import type { DbClient } from '../db/prisma.js'
import { inTransaction } from '../db/transaction.js'
import { NotFoundError, ValidationError } from '../errors/app-error.js'
import { Prisma } from '../generated/prisma/client.js'
import type {
  categoryCreateSchema,
  categoryUpdateSchema,
  locationCreateSchema,
  locationUpdateSchema,
  productCreateSchema,
  productUpdateSchema,
  serviceCreateSchema,
  serviceUpdateSchema,
  SettingsUpdateInput,
} from './admin-catalog.validator.js'
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  type AuditAction,
  changes,
  recordAudit,
} from './audit.js'

type CategoryCreate = z.infer<typeof categoryCreateSchema>
type CategoryUpdate = z.infer<typeof categoryUpdateSchema>
type ProductCreate = z.infer<typeof productCreateSchema>
type ProductUpdate = z.infer<typeof productUpdateSchema>
type ServiceCreate = z.infer<typeof serviceCreateSchema>
type ServiceUpdate = z.infer<typeof serviceUpdateSchema>
type LocationCreate = z.infer<typeof locationCreateSchema>
type LocationUpdate = z.infer<typeof locationUpdateSchema>

export interface AdminContext {
  db: DbClient
  adminId: string
}

// Admin lists show everything (active and inactive); catalogs are small.
const LIST_LIMIT = 500

const categorySelect = {
  id: true,
  name: true,
  description: true,
  isActive: true,
} as const

// Update action: reactivation/deactivation win over a plain update.
function lifecycleAction(
  before: { isActive: boolean },
  isActive: boolean | undefined,
  actions: {
    updated: AuditAction
    deactivated: AuditAction
    reactivated: AuditAction
  },
): AuditAction {
  if (isActive === undefined || isActive === before.isActive)
    return actions.updated
  return isActive ? actions.reactivated : actions.deactivated
}

// --- categories ----------------------------------------------------------

type CategoryKind = 'product' | 'service'

function categoryDelegate(tx: DbClient, kind: CategoryKind) {
  return kind === 'product' ? tx.productCategory : tx.serviceCategory
}

export async function listCategories(
  db: DbClient,
  kind: CategoryKind,
): Promise<AdminCategoryDto[]> {
  const args = {
    select: categorySelect,
    orderBy: [{ name: 'asc' as const }, { id: 'asc' as const }],
    take: LIST_LIMIT,
  }
  return kind === 'product'
    ? db.productCategory.findMany(args)
    : db.serviceCategory.findMany(args)
}

export function createCategory(
  { db, adminId }: AdminContext,
  kind: CategoryKind,
  input: CategoryCreate,
): Promise<AdminCategoryDto> {
  return inTransaction(db, async (tx) => {
    const data = {
      name: input.name,
      description: input.description ?? null,
      isActive: input.isActive ?? true,
    }
    const created =
      kind === 'product'
        ? await tx.productCategory.create({ data, select: categorySelect })
        : await tx.serviceCategory.create({ data, select: categorySelect })
    await recordAudit(tx, {
      actorId: adminId,
      action:
        kind === 'product'
          ? AUDIT_ACTIONS.productCategoryCreated
          : AUDIT_ACTIONS.serviceCategoryCreated,
      entityType:
        kind === 'product'
          ? AUDIT_ENTITIES.productCategory
          : AUDIT_ENTITIES.serviceCategory,
      entityId: created.id,
      metadata: { name: created.name, isActive: created.isActive },
    })
    return created
  })
}

export function updateCategory(
  { db, adminId }: AdminContext,
  kind: CategoryKind,
  id: string,
  input: CategoryUpdate,
): Promise<AdminCategoryDto> {
  return inTransaction(db, async (tx) => {
    const delegate = categoryDelegate(tx, kind) as typeof tx.productCategory
    const before = await delegate.findUnique({
      where: { id },
      select: categorySelect,
    })
    if (!before) throw new NotFoundError('Category not found')
    const updated = await delegate.update({
      where: { id },
      data: input,
      select: categorySelect,
    })
    await recordAudit(tx, {
      actorId: adminId,
      action:
        kind === 'product'
          ? AUDIT_ACTIONS.productCategoryUpdated
          : AUDIT_ACTIONS.serviceCategoryUpdated,
      entityType:
        kind === 'product'
          ? AUDIT_ENTITIES.productCategory
          : AUDIT_ENTITIES.serviceCategory,
      entityId: id,
      metadata: changes(before, input) as Prisma.InputJsonObject,
    })
    return updated
  })
}

// --- products --------------------------------------------------------------

const productSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  availability: true,
  imageRef: true,
  isActive: true,
  category: { select: categorySelect },
} satisfies Prisma.ProductSelect

export function listProducts(db: DbClient): Promise<AdminProductDto[]> {
  return db.product.findMany({
    select: productSelect,
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }, { id: 'asc' }],
    take: LIST_LIMIT,
  })
}

async function assertCategory(tx: DbClient, kind: CategoryKind, id: string) {
  const exists =
    kind === 'product'
      ? await tx.productCategory.findUnique({
          where: { id },
          select: { id: true },
        })
      : await tx.serviceCategory.findUnique({
          where: { id },
          select: { id: true },
        })
  if (!exists) throw new ValidationError({ categoryId: ['Category not found'] })
}

export function createProduct(
  { db, adminId }: AdminContext,
  input: ProductCreate,
): Promise<AdminProductDto> {
  return inTransaction(db, async (tx) => {
    await assertCategory(tx, 'product', input.categoryId)
    const created = await tx.product.create({
      data: {
        categoryId: input.categoryId,
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        availability: input.availability,
        imageRef: input.imageRef ?? null,
        isActive: input.isActive ?? true,
      },
      select: productSelect,
    })
    await recordAudit(tx, {
      actorId: adminId,
      action: AUDIT_ACTIONS.productCreated,
      entityType: AUDIT_ENTITIES.product,
      entityId: created.id,
      metadata: {
        name: created.name,
        price: created.price,
        availability: created.availability,
        isActive: created.isActive,
      },
    })
    return created
  })
}

export function updateProduct(
  { db, adminId }: AdminContext,
  id: string,
  input: ProductUpdate,
): Promise<AdminProductDto> {
  return inTransaction(db, async (tx) => {
    const before = await tx.product.findUnique({
      where: { id },
      select: { ...productSelect, categoryId: true },
    })
    if (!before) throw new NotFoundError('Product not found')
    if (input.categoryId) await assertCategory(tx, 'product', input.categoryId)
    const updated = await tx.product.update({
      where: { id },
      data: input,
      select: productSelect,
    })
    await recordAudit(tx, {
      actorId: adminId,
      action: lifecycleAction(before, input.isActive, {
        updated: AUDIT_ACTIONS.productUpdated,
        deactivated: AUDIT_ACTIONS.productDeactivated,
        reactivated: AUDIT_ACTIONS.productReactivated,
      }),
      entityType: AUDIT_ENTITIES.product,
      entityId: id,
      metadata: changes(before, input) as Prisma.InputJsonObject,
    })
    return updated
  })
}

// --- services --------------------------------------------------------------

const serviceSelect = {
  id: true,
  name: true,
  description: true,
  priceType: true,
  price: true,
  isActive: true,
  category: { select: categorySelect },
} satisfies Prisma.ServiceSelect

export function listServices(db: DbClient): Promise<AdminServiceDto[]> {
  return db.service.findMany({
    select: serviceSelect,
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }, { id: 'asc' }],
    take: LIST_LIMIT,
  })
}

export function createService(
  { db, adminId }: AdminContext,
  input: ServiceCreate,
): Promise<AdminServiceDto> {
  return inTransaction(db, async (tx) => {
    await assertCategory(tx, 'service', input.categoryId)
    const created = await tx.service.create({
      data: {
        categoryId: input.categoryId,
        name: input.name,
        description: input.description ?? null,
        priceType: input.priceType,
        price: input.price,
        isActive: input.isActive ?? true,
      },
      select: serviceSelect,
    })
    await recordAudit(tx, {
      actorId: adminId,
      action: AUDIT_ACTIONS.serviceCreated,
      entityType: AUDIT_ENTITIES.service,
      entityId: created.id,
      metadata: {
        name: created.name,
        priceType: created.priceType,
        price: created.price,
        isActive: created.isActive,
      },
    })
    return created
  })
}

export function updateService(
  { db, adminId }: AdminContext,
  id: string,
  input: ServiceUpdate,
): Promise<AdminServiceDto> {
  return inTransaction(db, async (tx) => {
    const before = await tx.service.findUnique({
      where: { id },
      select: { ...serviceSelect, categoryId: true },
    })
    if (!before) throw new NotFoundError('Service not found')
    const priceType = input.priceType ?? before.priceType
    const price = input.price !== undefined ? input.price : before.price
    if (priceType === 'FIXED' && price === null) {
      throw new ValidationError({ price: ['A fixed price is required'] })
    }
    if (input.categoryId) await assertCategory(tx, 'service', input.categoryId)
    const updated = await tx.service.update({
      where: { id },
      data: input,
      select: serviceSelect,
    })
    await recordAudit(tx, {
      actorId: adminId,
      action: lifecycleAction(before, input.isActive, {
        updated: AUDIT_ACTIONS.serviceUpdated,
        deactivated: AUDIT_ACTIONS.serviceDeactivated,
        reactivated: AUDIT_ACTIONS.serviceReactivated,
      }),
      entityType: AUDIT_ENTITIES.service,
      entityId: id,
      metadata: changes(before, input) as Prisma.InputJsonObject,
    })
    return updated
  })
}

// --- locations -------------------------------------------------------------

const locationSelect = {
  id: true,
  name: true,
  address: true,
  openingHours: true,
  isActive: true,
  services: { select: { serviceId: true, isAvailable: true } },
} satisfies Prisma.LocationSelect

type LocationRecord = Prisma.LocationGetPayload<{
  select: typeof locationSelect
}>

function toLocationDto(
  location: LocationRecord,
  serviceIds: readonly string[],
): AdminLocationDto {
  const available = new Map(
    location.services.map((s) => [s.serviceId, s.isAvailable]),
  )
  return {
    id: location.id,
    name: location.name,
    address: location.address,
    openingHours: parseOpeningHours(location.openingHours),
    isActive: location.isActive,
    // Every service; missing link rows mean "not offered here".
    services: serviceIds.map((serviceId) => ({
      serviceId,
      isAvailable: available.get(serviceId) ?? false,
    })),
  }
}

async function allServiceIds(db: DbClient): Promise<string[]> {
  const rows = await db.service.findMany({
    select: { id: true },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    take: LIST_LIMIT,
  })
  return rows.map((row) => row.id)
}

export async function listLocations(db: DbClient): Promise<AdminLocationDto[]> {
  const [locations, serviceIds] = await Promise.all([
    db.location.findMany({
      select: locationSelect,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: LIST_LIMIT,
    }),
    allServiceIds(db),
  ])
  return locations.map((location) => toLocationDto(location, serviceIds))
}

// JSON null in Prisma is Prisma.DbNull (SQL NULL = "not configured").
function openingHoursValue(
  value: LocationCreate['openingHours'] | undefined,
): Prisma.InputJsonValue | typeof Prisma.DbNull | undefined {
  if (value === undefined) return undefined
  return value === null ? Prisma.DbNull : value
}

export function createLocation(
  { db, adminId }: AdminContext,
  input: LocationCreate,
): Promise<AdminLocationDto> {
  return inTransaction(db, async (tx) => {
    const created = await tx.location.create({
      data: {
        name: input.name,
        address: input.address,
        openingHours: openingHoursValue(input.openingHours),
        isActive: input.isActive ?? true,
      },
      select: locationSelect,
    })
    await recordAudit(tx, {
      actorId: adminId,
      action: AUDIT_ACTIONS.locationCreated,
      entityType: AUDIT_ENTITIES.location,
      entityId: created.id,
      metadata: { name: created.name, isActive: created.isActive },
    })
    return toLocationDto(created, await allServiceIds(tx))
  })
}

export function updateLocation(
  { db, adminId }: AdminContext,
  id: string,
  input: LocationUpdate,
): Promise<AdminLocationDto> {
  return inTransaction(db, async (tx) => {
    const before = await tx.location.findUnique({
      where: { id },
      select: locationSelect,
    })
    if (!before) throw new NotFoundError('Location not found')
    const updated = await tx.location.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.openingHours !== undefined && {
          openingHours: openingHoursValue(input.openingHours),
        }),
      },
      select: locationSelect,
    })
    const { openingHours, ...rest } = input
    await recordAudit(tx, {
      actorId: adminId,
      action: lifecycleAction(before, input.isActive, {
        updated: AUDIT_ACTIONS.locationUpdated,
        deactivated: AUDIT_ACTIONS.locationDeactivated,
        reactivated: AUDIT_ACTIONS.locationReactivated,
      }),
      entityType: AUDIT_ENTITIES.location,
      entityId: id,
      metadata: {
        ...changes(before, rest),
        ...(openingHours !== undefined && { openingHours: 'changed' }),
      },
    })
    return toLocationDto(updated, await allServiceIds(tx))
  })
}

// Per-location availability (LocationService). The Service itself stays as
// it is; only this branch's offer changes.
export function setLocationServiceAvailability(
  { db, adminId }: AdminContext,
  locationId: string,
  serviceId: string,
  isAvailable: boolean,
): Promise<AdminLocationDto> {
  return inTransaction(db, async (tx) => {
    const [location, service] = await Promise.all([
      tx.location.findUnique({
        where: { id: locationId },
        select: { id: true },
      }),
      tx.service.findUnique({ where: { id: serviceId }, select: { id: true } }),
    ])
    if (!location) throw new NotFoundError('Location not found')
    if (!service) throw new NotFoundError('Service not found')
    const previous = await tx.locationService.findUnique({
      where: { locationId_serviceId: { locationId, serviceId } },
      select: { isAvailable: true },
    })
    await tx.locationService.upsert({
      where: { locationId_serviceId: { locationId, serviceId } },
      create: { locationId, serviceId, isAvailable },
      update: { isAvailable },
    })
    await recordAudit(tx, {
      actorId: adminId,
      action: AUDIT_ACTIONS.locationServiceAvailabilityUpdated,
      entityType: AUDIT_ENTITIES.locationService,
      entityId: `${locationId}:${serviceId}`,
      metadata: { from: previous?.isAvailable ?? null, to: isAvailable },
    })
    const updated = await tx.location.findUniqueOrThrow({
      where: { id: locationId },
      select: locationSelect,
    })
    return toLocationDto(updated, await allServiceIds(tx))
  })
}

// --- business settings -----------------------------------------------------

const SETTINGS_ID = 1

const settingsSelect = {
  businessName: true,
  whatsappNumber: true,
  logoRef: true,
  qrisImageRef: true,
  socialLinks: true,
  publicInfo: true,
  updatedAt: true,
} satisfies Prisma.BusinessSettingsSelect

type SettingsRecord = Prisma.BusinessSettingsGetPayload<{
  select: typeof settingsSelect
}>

function socialLinksOf(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return {}
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  )
}

function toSettingsDto(record: SettingsRecord | null): AdminSettingsDto {
  return {
    businessName: record?.businessName ?? null,
    whatsappNumber: record?.whatsappNumber ?? null,
    logoRef: record?.logoRef ?? null,
    qrisImageRef: record?.qrisImageRef ?? null,
    socialLinks: socialLinksOf(record?.socialLinks),
    publicInfo: record?.publicInfo ?? null,
    updatedAt: record?.updatedAt.toISOString() ?? null,
  }
}

export async function getSettings(db: DbClient): Promise<AdminSettingsDto> {
  return toSettingsDto(
    await db.businessSettings.findUnique({
      where: { id: SETTINGS_ID },
      select: settingsSelect,
    }),
  )
}

// The singleton row (id = 1) is created on first save; the client never
// chooses the ID. Audit: changed field names, small before/after values for
// short fields only (never the full public info text).
export function updateSettings(
  { db, adminId }: AdminContext,
  input: SettingsUpdateInput,
): Promise<AdminSettingsDto> {
  return inTransaction(db, async (tx) => {
    const before = toSettingsDto(
      await tx.businessSettings.findUnique({
        where: { id: SETTINGS_ID },
        select: settingsSelect,
      }),
    )
    const data = {
      ...input,
      ...(input.socialLinks !== undefined && {
        socialLinks: input.socialLinks as Prisma.InputJsonObject,
      }),
    }
    const saved = await tx.businessSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: data,
      select: settingsSelect,
    })
    const small = changes(
      {
        businessName: before.businessName,
        whatsappNumber: before.whatsappNumber,
        logoRef: before.logoRef,
        qrisImageRef: before.qrisImageRef,
      },
      {
        businessName: input.businessName,
        whatsappNumber: input.whatsappNumber,
        logoRef: input.logoRef,
        qrisImageRef: input.qrisImageRef,
      },
    )
    await recordAudit(tx, {
      actorId: adminId,
      action: AUDIT_ACTIONS.businessSettingsUpdated,
      entityType: AUDIT_ENTITIES.businessSettings,
      entityId: String(SETTINGS_ID),
      metadata: {
        fields: Object.keys(input),
        ...small,
      },
    })
    return toSettingsDto(saved)
  })
}
