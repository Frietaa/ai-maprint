// WhatsApp deep links (PRD §17: deep link only — no API, bot or webhook).
// The number comes from BusinessSettings (KI-011), never from source code.
// Messages carry only the Public Order ID and generic text, never private
// request contents.

// wa.me digits: "0812-3456-7890" / "+62 812 3456 7890" -> "6281234567890".
// null when the configured number is missing or not plausible.
export function whatsappDigits(
  number: string | null | undefined,
): string | null {
  if (!number) return null
  let digits = number.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`
  return digits.length >= 8 && digits.length <= 15 ? digits : null
}

export function orderWhatsappLink(
  number: string | null | undefined,
  publicId: string,
  businessName?: string | null,
): string | null {
  const digits = whatsappDigits(number)
  if (!digits) return null
  const name = businessName?.trim() || 'MABA PRINTING'
  const message = `Halo ${name}, saya ingin membahas pesanan ${publicId}.`
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
