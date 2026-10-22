import {
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  ORDER_TYPE_LABELS,
  ORDER_TYPES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUSES,
  parsePublicOrderId,
} from '@maba-printing/shared'
import { type FormEvent, useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageMeta } from '../../components/layout/PageMeta.tsx'
import { ErrorState } from '../../components/ui/DataState.tsx'
import { adminErrorMessage } from '../../features/admin/admin-error-message.ts'
import {
  AdminPageTitle,
  buttonPrimary,
  buttonSecondary,
  inputClass,
} from '../../features/admin/AdminUi.tsx'
import { OrderTable } from '../../features/admin/OrderTable.tsx'
import {
  useAdminCatalog,
  useAdminOrders,
} from '../../features/admin/use-admin.ts'

const FILTERS = [
  'status',
  'type',
  'paymentStatus',
  'locationId',
  'publicId',
] as const

// Order queue: filters live in the URL so a view can be bookmarked.
export function AdminOrdersPage() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const query = Object.fromEntries(
    FILTERS.map((key) => [key, params.get(key) ?? undefined]),
  )
  const orders = useAdminOrders({ ...query, page: String(page) })
  const locations = useAdminCatalog('locations')
  const [search, setSearch] = useState(params.get('publicId') ?? '')
  const [searchError, setSearchError] = useState<string | null>(null)

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  function onSearch(event: FormEvent) {
    event.preventDefault()
    if (search.trim() === '') {
      setSearchError(null)
      setFilter('publicId', '')
      return
    }
    const id = parsePublicOrderId(search)
    if (!id) {
      setSearchError('Format ID pesanan tidak valid.')
      return
    }
    setSearchError(null)
    setFilter('publicId', id)
  }

  const select = (
    key: (typeof FILTERS)[number],
    label: string,
    options: [string, string][],
  ) => (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select
        className={inputClass}
        value={params.get(key) ?? ''}
        onChange={(event) => setFilter(key, event.target.value)}
      >
        <option value="">Semua</option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <>
      <PageMeta title="Pesanan" description="Antrian pesanan." />
      <AdminPageTitle title="Pesanan" />
      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        {select(
          'status',
          'Status',
          ORDER_STATUSES.map((s) => [s, ORDER_STATUS_LABELS[s]]),
        )}
        {select(
          'type',
          'Jenis',
          ORDER_TYPES.map((t) => [t, ORDER_TYPE_LABELS[t]]),
        )}
        {select(
          'paymentStatus',
          'Pembayaran',
          PAYMENT_STATUSES.map((s) => [s, PAYMENT_STATUS_LABELS[s]]),
        )}
        {select(
          'locationId',
          'Lokasi',
          (locations.data ?? []).map((l) => [l.id, l.name]),
        )}
        <form onSubmit={onSearch} noValidate>
          <label className="block text-sm font-medium text-slate-700">
            ID pesanan (persis)
            <input
              className={inputClass}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-invalid={searchError ? true : undefined}
              aria-describedby={searchError ? 'cari-error' : undefined}
              spellCheck={false}
            />
          </label>
          {searchError ? (
            <p id="cari-error" className="mt-1 text-sm text-red-700">
              {searchError}
            </p>
          ) : null}
          <button type="submit" className={`${buttonPrimary} mt-2 w-full`}>
            Cari
          </button>
        </form>
      </div>

      {orders.isPending ? (
        <p role="status" className="text-slate-600">
          Memuat pesanan…
        </p>
      ) : orders.isError ? (
        <div>
          <p className="mb-2 text-sm text-red-700">
            {adminErrorMessage(orders.error)}
          </p>
          <ErrorState
            error={orders.error}
            onRetry={() => void orders.refetch()}
            retrying={orders.isFetching}
          />
        </div>
      ) : orders.data.data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">
          Tidak ada pesanan yang cocok.
        </p>
      ) : (
        <>
          <OrderTable orders={orders.data.data} caption="Daftar pesanan" />
          <nav
            aria-label="Halaman pesanan"
            className="mt-4 flex items-center justify-between gap-3"
          >
            <button
              type="button"
              className={buttonSecondary}
              disabled={page <= 1}
              onClick={() => setFilter('page', String(page - 1))}
            >
              Sebelumnya
            </button>
            <p className="text-sm text-slate-600">
              Halaman {orders.data.meta.page} dari{' '}
              {Math.max(1, orders.data.meta.totalPages)} ·{' '}
              {orders.data.meta.total} pesanan
            </p>
            <button
              type="button"
              className={buttonSecondary}
              disabled={page >= orders.data.meta.totalPages}
              onClick={() => setFilter('page', String(page + 1))}
            >
              Berikutnya
            </button>
          </nav>
        </>
      )}
    </>
  )
}
