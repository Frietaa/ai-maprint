// Persistence access for the ATK product catalog. The category is loaded in
// the same Prisma query (no per-row lookups). Price is integer Rupiah; there
// is no stock quantity, only availability.
import type { DbClient } from '../db/prisma.js'
import type { Prisma, ProductAvailability } from '../generated/prisma/client.js'

const productSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  imageRef: true,
  availability: true,
  isActive: true,
  category: {
    select: { id: true, name: true, description: true, isActive: true },
  },
} satisfies Prisma.ProductSelect

export type ProductRecord = Prisma.ProductGetPayload<{
  select: typeof productSelect
}>

export interface ListProductsOptions {
  // true for public reads (product and category active). UNAVAILABLE
  // products are still returned: availability is display state.
  activeOnly: boolean
  categoryId?: string
  availability?: ProductAvailability
}

export function listProducts(
  db: DbClient,
  { activeOnly, categoryId, availability }: ListProductsOptions,
): Promise<ProductRecord[]> {
  return db.product.findMany({
    where: {
      ...(activeOnly ? { isActive: true, category: { isActive: true } } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(availability ? { availability } : {}),
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

// Products for an ATK order, regardless of state; the order service decides
// what is orderable (active, active category, AVAILABLE).
export function findProductsByIds(
  db: DbClient,
  ids: readonly string[],
): Promise<ProductRecord[]> {
  return db.product.findMany({
    where: { id: { in: [...ids] } },
    select: productSelect,
  })
}
