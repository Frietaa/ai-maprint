import { describe, expect, it } from 'vitest'
import {
  formatProductPrice,
  formatRupiah,
  formatServicePrice,
} from './format-price.ts'

// Intl uses a non-breaking space between "Rp" and the amount.
const normalize = (text: string) => text.replace(/\s/g, ' ')

describe('price formatting', () => {
  it('formats whole Rupiah with Indonesian grouping', () => {
    expect(normalize(formatRupiah(25000))).toBe('Rp 25.000')
    expect(normalize(formatRupiah(0))).toBe('Rp 0')
    expect(normalize(formatRupiah(1250000))).toBe('Rp 1.250.000')
  })

  it('renders FIXED services as Rupiah', () => {
    expect(normalize(formatServicePrice('FIXED', 1500))).toBe('Rp 1.500')
  })

  it('renders REQUIRES_CONFIRMATION as customer-friendly text', () => {
    expect(formatServicePrice('REQUIRES_CONFIRMATION', null)).toBe(
      'Konfirmasi harga',
    )
    expect(normalize(formatServicePrice('REQUIRES_CONFIRMATION', 50000))).toBe(
      'Mulai Rp 50.000',
    )
  })

  it.each([null, Number.NaN, Number.POSITIVE_INFINITY, -1])(
    'never renders an unusable amount (%s)',
    (price) => {
      const text = formatServicePrice('FIXED', price)
      expect(text).toBe('Konfirmasi harga')
      expect(text).not.toMatch(/NaN|null|undefined|FIXED/)
    },
  )

  it('formats product prices', () => {
    expect(normalize(formatProductPrice(3000))).toBe('Rp 3.000')
    expect(formatProductPrice(Number.NaN)).toBe('Konfirmasi harga')
  })
})
