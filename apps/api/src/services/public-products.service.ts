import type {
  ApiCatalogPageResponse,
  ProductDto,
  ProductListQuery,
} from '@maba-printing/shared'
import type { DbClient } from '../db/prisma.js'
import { catalogPage } from '../http/response.js'
import { toProductDto } from '../mappers/public-dto.mapper.js'
import {
  countProducts,
  listProducts,
} from '../repositories/product-catalog.repository.js'

// Public ATK catalog: active products in active categories, ordered by
// category name, product name, id, in bounded pages (KI-012). UNAVAILABLE
// products stay listed (they are temporarily not orderable); inactive
// products never appear.
export async function listPublicProducts(
  db: DbClient,
  query: Required<Pick<ProductListQuery, 'page' | 'pageSize'>> &
    ProductListQuery,
): Promise<ApiCatalogPageResponse<ProductDto>> {
  const options = {
    activeOnly: true,
    categoryId: query.categoryId,
    availability: query.availability,
  }
  const [records, total] = await Promise.all([
    listProducts(db, {
      ...options,
      range: { skip: (query.page - 1) * query.pageSize, take: query.pageSize },
    }),
    countProducts(db, options),
  ])
  return catalogPage(records.map(toProductDto), query, total)
}
