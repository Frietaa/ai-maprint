// Request schemas for POST /orders and the member order-history queries.
// Strict objects discriminated on `type`: anything the server owns — userId,
// status, publicId, prices, totals, adminNotes, distance, pickup fee, license
// note — is an unknown field and rejected. Every value is bounded.
//
// Timing rules that need "now" (requested completion in the future, at most
// a year ahead) are checked by the order service with an injectable clock.
import {
  HANDOVER_METHODS,
  ORDER_LIMITS,
  parsePublicOrderId,
} from '@maba-printing/shared'
import { z } from 'zod'
import { emailSchema, whatsappSchema } from './auth.validator.js'

// Multi-line text may contain tab, newline and carriage return only.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/
// Single-line text may contain none at all.
// eslint-disable-next-line no-control-regex
const ANY_CONTROL_CHARACTER = /[\u0000-\u001F\u007F]/

// Single-line text: trimmed, no control characters at all.
function singleLine(max: number, requiredMessage: string) {
  return z
    .string()
    .trim()
    .min(1, requiredMessage)
    .max(max)
    .refine((value) => !ANY_CONTROL_CHARACTER.test(value), 'Invalid characters')
}

// Multi-line text (newlines and tabs allowed); "" and null mean none.
function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .refine((value) => !CONTROL_CHARACTERS.test(value), 'Invalid characters')
    .nullable()
    .optional()
    .transform((value) => (value ? value : null))
}

function requiredText(max: number, requiredMessage: string) {
  return z
    .string()
    .trim()
    .min(1, requiredMessage)
    .max(max)
    .refine((value) => !CONTROL_CHARACTERS.test(value), 'Invalid characters')
}

// ISO 8601 with an explicit offset ("Z" or "+07:00"), stored as an instant.
const instant = z.iso
  .datetime({ offset: true, message: 'Must be an ISO 8601 date-time' })
  .transform((value) => new Date(value))

const optionalInstant = instant
  .nullable()
  .optional()
  .transform((value) => value ?? null)

const customerWhatsapp = whatsappSchema.transform((value, ctx) => {
  if (value === null) {
    ctx.addIssue({ code: 'custom', message: 'WhatsApp number is required' })
    return z.NEVER
  }
  return value
})

const customerEmail = z
  .union([z.literal(''), z.null(), emailSchema])
  .optional()
  .transform((value) => (value ? value : null))

const commonFields = {
  customerName: singleLine(
    ORDER_LIMITS.customerNameMaxLength,
    'Name is required',
  ),
  customerWhatsapp,
  customerEmail,
  locationId: z
    .uuid('Must be a valid UUID')
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  requestedCompletionAt: optionalInstant,
}

const description = optionalText(ORDER_LIMITS.descriptionMaxLength)

export const printingOrderSchema = z.strictObject({
  type: z.literal('PRINTING'),
  ...commonFields,
  description,
})

export const atkOrderSchema = z.strictObject({
  type: z.literal('ATK'),
  ...commonFields,
  description,
  items: z
    .array(
      z.strictObject({
        productId: z.uuid('Must be a valid UUID'),
        quantity: z
          .int('Must be a whole number')
          .min(1)
          .max(ORDER_LIMITS.atkMaxQuantity),
      }),
    )
    .min(1, 'At least one product is required')
    .max(ORDER_LIMITS.atkMaxItems)
    .refine(
      (items) =>
        new Set(items.map((item) => item.productId)).size === items.length,
      'Each product may appear only once',
    ),
})

export const laptopServiceOrderSchema = z
  .strictObject({
    type: z.literal('LAPTOP_SERVICE'),
    ...commonFields,
    complaint: requiredText(
      ORDER_LIMITS.descriptionMaxLength,
      'Complaint is required',
    ),
    handoverMethod: z.enum(HANDOVER_METHODS),
    handoverAt: optionalInstant,
    pickupAddress: optionalText(ORDER_LIMITS.pickupAddressMaxLength),
  })
  .superRefine((value, ctx) => {
    if (value.handoverMethod === 'PICKUP' && !value.pickupAddress) {
      ctx.addIssue({
        code: 'custom',
        path: ['pickupAddress'],
        message: 'Pickup address is required for PICKUP',
      })
    }
    if (value.handoverMethod === 'DROP_OFF' && value.pickupAddress) {
      ctx.addIssue({
        code: 'custom',
        path: ['pickupAddress'],
        message: 'Pickup address is only used for PICKUP',
      })
    }
  })

export const softwareInstallationOrderSchema = z.strictObject({
  type: z.literal('SOFTWARE_INSTALLATION'),
  ...commonFields,
  softwareName: singleLine(
    ORDER_LIMITS.softwareNameMaxLength,
    'Software name is required',
  ),
  requirements: optionalText(ORDER_LIMITS.descriptionMaxLength),
  licenseAcknowledged: z.literal(true, {
    message: 'Legal license acknowledgement is required',
  }),
})

export const createOrderSchema = z.discriminatedUnion('type', [
  printingOrderSchema,
  atkOrderSchema,
  laptopServiceOrderSchema,
  softwareInstallationOrderSchema,
])

export type CreateOrderInput = z.infer<typeof createOrderSchema>

// Route parameter :publicId (trim + uppercase + exact pattern).
export const publicOrderIdParamSchema = z.strictObject({
  publicId: z.string().transform((value, ctx) => {
    const parsed = parsePublicOrderId(value)
    if (parsed === null) {
      ctx.addIssue({ code: 'custom', message: 'Invalid order ID' })
      return z.NEVER
    }
    return parsed
  }),
})

// ?page=&pageSize= for GET /account/orders.
export const memberOrderListQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(ORDER_LIMITS.historyPageSizeMax)
    .default(ORDER_LIMITS.historyPageSizeDefault),
})
