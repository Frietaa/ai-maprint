import {
  type CustomerPaymentDto,
  type OrderStatus,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@maba-printing/shared'
import { useId, useState } from 'react'
import { formatRupiah } from '../../lib/format-price.ts'
import { resolveImageRef } from '../../lib/image-ref.ts'
import { orderWhatsappLink } from '../../lib/whatsapp.ts'
import { useBusinessIdentity } from '../settings/use-public-settings.ts'

interface PaymentInfoProps {
  // Order the customer pays for (WhatsApp hand-off message only).
  publicId: string
  status: OrderStatus
  // The member's own payment state (member order detail only); undefined
  // for guests, whose public views never show payment state (PRD §16).
  payment?: CustomerPaymentDto | null
  // false where the page already offers the WhatsApp link (receipt).
  showWhatsapp?: boolean
  headingLevel?: 'h2' | 'h3'
}

// How to pay (PRD §18): Cash at the location or the owner's static QRIS.
// Payment is confirmed manually by an Admin — nothing here verifies or
// changes the payment state, and the copy never claims otherwise.
export function PaymentInfo({
  publicId,
  status,
  payment,
  showWhatsapp = true,
  headingLevel: Heading = 'h2',
}: PaymentInfoProps) {
  const headingId = useId()
  const { name, settings } = useBusinessIdentity()
  const [qrisFailed, setQrisFailed] = useState(false)
  const qrisSrc = qrisFailed ? null : resolveImageRef(settings?.qrisImageRef)
  const whatsapp = showWhatsapp
    ? orderWhatsappLink(settings?.whatsappNumber, publicId, name)
    : null
  const paid = payment?.status === 'PAID'
  const cancelled = status === 'CANCELLED'
  const showInstructions = !paid && !cancelled

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <Heading id={headingId} className="text-lg font-semibold text-slate-900">
        Pembayaran
      </Heading>

      {payment !== undefined ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-slate-500">Status pembayaran</dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {PAYMENT_STATUS_LABELS[payment?.status ?? 'UNPAID']}
            </dd>
          </div>
          {payment ? (
            <div>
              <dt className="text-sm text-slate-500">Metode</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {PAYMENT_METHOD_LABELS[payment.method]}
              </dd>
            </div>
          ) : null}
          {payment?.amount !== null && payment?.amount !== undefined ? (
            <div>
              <dt className="text-sm text-slate-500">Jumlah</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {formatRupiah(payment.amount)}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {paid ? (
        <p className="mt-4 text-sm text-slate-700">
          Pembayaran Anda sudah dikonfirmasi oleh admin. Terima kasih.
        </p>
      ) : cancelled ? (
        <p className="mt-4 text-sm text-slate-700">
          Pesanan ini dibatalkan, sehingga tidak perlu melakukan pembayaran.
        </p>
      ) : null}

      {showInstructions ? (
        <div className="mt-4 space-y-4 text-sm text-slate-700">
          <p>
            Lakukan pembayaran setelah total akhir dikonfirmasi oleh admin. Anda
            dapat membayar dengan:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium text-slate-900">
                {PAYMENT_METHOD_LABELS.CASH}
              </span>{' '}
              — langsung di lokasi saat penyerahan atau pengambilan.
            </li>
            <li>
              <span className="font-medium text-slate-900">
                {PAYMENT_METHOD_LABELS.QRIS_STATIC}
              </span>{' '}
              —{' '}
              {qrisSrc
                ? 'pindai kode QRIS di bawah ini dengan aplikasi pembayaran Anda.'
                : 'kode QRIS tersedia di lokasi atau dapat diminta melalui WhatsApp.'}
            </li>
          </ul>
          {qrisSrc ? (
            <figure className="w-fit max-w-full rounded-xl border border-slate-200 p-3">
              <img
                src={qrisSrc}
                alt={`Kode QRIS ${name} untuk pembayaran`}
                width={240}
                height={240}
                loading="lazy"
                decoding="async"
                onError={() => setQrisFailed(true)}
                className="h-auto w-60 max-w-full object-contain"
              />
              <figcaption className="mt-2 text-xs text-slate-600">
                QRIS statis {name}. Pastikan nama penerima sesuai sebelum
                membayar.
              </figcaption>
            </figure>
          ) : null}
          <p className="rounded-lg bg-amber-50 p-3 text-amber-900">
            Pembayaran dikonfirmasi secara manual oleh admin. Status pembayaran
            tidak berubah otomatis setelah Anda membayar — kirim bukti
            pembayaran melalui WhatsApp dengan menyebutkan ID pesanan{' '}
            <span className="font-mono break-all">{publicId}</span>.
          </p>
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-lg px-5 text-sm font-medium text-emerald-800 ring-1 ring-emerald-600 hover:bg-emerald-50"
            >
              Kirim bukti pembayaran lewat WhatsApp
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
