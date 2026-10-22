import {
  type AdminOrderSummaryDto,
  ORDER_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@maba-printing/shared'
import { Link } from 'react-router'
import { formatDateTimeWib } from '../../lib/format-datetime.ts'
import { formatRupiah } from '../../lib/format-price.ts'
import { StatusBadge } from '../orders/OrderTimeline.tsx'
import { tableClass, tableWrap, td, th } from './AdminUi.tsx'

export function OrderTable({
  orders,
  caption,
}: {
  orders: readonly AdminOrderSummaryDto[]
  caption: string
}) {
  return (
    <div className={tableWrap}>
      <table className={tableClass}>
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th scope="col" className={th}>
              ID pesanan
            </th>
            <th scope="col" className={th}>
              Jenis
            </th>
            <th scope="col" className={th}>
              Status
            </th>
            <th scope="col" className={th}>
              Pelanggan
            </th>
            <th scope="col" className={th}>
              Lokasi
            </th>
            <th scope="col" className={th}>
              Diajukan
            </th>
            <th scope="col" className={th}>
              Total
            </th>
            <th scope="col" className={th}>
              Pembayaran
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => {
            const total = order.finalTotal ?? order.estimatedTotal
            return (
              <tr key={order.publicId}>
                <td className={td}>
                  <Link
                    to={`/admin/orders/${order.publicId}`}
                    className="font-mono font-medium text-brand-700 hover:underline"
                  >
                    {order.publicId}
                  </Link>
                </td>
                <td className={td}>{ORDER_TYPE_LABELS[order.type]}</td>
                <td className={td}>
                  <StatusBadge status={order.status} />
                </td>
                <td className={td}>{order.customerName}</td>
                <td className={td}>{order.location?.name ?? '—'}</td>
                <td className={td}>{formatDateTimeWib(order.createdAt)}</td>
                <td className={td}>
                  {total !== null
                    ? `${formatRupiah(total)}${order.finalTotal === null ? ' (perkiraan)' : ''}`
                    : '—'}
                </td>
                <td className={td}>
                  {order.paymentStatus
                    ? PAYMENT_STATUS_LABELS[order.paymentStatus]
                    : 'Belum dicatat'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
