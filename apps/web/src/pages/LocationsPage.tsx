import { PageMeta } from '../components/layout/PageMeta.tsx'
import { pageMeta } from '../config/seo.ts'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/ui/DataState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { LocationCard } from '../features/locations/LocationCard.tsx'
import { useLocations } from '../features/locations/use-locations.ts'

export function LocationsPage() {
  const locations = useLocations()

  return (
    <>
      <PageMeta {...pageMeta.locations} />
      <PageHeader eyebrow="Kunjungi kami" title="Lokasi">
        Alamat dan jam buka lokasi kami. Silakan datang ke lokasi terdekat.
      </PageHeader>
      <section
        aria-label="Daftar lokasi"
        className="mx-auto max-w-6xl px-4 py-10 sm:px-6"
      >
        {locations.isPending ? (
          <LoadingState label="Memuat daftar lokasi…" />
        ) : locations.isError ? (
          <ErrorState
            error={locations.error}
            onRetry={() => void locations.refetch()}
            retrying={locations.isFetching}
          />
        ) : locations.data.length === 0 ? (
          <EmptyState title="Belum ada lokasi yang ditampilkan">
            Informasi lokasi sedang disiapkan. Silakan kembali lagi nanti.
          </EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locations.data.map((location) => (
              <li key={location.id}>
                <LocationCard location={location} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
