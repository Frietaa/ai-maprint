import { WEEKDAYS, type Weekday } from '@maba-printing/shared'
import { buttonSecondary, inputClass } from './AdminUi.tsx'
import type { EditableHours } from './opening-hours-input.ts'

const DAY_LABELS: Record<Weekday, string> = {
  mon: 'Senin',
  tue: 'Selasa',
  wed: 'Rabu',
  thu: 'Kamis',
  fri: 'Jumat',
  sat: 'Sabtu',
  sun: 'Minggu',
}

// Structured weekly editor: per day "closed" or up to four time ranges
// (split shifts). The API validates the same rules (HH:mm, open < close,
// no overlaps) and stores the existing JSON shape.
export function OpeningHoursEditor({
  value,
  onChange,
}: {
  value: EditableHours
  onChange: (value: EditableHours) => void
}) {
  function setDay(day: Weekday, ranges: { open: string; close: string }[]) {
    onChange({ ...value, [day]: ranges })
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-700">
        Jam buka (WIB)
      </legend>
      {WEEKDAYS.map((day) => {
        const ranges = value[day]
        return (
          <div
            key={day}
            className="flex flex-wrap items-center gap-2 rounded-md bg-slate-50 p-2"
          >
            <span className="w-16 text-sm font-medium text-slate-800">
              {DAY_LABELS[day]}
            </span>
            {ranges.length === 0 ? (
              <span className="text-sm text-slate-500">Tutup</span>
            ) : null}
            {ranges.map((range, index) => (
              <span key={index} className="flex items-center gap-1">
                <input
                  type="time"
                  aria-label={`${DAY_LABELS[day]} buka ${index + 1}`}
                  className={`${inputClass} mt-0 w-28`}
                  value={range.open}
                  onChange={(e) =>
                    setDay(
                      day,
                      ranges.map((r, i) =>
                        i === index ? { ...r, open: e.target.value } : r,
                      ),
                    )
                  }
                />
                <span aria-hidden="true">–</span>
                <input
                  type="time"
                  aria-label={`${DAY_LABELS[day]} tutup ${index + 1}`}
                  className={`${inputClass} mt-0 w-28`}
                  value={range.close}
                  onChange={(e) =>
                    setDay(
                      day,
                      ranges.map((r, i) =>
                        i === index ? { ...r, close: e.target.value } : r,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  className="min-h-9 rounded-md px-2 text-sm text-red-700 hover:bg-red-50"
                  aria-label={`Hapus jam ${DAY_LABELS[day]} ${index + 1}`}
                  onClick={() =>
                    setDay(
                      day,
                      ranges.filter((_r, i) => i !== index),
                    )
                  }
                >
                  ×
                </button>
              </span>
            ))}
            {ranges.length < 4 ? (
              <button
                type="button"
                className={buttonSecondary}
                aria-label={`Tambah jam ${DAY_LABELS[day]}`}
                onClick={() =>
                  setDay(day, [...ranges, { open: '08:00', close: '17:00' }])
                }
              >
                + Jam
              </button>
            ) : null}
          </div>
        )
      })}
    </fieldset>
  )
}
