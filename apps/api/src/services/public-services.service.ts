import type { ServiceDto, ServiceListQuery } from '@maba-printing/shared'
import type { DbClient } from '../db/prisma.js'
import { toServiceDto } from '../mappers/public-dto.mapper.js'
import { listServices } from '../repositories/service-catalog.repository.js'

// Public service catalog: active services in active categories, ordered by
// category name, service name, id. With `locationId`, only services that are
// available at that location — and only if the location itself is active.
export async function listPublicServices(
  db: DbClient,
  query: ServiceListQuery,
): Promise<ServiceDto[]> {
  const records = await listServices(db, {
    activeOnly: true,
    categoryId: query.categoryId,
    locationId: query.locationId,
  })
  return records.map(toServiceDto)
}
