// Persistence access for locations. openingHours is returned exactly as
// stored; its shape is validated by the application layer, not here.
import type { DbClient } from '../db/prisma.js'
import type { Prisma } from '../generated/prisma/client.js'

const locationSelect = {
  id: true,
  name: true,
  address: true,
  openingHours: true,
  isActive: true,
} satisfies Prisma.LocationSelect

export type LocationRecord = Prisma.LocationGetPayload<{
  select: typeof locationSelect
}>

export interface ListLocationsOptions {
  // true for public reads; false returns inactive locations too.
  activeOnly: boolean
}

export function listLocations(
  db: DbClient,
  { activeOnly }: ListLocationsOptions,
): Promise<LocationRecord[]> {
  return db.location.findMany({
    where: activeOnly ? { isActive: true } : {},
    select: locationSelect,
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  })
}

// Returns the row regardless of isActive; the caller decides visibility.
export function findLocationById(
  db: DbClient,
  id: string,
): Promise<LocationRecord | null> {
  return db.location.findUnique({ where: { id }, select: locationSelect })
}
