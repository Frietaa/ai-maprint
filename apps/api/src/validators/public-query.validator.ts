import { PRODUCT_AVAILABILITIES } from '@maba-printing/shared'
import { z } from 'zod'

// Query schemas for the public read endpoints. All are strict: there is no
// public way to include inactive rows (no `activeOnly` parameter).

// Endpoints that take no query parameters at all.
export const noQuerySchema = z.strictObject({})

const uuid = z.uuid('Must be a valid UUID')

export const serviceListQuerySchema = z.strictObject({
  categoryId: uuid.optional(),
  locationId: uuid.optional(),
})

export const productListQuerySchema = z.strictObject({
  categoryId: uuid.optional(),
  availability: z
    .enum(PRODUCT_AVAILABILITIES, 'Must be AVAILABLE or UNAVAILABLE')
    .optional(),
})
