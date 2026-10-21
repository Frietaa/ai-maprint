// Business time is WIB (Asia/Jakarta, UTC+7, no daylight saving): instants
// from the API are shown in WIB, and datetime inputs are read as WIB.
const BUSINESS_TIME_ZONE = 'Asia/Jakarta'

const dateTime = new Intl.DateTimeFormat('id-ID', {
  timeZone: BUSINESS_TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const dateOnly = new Intl.DateTimeFormat('id-ID', {
  timeZone: BUSINESS_TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

// "Kamis, 22 Oktober 2026 pukul 14.00 WIB"
export function formatDateTimeWib(iso: string): string {
  return `${dateTime.format(new Date(iso))} WIB`
}

// "22 Okt 2026"
export function formatDateWib(iso: string): string {
  return dateOnly.format(new Date(iso))
}

// <input type="datetime-local"> value ("2026-10-22T14:00") read as WIB.
// null for an empty or malformed value.
export function wibInputToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = new Date(`${value}:00+07:00`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

// The current WIB time as a datetime-local value (for `min`).
export function nowAsWibInput(now: Date = new Date()): string {
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  return wib.toISOString().slice(0, 16)
}
