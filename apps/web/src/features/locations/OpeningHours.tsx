import { parseOpeningHours, WEEKDAYS } from '@maba-printing/shared'
import { DAY_LABELS, formatRanges } from './opening-hours-format.ts'

interface OpeningHoursProps {
  // Raw value from the API; re-validated here so unexpected data can never
  // break the page.
  value: unknown
}

// Weekly opening hours in WIB. Handles closed days, split shifts, unknown
// days, an optional note and missing/malformed data.
export function OpeningHours({ value }: OpeningHoursProps) {
  const hours = parseOpeningHours(value)

  if (!hours) {
    return <p className="text-sm text-slate-500">Jam buka belum tersedia.</p>
  }

  return (
    <div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {WEEKDAYS.map((day) => {
          const ranges = hours.weekly[day]
          return (
            <div key={day} className="contents">
              <dt className="text-slate-600">{DAY_LABELS[day]}</dt>
              <dd
                className={
                  ranges && ranges.length > 0
                    ? 'font-medium text-slate-900'
                    : 'text-slate-500'
                }
              >
                {formatRanges(ranges)}
              </dd>
            </div>
          )
        })}
      </dl>
      <p className="mt-2 text-xs text-slate-500">Waktu setempat (WIB).</p>
      {hours.note ? (
        <p className="mt-2 text-sm text-slate-700">{hours.note}</p>
      ) : null}
    </div>
  )
}
