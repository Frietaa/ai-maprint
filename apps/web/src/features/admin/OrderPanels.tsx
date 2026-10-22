import {
  type AdminOrderDetailDto,
  ADMIN_LIMITS,
  ORDER_STATUS_LABELS,
  type OrderStatus,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUSES,
  type PaymentMethod,
  type PaymentStatus,
  pickupFeeFor,
} from '@maba-printing/shared'
import { type FormEvent, useState } from 'react'
import { FormAlert } from '../../components/ui/FormAlert.tsx'
import { ApiError, buildApiUrl } from '../../lib/api-client.ts'
import { formatDateTimeWib } from '../../lib/format-datetime.ts'
import { formatRupiah } from '../../lib/format-price.ts'
import { formatFileSize } from '../orders/order-validation.ts'
import { adminErrorMessage } from './admin-error-message.ts'
import {
  buttonPrimary,
  buttonSecondary,
  Field,
  inputClass,
  Panel,
} from './AdminUi.tsx'
import { fileDownloadPath, useOrderCommand } from './use-admin.ts'

type Order = AdminOrderDetailDto

// Errors stay next to the form. Success is announced by the page (forms
// remount with the fresh order after a save).
function CommandError({ error }: { error: unknown }) {
  return error ? (
    <FormAlert tone="error">{adminErrorMessage(error)}</FormAlert>
  ) : null
}

export interface Notice {
  tone: 'success' | 'error'
  text: string
}

interface PanelProps {
  order: Order
  onNotice: (notice: Notice) => void
}

// Per-call callbacks: success, and conflicts (another Admin changed the
// order — the detail reloads and the forms remount with fresh values).
function feedback(onNotice: (notice: Notice) => void, success: string) {
  return {
    onSuccess: () => onNotice({ tone: 'success', text: success }),
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        onNotice({ tone: 'error', text: adminErrorMessage(error) })
      }
    },
  }
}

// Whole Rupiah from an input value: "" → null, otherwise a non-negative
// integer (or NaN, rejected by the form).
function parseRupiah(value: string): number | null {
  if (value.trim() === '') return null
  return /^\d+$/.test(value.trim()) ? Number(value.trim()) : Number.NaN
}

export function StatusPanel({ order, onNotice }: PanelProps) {
  const command = useOrderCommand(order.publicId, 'status')
  const [pending, setPending] = useState<OrderStatus | null>(null)

  return (
    <Panel title="Status">
      <p className="text-sm text-slate-600">
        Status saat ini:{' '}
        <strong className="text-slate-900">
          {ORDER_STATUS_LABELS[order.status]}
        </strong>
        {order.completedAt
          ? ` · selesai ${formatDateTimeWib(order.completedAt)}`
          : ''}
      </p>
      {order.allowedTransitions.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          Status akhir — tidak dapat diubah lagi.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {order.allowedTransitions.map((to) => (
            <button
              key={to}
              type="button"
              disabled={command.isPending}
              onClick={() => {
                setPending(to)
                command.mutate(
                  { fromStatus: order.status, toStatus: to },
                  feedback(
                    onNotice,
                    `Status diubah ke ${ORDER_STATUS_LABELS[to]}.`,
                  ),
                )
              }}
              className={
                to === 'CANCELLED'
                  ? `${buttonSecondary} text-red-700`
                  : buttonPrimary
              }
            >
              {command.isPending && pending === to
                ? 'Menyimpan…'
                : `Ubah ke: ${ORDER_STATUS_LABELS[to]}`}
            </button>
          ))}
        </div>
      )}
      <div className="mt-3">
        <CommandError error={command.error} />
      </div>
    </Panel>
  )
}

