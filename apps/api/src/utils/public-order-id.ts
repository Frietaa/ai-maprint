// Public Order ID generation (PRD §13, Architecture §22). The ID is the
// capability that unlocks guest tracking, so it is random, not sequential
// and never derived from the internal UUID:
//
//   MP-<YYYY>-<13 Crockford base-32 characters>   e.g. MP-2026-7K92D4QX8M7RA
//
// 13 characters × 5 bits = 65 bits from crypto.randomBytes (9 bytes = 72
// bits, the first 65 used). The year is the business year in Asia/Jakarta.
// Crockford's alphabet omits I, L, O and U, so IDs are easy to read aloud
// and type. Uniqueness is finally enforced by orders_public_id_key.
import { randomBytes } from 'node:crypto'

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const RANDOM_CHARACTERS = 13

export type PublicOrderIdGenerator = (now: Date) => string

const jakartaYear = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
})

export function businessYear(now: Date): string {
  return jakartaYear.format(now)
}

// Encodes the first `count` 5-bit groups of `bytes` (big-endian).
export function encodeBase32(bytes: Uint8Array, count: number): string {
  let out = ''
  let buffer = 0
  let bits = 0
  let index = 0
  while (out.length < count) {
    if (bits < 5) {
      const next = bytes[index]
      if (next === undefined) throw new Error('Not enough random bytes')
      buffer = ((buffer << 8) | next) & 0xffff
      bits += 8
      index += 1
    }
    out += ALPHABET[(buffer >> (bits - 5)) & 31]
    bits -= 5
  }
  return out
}

export const generatePublicOrderId: PublicOrderIdGenerator = (now) =>
  `MP-${businessYear(now)}-${encodeBase32(randomBytes(9), RANDOM_CHARACTERS)}`
