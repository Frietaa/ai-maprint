import { describe, expect, it } from 'vitest'
import {
  formatDateTimeWib,
  nowAsWibInput,
  wibInputToIso,
} from './format-datetime.ts'
import { orderWhatsappLink, whatsappDigits } from './whatsapp.ts'

describe('WhatsApp deep link', () => {
  it.each([
    ['0812-3456-7890', '6281234567890'],
    ['+62 812 3456 7890', '6281234567890'],
    ['6281234567890', '6281234567890'],
  ])('normalizes %s to wa.me digits', (input, digits) => {
    expect(whatsappDigits(input)).toBe(digits)
  })

  it.each([null, undefined, '', 'tidak ada', '123'])(
    'returns null for %j',
    (input) => {
      expect(whatsappDigits(input)).toBeNull()
      expect(orderWhatsappLink(input, 'MP-2026-7K92D4QX8M7RA')).toBeNull()
    },
  )

  it('carries only the public order ID and generic text', () => {
    const link = orderWhatsappLink(
      '+62 800-0000-0000',
      'MP-2026-7K92D4QX8M7RA',
      'MABA PRINTING',
    )
    expect(link).toBe(
      'https://wa.me/6280000000000?text=' +
        encodeURIComponent(
          'Halo MABA PRINTING, saya ingin membahas pesanan MP-2026-7K92D4QX8M7RA.',
        ),
    )
  })

  it('URL-encodes the business name', () => {
    const link = orderWhatsappLink(
      '0812345678',
      'MP-2026-7K92D4QX8M7RA',
      'A&B #1',
    )
    expect(link).toContain(encodeURIComponent('Halo A&B #1,'))
    expect(link).not.toContain('&B')
  })
})

describe('WIB date helpers', () => {
  it('reads datetime-local values as WIB', () => {
    expect(wibInputToIso('2026-10-22T14:00')).toBe('2026-10-22T07:00:00.000Z')
    expect(wibInputToIso('')).toBeNull()
    expect(wibInputToIso('2026-13-40T99:00')).toBeNull()
  })

  it('formats instants in WIB', () => {
    expect(formatDateTimeWib('2026-10-22T07:00:00.000Z')).toMatch(
      /22 Oktober 2026.*14[.:]00 WIB$/,
    )
  })

  it('gives the current WIB time for input minimums', () => {
    expect(nowAsWibInput(new Date('2026-12-31T18:30:00Z'))).toBe(
      '2027-01-01T01:30',
    )
  })
})
