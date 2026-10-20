import { Link } from 'react-router'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../components/ui/DataState.tsx'
import { useLocations } from '../locations/use-locations.ts'

const PREVIEW_LIMIT = 3

// Up to three active locations from the API, linking to /locations.
export function LocationPreview() {
  const locations = useLocations()

  if (locations.isPending) {
    return <LoadingState label="Memuat lokasi…" />
  }
  if (locations.isError) {
    return (
      <ErrorState
        error={locations.error}
        onRetry={() => void locations.refetch()}
        retrying={locations.isFetching}
      />
    )
  }
  if (locations.data.length === 0) {
    return (
      <EmptyState title="Informasi lokasi sedang disiapkan">
        Silakan kembali lagi nanti.
      </EmptyState>
    )
  }

  const preview = locations.data.slice(0, PREVIEW_LIMIT)
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {preview.map((location) => (
        <li
          key={location.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900">{location.name}</h3>
          <address className="mt-1 text-sm text-slate-600 not-italic">
            {location.address}
          </address>
          <Link
            to="/locations"
            className="mt-3 inline-block py-1 text-sm font-medium text-brand-700 hover:underline"
          >
            Jam buka<span className="sr-only"> {location.name}</span>
            <span aria-hidden="true"> →</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
