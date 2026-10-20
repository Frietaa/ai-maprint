import { useId, useMemo, useState } from 'react'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../components/ui/DataState.tsx'
import { useLocations } from '../locations/use-locations.ts'
import { ServiceCard } from './ServiceCard.tsx'
import { type ServiceLine, selectServicesForLine } from './service-lines.ts'
import { useServices } from './use-services.ts'

interface ServiceCatalogProps {
  line: ServiceLine
  // Accessible name of the catalog section, e.g. "Daftar layanan printing".
  label: string
}

// Database-backed service catalog for one business line, with an optional
// location filter (server-side `locationId` filter).
export function ServiceCatalog({ line, label }: ServiceCatalogProps) {
  const [locationId, setLocationId] = useState('')
  const selectId = useId()
  const locations = useLocations()
  const services = useServices({ locationId: locationId || undefined })

  const locationNames = useMemo(
    () =>
      locations.data
        ? new Map(
            locations.data.map((location) => [location.id, location.name]),
          )
        : undefined,
    [locations.data],
  )
  const selection = useMemo(
    () => (services.data ? selectServicesForLine(services.data, line) : null),
    [services.data, line],
  )

  const locationOptions = locations.data ?? []

  return (
    <section aria-label={label}>
      {locationOptions.length > 1 ? (
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-slate-700"
          >
            Tampilkan layanan di lokasi
          </label>
          <select
            id={selectId}
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800"
          >
            <option value="">Semua lokasi</option>
            {locationOptions.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {services.isPending ? (
        <LoadingState label="Memuat daftar layanan…" />
      ) : services.isError ? (
        <ErrorState
          error={services.error}
          onRetry={() => void services.refetch()}
          retrying={services.isFetching}
        />
      ) : selection === null || selection.groups.length === 0 ? (
        <EmptyState
          title={
            locationId
              ? 'Belum ada layanan di lokasi ini'
              : 'Belum ada layanan yang ditampilkan'
          }
        >
          {locationId
            ? 'Coba pilih lokasi lain atau tampilkan semua lokasi.'
            : 'Daftar layanan sedang disiapkan. Silakan kembali lagi nanti.'}
        </EmptyState>
      ) : (
        <div className="space-y-10" aria-busy={services.isFetching}>
          {selection.isFallback ? (
            <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
              Menampilkan seluruh layanan kami yang tersedia.
            </p>
          ) : null}
          {selection.groups.map((group) => (
            <section
              key={group.category.id}
              aria-labelledby={`kategori-${group.category.id}`}
            >
              <h2
                id={`kategori-${group.category.id}`}
                className="text-xl font-semibold text-slate-900"
              >
                {group.category.name}
              </h2>
              {group.category.description ? (
                <p className="mt-1 text-sm text-slate-600">
                  {group.category.description}
                </p>
              ) : null}
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.services.map((service) => (
                  <li key={service.id}>
                    <ServiceCard
                      service={service}
                      locationNames={locationNames}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}
