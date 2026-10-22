import { ORDER_TYPE_LABELS } from '@maba-printing/shared'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { PageMeta } from '../../components/layout/PageMeta.tsx'
import { ErrorState } from '../../components/ui/DataState.tsx'
import { AdminPageTitle } from '../../features/admin/AdminUi.tsx'
import {
  AdminTimeline,
  FilesPanel,
  type Notice,
  NotesPanel,
  OrderFacts,
  PaymentPanel,
  PricingPanel,
  StatusPanel,
} from '../../features/admin/OrderPanels.tsx'
import { useAdminOrder } from '../../features/admin/use-admin.ts'
import { StatusBadge } from '../../features/orders/OrderTimeline.tsx'
import { ApiError } from '../../lib/api-client.ts'
import { formatDateTimeWib } from '../../lib/format-datetime.ts'

export function AdminOrderDetailPage() {
  const { publicId = '' } = useParams()
  const order = useAdminOrder(publicId)
  const [notice, setNotice] = useState<Notice | null>(null)

  const back = (
    <Link
      to="/admin/orders"
      className="text-sm font-medium text-brand-700 hover:underline"
    >
      ← Antrian pesanan
    </Link>
  )

  if (order.isPending) {
    return (
      <p role="status" className="text-slate-600">
        Memuat pesanan…
      </p>
    )
  }
  if (order.isError) {
    const missing =
      order.error instanceof ApiError &&
      (order.error.status === 404 || order.error.status === 400)
    return (
      <div className="space-y-4">
        {back}
        {missing ? (
          <h1 className="text-2xl font-bold text-slate-900">
            Pesanan tidak ditemukan
          </h1>
        ) : (
          <ErrorState
            error={order.error}
            onRetry={() => void order.refetch()}
            retrying={order.isFetching}
          />
        )}
      </div>
    )
  }

  const data = order.data
  // `key` remounts the forms with fresh values whenever the order changes
  // (e.g. after another Admin's update was reloaded).
  return (
    <>
      <PageMeta
        title={`Pesanan ${data.publicId}`}
        description="Detail pesanan."
      />
      {back}
      <div className="mt-3">
        <AdminPageTitle title={data.publicId}>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{ORDER_TYPE_LABELS[data.type]}</span>
            <StatusBadge status={data.status} />
            <span>Diajukan {formatDateTimeWib(data.createdAt)}</span>
          </div>
        </AdminPageTitle>
      </div>
      <p
        role="status"
        className={`mb-3 min-h-5 text-sm font-medium ${
          notice?.tone === 'error' ? 'text-red-700' : 'text-emerald-800'
        }`}
      >
        {notice?.text}
      </p>
      <div className="grid gap-4 lg:grid-cols-2" key={data.updatedAt}>
        <div className="space-y-4">
          <StatusPanel order={data} onNotice={setNotice} />
          <OrderFacts order={data} />
          <FilesPanel order={data} />
          <AdminTimeline order={data} />
        </div>
        <div className="space-y-4">
          <PricingPanel order={data} onNotice={setNotice} />
          <PaymentPanel order={data} onNotice={setNotice} />
          <NotesPanel order={data} onNotice={setNotice} />
        </div>
      </div>
    </>
  )
}
