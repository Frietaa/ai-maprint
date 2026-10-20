// Request-body schemas for authentication and the member profile. Strict
// objects: unknown fields such as `role`, `isActive` or `googleId` are
// rejected. Every field is bounded so no oversized value reaches hashing or
// the database.
import { AUTH_LIMITS } from '@maba-printing/shared'
import { z } from 'zod'
import { normalizeEmail } from '../utils/email.js'

// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/

export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(AUTH_LIMITS.nameMaxLength)
  .refine((value) => !CONTROL_CHARACTERS.test(value), 'Invalid characters')

// Normalized before validation and storage. The raw length is bounded first.
export const emailSchema = z
  .string()
  .max(AUTH_LIMITS.emailMaxLength * 2)
  .transform(normalizeEmail)
  .pipe(z.email('Invalid email address').max(AUTH_LIMITS.emailMaxLength))

// Not trimmed: whitespace is a legitimate password character. No
// composition rules. The maximum keeps Argon2id work bounded.
export const newPasswordSchema = z
  .string()
  .min(AUTH_LIMITS.passwordMinLength)
  .max(AUTH_LIMITS.passwordMaxLength)

// Sign-in only checks presence and the upper bound, so the policy minimum
// is not revealed per attempt and over-long input never reaches Argon2id.
const passwordInputSchema = z
  .string()
  .min(1, 'Password is required')
  .max(AUTH_LIMITS.passwordMaxLength)

// WhatsApp/contact number (profile information, not an identity). Digits,
// spaces and dashes with an optional leading "+", 8–15 digits. "" and null
// mean "no number". Stored trimmed, as typed.
const WHATSAPP_PATTERN = /^\+?[0-9][0-9 -]*[0-9]$/

function isWhatsappNumber(value: string): boolean {
  const digits = value.replace(/\D/g, '').length
  return (
    WHATSAPP_PATTERN.test(value) &&
    digits >= AUTH_LIMITS.whatsappMinDigits &&
    digits <= AUTH_LIMITS.whatsappMaxDigits
  )
}

export const whatsappSchema = z
  .string()
  .trim()
  .max(AUTH_LIMITS.whatsappMaxLength)
  .nullable()
  .transform((value) => (value === '' ? null : value))
  .refine(
    (value) => value === null || isWhatsappNumber(value),
    'Invalid WhatsApp number',
  )

export const registerSchema = z.strictObject({
  name: nameSchema,
  email: emailSchema,
  password: newPasswordSchema,
  whatsapp: whatsappSchema.optional(),
})

export const loginSchema = z.strictObject({
  email: emailSchema,
  password: passwordInputSchema,
})

export const googleLoginSchema = z.strictObject({
  credential: z
    .string()
    .min(1, 'Credential is required')
    .max(AUTH_LIMITS.googleCredentialMaxLength),
})

export const updateProfileSchema = z
  .strictObject({
    name: nameSchema.optional(),
    whatsapp: whatsappSchema.optional(),
  })
  .refine(
    (value) => value.name !== undefined || value.whatsapp !== undefined,
    'At least one field is required',
  )

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
