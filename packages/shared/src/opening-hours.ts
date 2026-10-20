// Opening hours as stored in locations.opening_hours (JSONB):
//
//   { "weekly": { "mon": [{ "open": "08:00", "close": "17:00" }], ... },
//     "note": "optional free text" }
//
// Times are 24h "HH:mm" local business time (Asia/Jakarta). The database does
// not validate this shape, so both the API and the web app normalize it with
// parseOpeningHours() instead of trusting it.

export const WEEKDAYS = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const

export type Weekday = (typeof WEEKDAYS)[number]

export interface TimeRange {
  open: string
  close: string
}

export interface OpeningHours {
  // [] = closed that day; null = no (valid) information for that day.
  weekly: Record<Weekday, TimeRange[] | null>
  note: string | null
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const CLOSE_TIME = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseRange(value: unknown): TimeRange | null {
  if (!isRecord(value)) return null
  const { open, close } = value
  if (typeof open !== 'string' || typeof close !== 'string') return null
  if (!TIME.test(open) || !CLOSE_TIME.test(close) || open >= close) return null
  return { open, close }
}

function parseDay(value: unknown): TimeRange[] | null {
  if (!Array.isArray(value)) return null
  if (value.length === 0) return []
  const ranges = value
    .map(parseRange)
    .filter((range): range is TimeRange => range !== null)
  // Entries present but none valid: the day's information is unusable.
  if (ranges.length === 0) return null
  return ranges.sort((a, b) => a.open.localeCompare(b.open))
}

// Returns a normalized OpeningHours value, or null when the input is not an
// object with a `weekly` object. Invalid days/ranges degrade individually.
export function parseOpeningHours(value: unknown): OpeningHours | null {
  if (!isRecord(value) || !isRecord(value.weekly)) return null
  const source = value.weekly
  const weekly = Object.fromEntries(
    WEEKDAYS.map((day) => [day, parseDay(source[day])]),
  ) as Record<Weekday, TimeRange[] | null>
  const note =
    typeof value.note === 'string' && value.note.trim() !== ''
      ? value.note.trim()
      : null
  return { weekly, note }
}
