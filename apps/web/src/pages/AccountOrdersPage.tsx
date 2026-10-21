import { ORDER_TYPE_LABELS } from '@maba-printing/shared'
import { useState } from 'react'
import { Link } from 'react-router'
import { PageMeta } from '../components/layout/PageMeta.tsx'
import { EmptyState, ErrorState } from '../components/ui/DataState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { pageMeta } from '../config/seo.ts'
import { RequireMember } from '../features/auth/RequireMember.tsx'
import { StatusBadge } from '../features/orders/OrderTimeline.tsx'
import { useMemberOrders } from '../features/orders/use-orders.ts'
import { formatDateWib } from '../lib/format-datetime.ts'
import { formatRupiah } from '../lib/format-price.ts'

export function AccountOrdersPage() {
  return (
    <RequireMember>
      <PageMeta {...pageMeta.accountOrders} />
      <PageHeader eyebrow="Akun" title="Riwayat Pesanan">
        <p>Pesanan yang Anda ajukan saat masuk ke akun ini.</p>
      </PageHeader>
      <OrderHistory />
    </RequireMember>
  )
}

function OrderHistory() {
  const [page, setPage] = useState(1)
  const orders = useMemberOrders(page)

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <Link
        to="/account"
        className="text-sm font-medium text-brand-700 hover:underline"
      >
        ← Kembali ke akun
      </Link>
      {orders.isPending ? (
        <p role="status" className="text-slate-600">
          Memuat riwayat pesanan…
        </p>
      ) : orders.isError ? (
        <ErrorState
          error={orders.error}
          onRetry={() => void orders.refetch()}
          retrying={orders.isFetching}
        />
      ) : orders.data.data.length === 0 ? (
        <EmptyState title="Belum ada pesanan">
          Pesanan yang Anda ajukan dari halaman layanan akan muncul di sini.
        </EmptyState>
      ) : (
        <>
          <ul className="space-y-3">
            {orders.data.data.map((order) => {
              const total = order.finalTotal ?? order.estimatedTotal
              return (
                <li key={order.publicId}>
                  <Link
                    to={`/account/orders/${order.publicId}`}
                    className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-600"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono font-semibold break-all text-slate-900">
                        {order.publicId}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {ORDER_TYPE_LABELS[order.type]} · diajukan{' '}
                      {formatDateWib(order.createdAt)}
                      {order.requestedCompletionAt
                        ? ` · diinginkan selesai ${formatDateWib(order.requestedCompletionAt)}`
                        : ''}
                      {total !== null
                        ? ` · ${order.finalTotal !== null ? 'total' : 'perkiraan'} ${formatRupiah(total)}`
                        : ''}
                    </p>
                  </Link>
                </li>
              )
            })}
          </ul>
          {orders.data.meta.totalPages > 1 ? (
            <nav
              aria-label="Halaman riwayat"
              className="flex items-center justify-between gap-3"
            >
              <button
                type="button"
                disabled={page <= 1 || orders.isFetching}
                onClick={() => setPage((p) => p - 1)}
                className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium ring-1 ring-slate-300 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <p className="text-sm text-slate-600">
                Halaman {orders.data.meta.page} dari{' '}
                {orders.data.meta.totalPages}
              </p>
              <button
                type="button"
                disabled={
                  page >= orders.data.meta.totalPages || orders.isFetching
                }
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium ring-1 ring-slate-300 disabled:opacity-50"
              >
                Berikutnya
              </button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  )
}