export function PricingPanel({ order, onNotice }: PanelProps) {
  const command = useOrderCommand(order.publicId, 'pricing')
  const pickup =
    order.type === 'LAPTOP_SERVICE' &&
    order.laptopService?.handoverMethod === 'PICKUP'
  const [estimated, setEstimated] = useState(
    order.estimatedTotal?.toString() ?? '',
  )
  const [final, setFinal] = useState(order.finalTotal?.toString() ?? '')
  const [distance, setDistance] = useState(
    order.laptopService?.distanceKm?.toString() ?? '',
  )
  const [problem, setProblem] = useState<string | null>(null)

  const distanceValue =
    distance.trim() === '' ? null : Number(distance.replace(',', '.'))

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const estimatedTotal = parseRupiah(estimated)
    const finalTotal = parseRupiah(final)
    if (Number.isNaN(estimatedTotal) || Number.isNaN(finalTotal)) {
      setProblem('Isi harga dalam Rupiah bulat tanpa titik, misalnya 25000.')
      return
    }
    if (
      distanceValue !== null &&
      (!Number.isFinite(distanceValue) ||
        distanceValue < 0 ||
        distanceValue > ADMIN_LIMITS.maxDistanceKm)
    ) {
      setProblem('Jarak harus angka kilometer, misalnya 6,5.')
      return
    }
    setProblem(null)
    command.mutate(
      {
        estimatedTotal,
        finalTotal,
        ...(pickup && { distanceKm: distanceValue }),
      },
      feedback(onNotice, 'Harga disimpan.'),
    )
  }

  return (
    <Panel title="Harga">
      <form onSubmit={onSubmit} noValidate className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Perkiraan total (Rp)
            <input
              className={inputClass}
              inputMode="numeric"
              value={estimated}
              onChange={(e) => setEstimated(e.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Total akhir (Rp)
            <input
              className={inputClass}
              inputMode="numeric"
              value={final}
              onChange={(e) => setFinal(e.target.value)}
            />
          </label>
          {pickup ? (
            <label className="text-sm font-medium text-slate-700">
              Jarak penjemputan (km)
              <input
                className={inputClass}
                inputMode="decimal"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                Biaya:{' '}
                {distanceValue !== null &&
                Number.isFinite(distanceValue) &&
                distanceValue >= 0
                  ? formatRupiah(pickupFeeFor(distanceValue))
                  : '—'}{' '}
                (gratis hingga 5 km, Rp2.000 per km berikutnya)
              </span>
            </label>
          ) : null}
        </div>
        <p className="text-xs text-slate-500">
          Mengubah harga tidak mengubah status pembayaran maupun permintaan asli
          pelanggan.
        </p>
        {problem ? <FormAlert tone="error">{problem}</FormAlert> : null}
        <CommandError error={command.error} />
        <button
          type="submit"
          className={buttonPrimary}
          disabled={command.isPending}
        >
          {command.isPending ? 'Menyimpan…' : 'Simpan harga'}
        </button>
      </form>
    </Panel>
  )
}

export function PaymentPanel({ order, onNotice }: PanelProps) {
  const command = useOrderCommand(order.publicId, 'payment')
  const [method, setMethod] = useState<PaymentMethod>(
    order.payment?.method ?? 'CASH',
  )
  const [status, setStatus] = useState<PaymentStatus>(
    order.payment?.status ?? 'UNPAID',
  )
  const [amount, setAmount] = useState(
    order.payment?.amount?.toString() ?? order.finalTotal?.toString() ?? '',
  )
  const [problem, setProblem] = useState<string | null>(null)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const value = parseRupiah(amount)
    if (Number.isNaN(value)) {
      setProblem('Isi jumlah dalam Rupiah bulat, misalnya 25000.')
      return
    }
    setProblem(null)
    command.mutate(
      { method, status, amount: value },
      feedback(onNotice, 'Pembayaran disimpan.'),
    )
  }

  return (
    <Panel title="Pembayaran">
      {order.payment?.status === 'PAID' ? (
        <p className="mb-3 text-sm text-emerald-800">
          Dikonfirmasi lunas
          {order.payment.confirmedBy
            ? ` oleh ${order.payment.confirmedBy.name}`
            : ''}
          {order.payment.confirmedAt
            ? ` · ${formatDateTimeWib(order.payment.confirmedAt)}`
            : ''}
        </p>
      ) : null}
      <form onSubmit={onSubmit} noValidate className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">
            Metode
            <select
              className={inputClass}
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Status
            <select
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as PaymentStatus)}
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PAYMENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Jumlah (Rp)
            <input
              className={inputClass}
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
        </div>
        <p className="text-xs text-slate-500">
          Konfirmasi manual: pilih “Lunas” hanya setelah pembayaran benar-benar
          diterima.
        </p>
        {problem ? <FormAlert tone="error">{problem}</FormAlert> : null}
        <CommandError error={command.error} />
        <button
          type="submit"
          className={buttonPrimary}
          disabled={command.isPending}
        >
          {command.isPending ? 'Menyimpan…' : 'Simpan pembayaran'}
        </button>
      </form>
    </Panel>
  )
}

export function NotesPanel({ order, onNotice }: PanelProps) {
  const command = useOrderCommand(order.publicId, 'notes')
  const [notes, setNotes] = useState(order.adminNotes ?? '')

  return (
    <Panel title="Catatan admin (internal)">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          command.mutate(
            { adminNotes: notes.trim() === '' ? null : notes },
            feedback(onNotice, 'Catatan disimpan.'),
          )
        }}
        className="space-y-3"
      >
        <label className="block text-sm font-medium text-slate-700">
          Catatan
          <textarea
            className={`${inputClass} py-2`}
            rows={4}
            maxLength={ADMIN_LIMITS.adminNotesMaxLength}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <p className="text-xs text-slate-500">
          Hanya terlihat oleh Admin — tidak pernah ditampilkan ke pelanggan.
        </p>
        <CommandError error={command.error} />
        <button
          type="submit"
          className={buttonPrimary}
          disabled={command.isPending}
        >
          {command.isPending ? 'Menyimpan…' : 'Simpan catatan'}
        </button>
      </form>
    </Panel>
  )
}

