// Persistence access for the ATK product catalog. The category is loaded in
// the same Prisma query (no per-row lookups). Price is integer Rupiah; there
// is no stock quantity, only availability.
import type { DbClient } from '../db/prisma.js'
import type { Prisma } from '../generated/prisma/client.js'

const productSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  imageRef: true,
  availability: true,
  isActive: true,
  category: { select: { id: true, name: true, isActive: true } },
} satisfies Prisma.ProductSelect

export type ProductRecord = Prisma.ProductGetPayload<{
  select: typeof productSelect
}>

export interface ListProductsOptions {
  // true for public reads (product and category active). UNAVAILABLE
  // products are still returned: availability is display state.
  activeOnly: boolean
  categoryId?: string
}

export function listProducts(
  db: DbClient,
  { activeOnly, categoryId }: ListProductsOptions,
): Promise<ProductRecord[]> {
  return db.product.findMany({
    where: {
      ...(activeOnly ? { isActive: true, category: { isActive: true } } : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    select: productSelect,
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }, { id: 'asc' }],
  })
}

// Returns the row regardless of isActive; the caller decides visibility.
export function findProductById(
  db: DbClient,
  id: string,
): Promise<ProductRecord | null> {
  return db.product.findUnique({ where: { id }, select: productSelect })
}
