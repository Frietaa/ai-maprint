import {
  type OpeningHours,
  WEEKDAYS,
  type Weekday,
} from '@maba-printing/shared'

export type EditableHours = Record<Weekday, { open: string; close: string }[]>

// Editor state from stored hours: unknown days start as closed.
export function editableHours(hours: OpeningHours | null): EditableHours {
  return Object.fromEntries(
    WEEKDAYS.map((day) => [
      day,
      hours?.weekly[day] ? [...hours.weekly[day]] : [],
    ]),
  ) as EditableHours
}
