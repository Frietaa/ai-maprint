import type { ProductDto, ProductListQuery } from '@maba-printing/shared'
import type { DbClient } from '../db/prisma.js'
import { toProductDto } from '../mappers/public-dto.mapper.js'
import { listProducts } from '../repositories/product-catalog.repository.js'

// Public ATK catalog: active products in active categories, ordered by
// category name, product name, id. UNAVAILABLE products stay listed (they
// are temporarily not orderable); inactive products never appear.
export async function listPublicProducts(
  db: DbClient,
  query: ProductListQuery,
): Promise<ProductDto[]> {
  const records = await listProducts(db, {
    activeOnly: true,
    categoryId: query.categoryId,
    availability: query.availability,
  })
  return records.map(toProductDto)
}
