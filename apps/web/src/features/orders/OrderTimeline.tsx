import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
  type OrderTimelineEntryDto,
} from '@maba-printing/shared'
import { formatDateTimeWib } from '../../lib/format-datetime.ts'

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone =
    status === 'CANCELLED'
      ? 'bg-red-50 text-red-800 ring-red-200'
      : status === 'COMPLETED' || status === 'READY'
        ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
        : 'bg-brand-50 text-brand-800 ring-brand-100'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${tone}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}

// Status history (status + time only; never who changed it).
export function OrderTimeline({
  entries,
}: {
  entries: readonly OrderTimelineEntryDto[]
}) {
  return (
    <ol
      aria-label="Riwayat status"
      className="space-y-3 border-l-2 border-slate-200 pl-4"
    >
      {entries.map((entry, index) => (
        <li key={`${entry.status}-${entry.at}-${index}`}>
          <p className="font-medium text-slate-900">
            {ORDER_STATUS_LABELS[entry.status]}
          </p>
          <p className="text-sm text-slate-600">
            {formatDateTimeWib(entry.at)}
          </p>
        </li>
      ))}
    </ol>
  )
}
