import { ORDER_STATUS_LABELS, type OrderStatus } from '@maba-printing/shared'
import { Link } from 'react-router'
import { PageMeta } from '../../components/layout/PageMeta.tsx'
import { ErrorState } from '../../components/ui/DataState.tsx'
import { AdminPageTitle, Panel } from '../../features/admin/AdminUi.tsx'
import { OrderTable } from '../../features/admin/OrderTable.tsx'
import { useAdminDashboard } from '../../features/admin/use-admin.ts'

const OPEN_STATUSES: OrderStatus[] = [
  'SUBMITTED',
  'CONFIRMED',
  'IN_PROGRESS',
  'READY',
]

export function AdminDashboardPage() {
  const dashboard = useAdminDashboard()
  return (
    <>
      <PageMeta title="Dashboard Admin" description="Ringkasan operasional." />
      <AdminPageTitle title="Dashboard" />
      {dashboard.isPending ? (
        <p role="status" className="text-slate-600">
          Memuat ringkasan…
        </p>
      ) : dashboard.isError ? (
        <ErrorState
          error={dashboard.error}
          onRetry={() => void dashboard.refetch()}
          retrying={dashboard.isFetching}
        />
      ) : (
        <div className="space-y-6">
          <ul
            aria-label="Pesanan per status"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            {OPEN_STATUSES.map((status) => (
              <li key={status}>
                <Link
                  to={`/admin/orders?status=${status}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-400"
                >
                  <p className="text-sm text-slate-600">
                    {ORDER_STATUS_LABELS[status]}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {dashboard.data.statusCounts[status]}
                  </p>
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/admin/orders?paymentStatus=PENDING_CONFIRMATION"
                className="block rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm hover:border-amber-400"
              >
                <p className="text-sm text-amber-900">Pembayaran perlu dicek</p>
                <p className="mt-1 text-2xl font-bold text-amber-950">
                  {dashboard.data.pendingPaymentConfirmations}
                </p>
              </Link>
            </li>
          </ul>
          <Panel
            title="Pesanan terbaru"
            actions={
              <Link
                to="/admin/orders"
                className="text-sm font-medium text-brand-700 hover:underline"
              >
                Semua pesanan
              </Link>
            }
          >
            {dashboard.data.recentOrders.length === 0 ? (
              <p className="text-sm text-slate-600">Belum ada pesanan.</p>
            ) : (
              <OrderTable
                orders={dashboard.data.recentOrders}
                caption="Pesanan terbaru"
              />
            )}
          </Panel>
        </div>
      )}
    </>
  )
}
