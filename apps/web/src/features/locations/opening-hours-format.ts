import type { TimeRange, Weekday } from '@maba-printing/shared'

export const DAY_LABELS: Record<Weekday, string> = {
  mon: 'Senin',
  tue: 'Selasa',
  wed: 'Rabu',
  thu: 'Kamis',
  fri: 'Jumat',
  sat: 'Sabtu',
  sun: 'Minggu',
}

// "08:00" -> "08.00" (Indonesian time notation).
function formatTime(time: string): string {
  return time.replace(':', '.')
}

export function formatRanges(ranges: TimeRange[] | null): string {
  if (ranges === null) return 'Tidak ada informasi'
  if (ranges.length === 0) return 'Tutup'
  return ranges
    .map((range) => `${formatTime(range.open)}–${formatTime(range.close)}`)
    .join(', ')
}
