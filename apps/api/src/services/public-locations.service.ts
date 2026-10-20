import type { LocationDto } from '@maba-printing/shared'
import type { DbClient } from '../db/prisma.js'
import { toLocationDto } from '../mappers/public-dto.mapper.js'
import { listLocations } from '../repositories/location.repository.js'

// Public locations: active only, ordered by name (then id).
export async function listPublicLocations(
  db: DbClient,
): Promise<LocationDto[]> {
  const records = await listLocations(db, { activeOnly: true })
  return records.map(toLocationDto)
}
