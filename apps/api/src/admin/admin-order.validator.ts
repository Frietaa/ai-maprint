// Strict request schemas for the Admin order API. Each command accepts only
// its own fields: status, payment, customer snapshot, userId, file fields,
// confirmedById and the like are unknown fields (400) everywhere else.
import {
  ADMIN_LIMITS,
  ORDER_STATUSES,
  ORDER_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  parsePublicOrderId,
} from '@maba-printing/shared'
import { z } from 'zod'

const MAX_DB_INTEGER = 2_147_483_647

// Whole Rupiah within PostgreSQL INTEGER, or null.
const rupiah = z
  .int('Must be a whole number')
  .min(0, 'Must not be negative')
  .max(MAX_DB_INTEGER, 'Too large')
  .nullable()

export const adminOrderListQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(ADMIN_LIMITS.pageSizeMax)
    .default(20),
  status: z.enum(ORDER_STATUSES).optional(),
  type: z.enum(ORDER_TYPES).optional(),
  locationId: z.uuid('Must be a valid UUID').optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  // Exact Public Order ID (normalized); no partial matching.
  publicId: z
    .string()
    .transform((value, ctx) => {
      const parsed = parsePublicOrderId(value)
      if (parsed === null) {
        ctx.addIssue({ code: 'custom', message: 'Invalid order ID' })
        return z.NEVER
      }
      return parsed
    })
    .optional(),
})

export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>

export const fileIdParamSchema = z.strictObject({
  publicId: z.string(),
  fileId: z.uuid('Must be a valid UUID'),
})

export const updateStatusSchema = z.strictObject({
  fromStatus: z.enum(ORDER_STATUSES),
  toStatus: z.enum(ORDER_STATUSES),
})

// Kilometres with at most two decimals (numeric(6,2)).
const distanceKm = z
  .number('Must be a number')
  .min(0, 'Must not be negative')
  .max(ADMIN_LIMITS.maxDistanceKm, 'Too large')
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6,
    'At most two decimals',
  )
  .nullable()

export const updatePricingSchema = z
  .strictObject({
    estimatedTotal: rupiah.optional(),
    finalTotal: rupiah.optional(),
    distanceKm: distanceKm.optional(),
  })
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    'At least one field is required',
  )

export type UpdatePricingInput = z.infer<typeof updatePricingSchema>

// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/

export const updateNotesSchema = z.strictObject({
  adminNotes: z
    .string()
    .trim()
    .max(ADMIN_LIMITS.adminNotesMaxLength)
    .refine((value) => !CONTROL_CHARACTERS.test(value), 'Invalid characters')
    .nullable()
    .transform((value) => (value ? value : null)),
})

export const updatePaymentSchema = z.strictObject({
  method: z.enum(PAYMENT_METHODS),
  status: z.enum(PAYMENT_STATUSES),
  amount: rupiah,
})

export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>
