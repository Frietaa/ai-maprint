import {
  HANDOVER_METHOD_LABELS,
  type MemberOrderDetailDto,
  ORDER_TYPE_LABELS,
} from '@maba-printing/shared'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { PageMeta } from '../components/layout/PageMeta.tsx'
import { ErrorState } from '../components/ui/DataState.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { pageMeta } from '../config/seo.ts'
import { RequireMember } from '../features/auth/RequireMember.tsx'
import {
  OrderTimeline,
  StatusBadge,
} from '../features/orders/OrderTimeline.tsx'
import { formatFileSize } from '../features/orders/order-validation.ts'
import { useMemberOrder } from '../features/orders/use-orders.ts'
import { PaymentInfo } from '../features/payment/PaymentInfo.tsx'
import { ApiError } from '../lib/api-client.ts'
import { formatDateTimeWib } from '../lib/format-datetime.ts'
import { formatRupiah } from '../lib/format-price.ts'

export function AccountOrderDetailPage() {
  const { publicId = '' } = useParams()
  return (
    <RequireMember>
      <PageMeta {...pageMeta.accountOrderDetail} />
      <OrderDetail publicId={publicId} />
    </RequireMember>
  )
}

function OrderDetail({ publicId }: { publicId: string }) {
  const order = useMemberOrder(publicId)
  const back = (
    <Link
      to="/account/orders"
      className="text-sm font-medium text-brand-700 hover:underline"
    >
      ← Riwayat pesanan
    </Link>
  )

  if (order.isPending) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <p role="status" className="text-slate-600">
          Memuat pesanan…
        </p>
      </div>
    )
  }
  if (order.isError) {
    const missing =
      order.error instanceof ApiError &&
      (order.error.status === 404 || order.error.status === 400)
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-16 sm:px-6">
        {back}
        {missing ? (
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Pesanan tidak ditemukan
            </h1>
            <p className="mt-2 text-slate-600">
              Pesanan ini tidak ada atau bukan milik akun Anda.
            </p>
          </div>
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
  return (
    <>
      <PageHeader
        eyebrow={ORDER_TYPE_LABELS[data.type]}
        title={data.publicId}
      />
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
        {back}
        <Card title="Ringkasan">
          <div className="mb-4">
            <StatusBadge status={data.status} />
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Item label="Diajukan" value={formatDateTimeWib(data.createdAt)} />
            {data.requestedCompletionAt ? (
              <Item
                label="Waktu selesai yang diinginkan"
                value={formatDateTimeWib(data.requestedCompletionAt)}
              />
            ) : null}
            {data.location ? (
              <Item
                label="Lokasi"
                value={`${data.location.name} — ${data.location.address}`}
              />
            ) : null}
            {data.estimatedTotal !== null ? (
              <Item
                label="Perkiraan total"
                value={formatRupiah(data.estimatedTotal)}
              />
            ) : null}
            <Item
              label="Total akhir"
              value={
                data.finalTotal !== null
                  ? formatRupiah(data.finalTotal)
                  : 'Belum dikonfirmasi'
              }
            />
          </dl>
        </Card>

        <Card title="Data kontak pada pesanan">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Item label="Nama" value={data.customer.name} />
            <Item label="WhatsApp" value={data.customer.whatsapp} />
            {data.customer.email ? (
              <Item label="Email" value={data.customer.email} />
            ) : null}
          </dl>
        </Card>

        <TypeDetails data={data} />

        <PaymentInfo
          publicId={data.publicId}
          status={data.status}
          payment={data.payment}
        />

        <Card title="Riwayat status">
          <OrderTimeline entries={data.timeline} />
        </Card>
      </div>
    </>
  )
}

function TypeDetails({ data }: { data: MemberOrderDetailDto }) {
  return (
    <Card title="Detail permintaan">
      <div className="space-y-4">
        {data.description ? (
          <Item
            label="Catatan / kebutuhan"
            value={data.description}
            multiline
          />
        ) : null}
        {data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-md text-left text-sm">
              <caption className="sr-only">Produk yang dipesan</caption>
              <thead className="text-slate-500">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Produk
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Jumlah
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Harga
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((item, index) => (
                  <tr key={`${item.name}-${index}`}>
                    <td className="py-2 pr-3 text-slate-900">{item.name}</td>
                    <td className="py-2 pr-3">{item.quantity}</td>
                    <td className="py-2 pr-3">
                      {item.unitPrice !== null
                        ? formatRupiah(item.unitPrice)
                        : '—'}
                    </td>
                    <td className="py-2">
                      {item.subtotal !== null
                        ? formatRupiah(item.subtotal)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {data.files.length > 0 ? (
          <div>
            <p className="text-sm text-slate-500">File yang dikirim</p>
            <ul className="mt-1 space-y-1 text-sm text-slate-900">
              {data.files.map((file, index) => (
                <li key={`${file.name}-${index}`} className="break-all">
                  {file.name}{' '}
                  <span className="text-slate-500">
                    ({formatFileSize(file.sizeBytes)})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {data.laptopService ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <Item
              label="Keluhan"
              value={data.laptopService.complaint}
              multiline
            />
            <Item
              label="Cara penyerahan"
              value={HANDOVER_METHOD_LABELS[data.laptopService.handoverMethod]}
            />
            {data.laptopService.handoverAt ? (
              <Item
                label="Waktu penyerahan"
                value={formatDateTimeWib(data.laptopService.handoverAt)}
              />
            ) : null}
            {data.laptopService.pickupAddress ? (
              <Item
                label="Alamat penjemputan"
                value={data.laptopService.pickupAddress}
                multiline
              />
            ) : null}
            {data.laptopService.distanceKm !== null ? (
              <Item
                label="Jarak"
                value={`${data.laptopService.distanceKm.toLocaleString('id-ID')} km`}
              />
            ) : null}
            {data.laptopService.pickupFee !== null ? (
              <Item
                label="Biaya penjemputan"
                value={formatRupiah(data.laptopService.pickupFee)}
              />
            ) : null}
          </dl>
        ) : null}
        {data.softwareInstallation ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <Item
              label="Software"
              value={data.softwareInstallation.softwareName}
            />
            {data.softwareInstallation.requirements ? (
              <Item
                label="Kebutuhan & catatan"
                value={data.softwareInstallation.requirements}
                multiline
              />
            ) : null}
            {data.softwareInstallation.licenseNote ? (
              <Item
                label="Pernyataan lisensi"
                value={data.softwareInstallation.licenseNote}
                multiline
              />
            ) : null}
          </dl>
        ) : null}
      </div>
    </Card>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Item({
  label,
  value,
  multiline = false,
}: {
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd
        className={`mt-0.5 font-medium break-words text-slate-900 ${multiline ? 'whitespace-pre-line' : ''}`}
      >
        {value}
      </dd>
    </div>
  )
}