export function FilesPanel({ order }: { order: Order }) {
  return (
    <Panel title="Dokumen pelanggan">
      {order.files.length === 0 ? (
        <p className="text-sm text-slate-600">Tidak ada dokumen.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {order.files.map((file) => (
            <li
              key={file.id}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <span className="min-w-0 break-all">
                {file.name}{' '}
                <span className="text-slate-500">
                  ({formatFileSize(file.sizeBytes)})
                </span>
              </span>
              {file.deletedAt ? (
                <span className="text-slate-500">
                  Dihapus (retensi) {formatDateTimeWib(file.deletedAt)}
                </span>
              ) : (
                <a
                  href={buildApiUrl(fileDownloadPath(order.publicId, file.id))}
                  className="font-medium text-brand-700 hover:underline"
                  aria-label={`Unduh ${file.name}`}
                >
                  Unduh
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export function OrderFacts({ order }: { order: Order }) {
  return (
    <Panel title="Detail permintaan">
      <dl className="grid gap-3 sm:grid-cols-2">
        <Field label="Pelanggan" value={order.customer.name} />
        <Field label="WhatsApp" value={order.customer.whatsapp} />
        <Field label="Email" value={order.customer.email ?? '—'} />
        <Field
          label="Akun member"
          value={
            order.member
              ? `${order.member.name} (${order.member.email})`
              : 'Tamu'
          }
        />
        <Field
          label="Lokasi"
          value={
            order.location
              ? `${order.location.name} — ${order.location.address}`
              : '—'
          }
        />
        <Field
          label="Waktu selesai yang diinginkan"
          value={
            order.requestedCompletionAt
              ? formatDateTimeWib(order.requestedCompletionAt)
              : '—'
          }
        />
        {order.description ? (
          <Field label="Catatan pelanggan" value={order.description} />
        ) : null}
        {order.laptopService ? (
          <>
            <Field label="Keluhan" value={order.laptopService.complaint} />
            <Field
              label="Penyerahan"
              value={`${order.laptopService.handoverMethod === 'PICKUP' ? 'Dijemput' : 'Antar sendiri'}${
                order.laptopService.handoverAt
                  ? ` · ${formatDateTimeWib(order.laptopService.handoverAt)}`
                  : ''
              }`}
            />
            {order.laptopService.pickupAddress ? (
              <Field
                label="Alamat penjemputan"
                value={order.laptopService.pickupAddress}
              />
            ) : null}
            {order.laptopService.pickupFee !== null ? (
              <Field
                label="Biaya penjemputan"
                value={`${formatRupiah(order.laptopService.pickupFee)} (${order.laptopService.distanceKm} km)`}
              />
            ) : null}
          </>
        ) : null}
        {order.softwareInstallation ? (
          <>
            <Field
              label="Software"
              value={order.softwareInstallation.softwareName}
            />
            <Field
              label="Kebutuhan"
              value={order.softwareInstallation.requirements ?? '—'}
            />
            <Field
              label="Pernyataan lisensi"
              value={order.softwareInstallation.licenseNote ?? '—'}
            />
          </>
        ) : null}
      </dl>
      {order.items.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-md text-left text-sm">
            <caption className="sr-only">Produk dipesan</caption>
            <thead className="text-xs text-slate-500 uppercase">
              <tr>
                <th scope="col" className="py-1 pr-3">
                  Produk
                </th>
                <th scope="col" className="py-1 pr-3">
                  Jumlah
                </th>
                <th scope="col" className="py-1 pr-3">
                  Harga (snapshot)
                </th>
                <th scope="col" className="py-1">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, index) => (
                <tr key={`${item.name}-${index}`}>
                  <td className="py-1 pr-3">{item.name}</td>
                  <td className="py-1 pr-3">{item.quantity}</td>
                  <td className="py-1 pr-3">
                    {item.unitPrice !== null
                      ? formatRupiah(item.unitPrice)
                      : '—'}
                  </td>
                  <td className="py-1">
                    {item.subtotal !== null ? formatRupiah(item.subtotal) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Panel>
  )
}

export function AdminTimeline({ order }: { order: Order }) {
  return (
    <Panel title="Riwayat status">
      <ol className="space-y-2 text-sm">
        {order.timeline.map((entry, index) => (
          <li key={`${entry.at}-${index}`}>
            <span className="font-medium text-slate-900">
              {ORDER_STATUS_LABELS[entry.status]}
            </span>
            <span className="text-slate-600">
              {' '}
              · {formatDateTimeWib(entry.at)}
              {entry.changedBy
                ? ` · ${entry.changedBy.name}`
                : ' · pelanggan (tamu)'}
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  )
}
