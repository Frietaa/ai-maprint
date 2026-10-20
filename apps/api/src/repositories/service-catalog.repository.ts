// Persistence access for the service catalog. Relations are loaded with
// select in the same Prisma query (one query per relation level, never one
// per row). No price calculation or ordering rules here.
import type { DbClient } from '../db/prisma.js'
import type { Prisma } from '../generated/prisma/client.js'

const serviceSelect = {
  id: true,
  name: true,
  description: true,
  priceType: true,
  price: true,
  isActive: true,
  category: { select: { id: true, name: true, isActive: true } },
} satisfies Prisma.ServiceSelect

export type ServiceRecord = Prisma.ServiceGetPayload<{
  select: typeof serviceSelect
}>

const serviceOrder = [
  { category: { name: 'asc' } },
  { name: 'asc' },
  { id: 'asc' },
] satisfies Prisma.ServiceOrderByWithRelationInput[]

// Active = the service and its category are both active.
const activeService = {
  isActive: true,
  category: { isActive: true },
} satisfies Prisma.ServiceWhereInput

export interface ListServicesOptions {
  // true for public reads; false also returns inactive services/categories.
  activeOnly: boolean
  categoryId?: string
}

export function listServices(
  db: DbClient,
  { activeOnly, categoryId }: ListServicesOptions,
): Promise<ServiceRecord[]> {
  return db.service.findMany({
    where: {
      ...(activeOnly ? activeService : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    select: serviceSelect,
    orderBy: serviceOrder,
  })
}

// Returns the row regardless of isActive; the caller decides visibility.
export function findServiceById(
  db: DbClient,
  id: string,
): Promise<ServiceRecord | null> {
  return db.service.findUnique({ where: { id }, select: serviceSelect })
}

export interface ListServicesAtLocationOptions {
  // true for public reads: active service/category and isAvailable only.
  activeOnly: boolean
}

export type ServiceAtLocationRecord = ServiceRecord & { isAvailable: boolean }

// Services linked to one location (location_services primary key leads with
// location_id). The location's own isActive is the caller's concern.
export async function listServicesAtLocation(
  db: DbClient,
  locationId: string,
  { activeOnly }: ListServicesAtLocationOptions,
): Promise<ServiceAtLocationRecord[]> {
  const links = await db.locationService.findMany({
    where: {
      locationId,
      ...(activeOnly ? { isAvailable: true, service: activeService } : {}),
    },
    select: { isAvailable: true, service: { select: serviceSelect } },
    orderBy: [
      { service: { category: { name: 'asc' } } },
      { service: { name: 'asc' } },
      { serviceId: 'asc' },
    ],
  })
  return links.map(({ isAvailable, service }) => ({ ...service, isAvailable }))
}
