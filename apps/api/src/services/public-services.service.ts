import type {
  ApiCatalogPageResponse,
  ServiceDto,
  ServiceListQuery,
} from '@maba-printing/shared'
import type { DbClient } from '../db/prisma.js'
import { catalogPage } from '../http/response.js'
import { toServiceDto } from '../mappers/public-dto.mapper.js'
import {
  countServices,
  listServices,
} from '../repositories/service-catalog.repository.js'

// Public service catalog: active services in active categories, ordered by
// category name, service name, id, in bounded pages (KI-012). With
// `locationId`, only services that are available at that location — and
// only if the location itself is active.
export async function listPublicServices(
  db: DbClient,
  query: Required<Pick<ServiceListQuery, 'page' | 'pageSize'>> &
    ServiceListQuery,
): Promise<ApiCatalogPageResponse<ServiceDto>> {
  const options = {
    activeOnly: true,
    categoryId: query.categoryId,
    locationId: query.locationId,
  }
  const [records, total] = await Promise.all([
    listServices(db, {
      ...options,
      range: { skip: (query.page - 1) * query.pageSize, take: query.pageSize },
    }),
    countServices(db, options),
  ])
  return catalogPage(records.map(toServiceDto), query, total)
}
