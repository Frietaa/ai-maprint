import {
  CATALOG_PAGE_LIMITS,
  PRODUCT_AVAILABILITIES,
} from '@maba-printing/shared'
import { z } from 'zod'

// Query schemas for the public read endpoints. All are strict: there is no
// public way to include inactive rows (no `activeOnly` parameter).

// Endpoints that take no query parameters at all.
export const noQuerySchema = z.strictObject({})

const uuid = z.uuid('Must be a valid UUID')

// Bounded catalog pages (KI-012): every response holds at most
// CATALOG_PAGE_LIMITS.pageSizeMax rows.
const page = z.coerce
  .number()
  .int()
  .min(1)
  .max(CATALOG_PAGE_LIMITS.pageMax)
  .default(1)
const pageSize = z.coerce
  .number()
  .int()
  .min(1)
  .max(CATALOG_PAGE_LIMITS.pageSizeMax)
  .default(CATALOG_PAGE_LIMITS.pageSizeDefault)

export const serviceListQuerySchema = z.strictObject({
  categoryId: uuid.optional(),
  locationId: uuid.optional(),
  page,
  pageSize,
})

export const productListQuerySchema = z.strictObject({
  page,
  pageSize,
  categoryId: uuid.optional(),
  availability: z
    .enum(PRODUCT_AVAILABILITIES, 'Must be AVAILABLE or UNAVAILABLE')
    .optional(),
})
