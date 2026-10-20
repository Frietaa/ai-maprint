// Early, Indonesian form feedback mirroring the API rules (AUTH_LIMITS).
// The API stays authoritative; these checks only spare a round trip.
import { AUTH_LIMITS } from '@maba-printing/shared'

export type FieldErrors<K extends string> = Partial<Record<K, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const PASSWORD_HINT = `Minimal ${AUTH_LIMITS.passwordMinLength} karakter. Gunakan kalimat yang mudah Anda ingat, tetapi sulit ditebak orang lain.`

export function validateName(name: string): string | undefined {
  const value = name.trim()
  if (value === '') return 'Nama wajib diisi.'
  if (value.length > AUTH_LIMITS.nameMaxLength) {
    return `Nama maksimal ${AUTH_LIMITS.nameMaxLength} karakter.`
  }
  return undefined
}

export function validateEmail(email: string): string | undefined {
  const value = email.trim()
  if (value === '') return 'Email wajib diisi.'
  if (value.length > AUTH_LIMITS.emailMaxLength || !EMAIL_PATTERN.test(value)) {
    return 'Masukkan alamat email yang valid.'
  }
  return undefined
}

// Sign-in: presence and upper bound only.
export function validatePasswordInput(password: string): string | undefined {
  if (password === '') return 'Kata sandi wajib diisi.'
  if (password.length > AUTH_LIMITS.passwordMaxLength) {
    return `Kata sandi maksimal ${AUTH_LIMITS.passwordMaxLength} karakter.`
  }
  return undefined
}

// Sign-up: the full policy (not trimmed; spaces are allowed).
export function validateNewPassword(password: string): string | undefined {
  if (password.length < AUTH_LIMITS.passwordMinLength) {
    return `Kata sandi minimal ${AUTH_LIMITS.passwordMinLength} karakter.`
  }
  if (password.length > AUTH_LIMITS.passwordMaxLength) {
    return `Kata sandi maksimal ${AUTH_LIMITS.passwordMaxLength} karakter.`
  }
  return undefined
}

// Optional WhatsApp number: digits, spaces, dashes, optional leading "+".
export function validateWhatsapp(whatsapp: string): string | undefined {
  const value = whatsapp.trim()
  if (value === '') return undefined
  const digits = value.replace(/\D/g, '').length
  if (
    value.length > AUTH_LIMITS.whatsappMaxLength ||
    !/^\+?[0-9][0-9 -]*[0-9]$/.test(value) ||
    digits < AUTH_LIMITS.whatsappMinDigits ||
    digits > AUTH_LIMITS.whatsappMaxDigits
  ) {
    return 'Masukkan nomor WhatsApp yang valid, misalnya 0812-3456-7890.'
  }
  return undefined
}

export function hasErrors<K extends string>(errors: FieldErrors<K>): boolean {
  return Object.values(errors).some((message) => message !== undefined)
}
