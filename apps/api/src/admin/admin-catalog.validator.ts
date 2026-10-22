// Strict schemas for Admin catalog, location and settings management.
// Validated before any database constraint so clients never see constraint
// text. No hard deletes exist: lifecycle is `isActive`.
import {
  ADMIN_LIMITS,
  PRICE_TYPES,
  PRODUCT_AVAILABILITIES,
} from '@maba-printing/shared'
import { z } from 'zod'
import { whatsappSchema } from '../validators/auth.validator.js'

const MAX_DB_INTEGER = 2_147_483_647

// eslint-disable-next-line no-control-regex
const ANY_CONTROL = /[\u0000-\u001F\u007F]/
// eslint-disable-next-line no-control-regex
const CONTROL_EXCEPT_NEWLINES = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/

const name = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(ADMIN_LIMITS.catalogNameMaxLength)
  .refine((value) => !ANY_CONTROL.test(value), 'Invalid characters')

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .refine(
      (value) => !CONTROL_EXCEPT_NEWLINES.test(value),
      'Invalid characters',
    )
    .nullable()
    .transform((value) => (value ? value : null))
}

const description = optionalText(ADMIN_LIMITS.catalogDescriptionMaxLength)
const rupiah = z.int('Must be a whole number').min(0).max(MAX_DB_INTEGER)

// Image references the website can load safely (see apps/web
// lib/image-ref.ts): an https URL or a root-relative path. No http, data:,
// javascript:, protocol-relative URLs or filesystem paths.
export const imageRefSchema = z
  .string()
  .trim()
  .max(ADMIN_LIMITS.imageRefMaxLength)
  .refine((value) => {
    if (value === '') return true
    if (value.startsWith('/')) {
      return (
        !value.startsWith('//') &&
        !/[\\\s]/.test(value) &&
        !value.includes('..')
      )
    }
    try {
      return new URL(value).protocol === 'https:'
    } catch {
      return false
    }
  }, 'Must be an https URL or a path starting with /')
  .nullable()
  .transform((value) => (value ? value : null))

export const categoryCreateSchema = z.strictObject({
  name,
  description: description.optional(),
  isActive: z.boolean().optional(),
})

export const categoryUpdateSchema = categoryCreateSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one field is required',
  )

export const productCreateSchema = z.strictObject({
  categoryId: z.uuid('Must be a valid UUID'),
  name,
  description: description.optional(),
  price: rupiah,
  availability: z.enum(PRODUCT_AVAILABILITIES),
  imageRef: imageRefSchema.optional(),
  isActive: z.boolean().optional(),
})

export const productUpdateSchema = productCreateSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one field is required',
  )

export const serviceCreateSchema = z
  .strictObject({
    categoryId: z.uuid('Must be a valid UUID'),
    name,
    description: description.optional(),
    priceType: z.enum(PRICE_TYPES),
    price: rupiah.nullable(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => value.priceType !== 'FIXED' || value.price !== null, {
    path: ['price'],
    message: 'A fixed price is required',
  })

// Updates are checked against the stored row by the service (FIXED needs a
// price after the change).
export const serviceUpdateSchema = z
  .strictObject({
    categoryId: z.uuid('Must be a valid UUID'),
    name,
    description,
    priceType: z.enum(PRICE_TYPES),
    price: rupiah.nullable(),
    isActive: z.boolean(),
  })
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one field is required',
  )

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const CLOSE_TIME = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/

const timeRange = z
  .strictObject({
    open: z.string().regex(TIME, 'Use HH:mm'),
    close: z.string().regex(CLOSE_TIME, 'Use HH:mm'),
  })
  .refine((range) => range.open < range.close, 'Opening must be before closing')

const daySchema = z
  .array(timeRange)
  .max(4)
  .transform((ranges) =>
    [...ranges].sort((a, b) => a.open.localeCompare(b.open)),
  )
  .refine(
    (ranges) =>
      ranges.every(
        (range, index) =>
          index === 0 || (ranges[index - 1]?.close ?? '') <= range.open,
      ),
    'Time ranges must not overlap',
  )

// The existing JSON shape: every weekday present, [] = closed, up to four
// non-overlapping ranges per day; optional note.
export const openingHoursSchema = z
  .strictObject({
    weekly: z.strictObject({
      mon: daySchema,
      tue: daySchema,
      wed: daySchema,
      thu: daySchema,
      fri: daySchema,
      sat: daySchema,
      sun: daySchema,
    }),
    note: optionalText(300),
  })
  .nullable()

export const locationCreateSchema = z.strictObject({
  name,
  address: z
    .string()
    .trim()
    .min(1, 'Address is required')
    .max(ADMIN_LIMITS.addressMaxLength)
    .refine(
      (value) => !CONTROL_EXCEPT_NEWLINES.test(value),
      'Invalid characters',
    ),
  openingHours: openingHoursSchema,
  isActive: z.boolean().optional(),
})

export const locationUpdateSchema = locationCreateSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one field is required',
  )

export const availabilitySchema = z.strictObject({ isAvailable: z.boolean() })

export const idParamSchema = z.strictObject({
  id: z.uuid('Must be a valid UUID'),
})

export const locationServiceParamSchema = z.strictObject({
  id: z.uuid('Must be a valid UUID'),
  serviceId: z.uuid('Must be a valid UUID'),
})

// --- business settings ---------------------------------------------------

const PLATFORM = /^[a-z][a-z0-9_-]{0,29}$/

const socialLinksSchema = z
  .record(
    z.string().regex(PLATFORM, 'Use a short lowercase platform name'),
    z
      .string()
      .trim()
      .max(ADMIN_LIMITS.imageRefMaxLength)
      .refine((value) => {
        try {
          const { protocol } = new URL(value)
          return protocol === 'https:' || protocol === 'http:'
        } catch {
          return false
        }
      }, 'Must be an http(s) URL'),
  )
  .refine(
    (links) => Object.keys(links).length <= ADMIN_LIMITS.socialLinksMax,
    `At most ${ADMIN_LIMITS.socialLinksMax} links`,
  )

export const settingsUpdateSchema = z
  .strictObject({
    businessName: optionalText(ADMIN_LIMITS.businessNameMaxLength).refine(
      (value) => value === null || !ANY_CONTROL.test(value),
      'Invalid characters',
    ),
    whatsappNumber: whatsappSchema,
    logoRef: imageRefSchema,
    qrisImageRef: imageRefSchema,
    socialLinks: socialLinksSchema,
    publicInfo: optionalText(ADMIN_LIMITS.publicInfoMaxLength),
  })
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one field is required',
  )

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>
