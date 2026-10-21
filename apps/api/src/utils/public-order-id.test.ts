import {
  parsePublicOrderId,
  PUBLIC_ORDER_ID_PATTERN,
} from '@maba-printing/shared'
import { describe, expect, it } from 'vitest'
import {
  businessYear,
  encodeBase32,
  generatePublicOrderId,
} from './public-order-id.js'

describe('generatePublicOrderId', () => {
  it('produces MP-<year>-<13 Crockford base-32 characters>', () => {
    const id = generatePublicOrderId(new Date('2026-06-01T00:00:00Z'))
    expect(id).toMatch(/^MP-2026-[0-9A-HJKMNP-TV-Z]{13}$/)
    expect(id).toMatch(PUBLIC_ORDER_ID_PATTERN)
    expect(id.length).toBeLessThanOrEqual(32)
  })

  it('uses the business year in Asia/Jakarta (UTC+7)', () => {
    // 2026-12-31 18:00 UTC is already 2027-01-01 01:00 WIB.
    expect(businessYear(new Date('2026-12-31T18:00:00Z'))).toBe('2027')
    expect(businessYear(new Date('2026-12-31T16:59:59Z'))).toBe('2026')
  })

  it('is random: no repeats and every alphabet position is used', () => {
    const now = new Date()
    const ids = new Set<string>()
    const seen = new Set<string>()
    for (let i = 0; i < 2000; i += 1) {
      const id = generatePublicOrderId(now)
      ids.add(id)
      for (const char of id.slice(8)) seen.add(char)
    }
    expect(ids.size).toBe(2000)
    expect(seen.size).toBe(32)
    for (const excluded of ['I', 'L', 'O', 'U']) {
      expect(seen.has(excluded)).toBe(false)
    }
  })
})

describe('encodeBase32', () => {
  it('encodes 5-bit groups big-endian (65 bits from 9 bytes)', () => {
    expect(encodeBase32(new Uint8Array(9), 13)).toBe('0000000000000')
    expect(encodeBase32(new Uint8Array(9).fill(0xff), 13)).toBe('ZZZZZZZZZZZZZ')
    // 0b00001_00010_... = "12..."
    expect(encodeBase32(new Uint8Array([0b00001000, 0b10000000]), 2)).toBe('12')
  })

  it('refuses to read past the random bytes', () => {
    expect(() => encodeBase32(new Uint8Array(1), 2)).toThrow()
  })
})

describe('parsePublicOrderId', () => {
  it('trims and uppercases', () => {
    expect(parsePublicOrderId('  mp-2026-7k92d4qx8m7ra \n')).toBe(
      'MP-2026-7K92D4QX8M7RA',
    )
  })

  it.each([
    '',
    'MP-2026',
    'MP-2026-7K92D4QX8M7R',
    'MP-2026-7K92D4QX8M7RAB',
    'MP-2026-7K92D4QX8M7RI',
    'MP-2026-7K92D4QX8M7R%',
    'MP-2026-*',
    'XX-2026-7K92D4QX8M7RA',
    'MP-26-7K92D4QX8M7RA',
    "MP-2026-7K92D4QX8M7RA' OR 1=1",
    '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  ])('rejects %j', (raw) => {
    expect(parsePublicOrderId(raw)).toBeNull()
  })
})
