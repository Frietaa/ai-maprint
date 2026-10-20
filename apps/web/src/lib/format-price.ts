import type { PriceType } from '@maba-printing/shared'

// The single place prices are formatted for display. Amounts are whole
// Rupiah integers (Rp25.000 -> 25000).
const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export const PRICE_ON_CONFIRMATION = 'Konfirmasi harga'

function isAmount(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function formatRupiah(amount: number): string {
  return rupiah.format(amount)
}

// FIXED with a price -> "Rp 1.500"; REQUIRES_CONFIRMATION -> "Konfirmasi
// harga", or "Mulai Rp 50.000" when an indicative price is configured. Never
// returns null/undefined/NaN or raw enum labels.
export function formatServicePrice(
  priceType: PriceType,
  price: number | null,
): string {
  if (!isAmount(price)) return PRICE_ON_CONFIRMATION
  if (priceType === 'FIXED') return formatRupiah(price)
  return `Mulai ${formatRupiah(price)}`
}

export function formatProductPrice(price: number): string {
  return isAmount(price) ? formatRupiah(price) : PRICE_ON_CONFIRMATION
}
