import {
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  type OrderReceiptDto,
} from '@maba-printing/shared'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { formatDateTimeWib } from '../../lib/format-datetime.ts'
import { formatRupiah } from '../../lib/format-price.ts'
import { orderWhatsappLink } from '../../lib/whatsapp.ts'
import { useBusinessIdentity } from '../settings/use-public-settings.ts'

interface OrderReceiptProps {
  receipt: OrderReceiptDto
  onNewRequest: () => void
}

// Submission receipt. The Public Order ID is the only identifier shown; the
// WhatsApp link (only when a number is configured) carries just that ID.
export function OrderReceipt({ receipt, onNewRequest }: OrderReceiptProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  const [copy, setCopy] = useState<'idle' | 'copied' | 'failed'>('idle')
  const { name, settings } = useBusinessIdentity()
  const whatsapp = orderWhatsappLink(
    settings?.whatsappNumber,
    receipt.publicId,
    name,
  )

  useEffect(() => {
    heading.current?.focus()
  }, [])

  async function copyId() {
    try {
      await navigator.clipboard.writeText(receipt.publicId)
      setCopy('copied')
    } catch {
      setCopy('failed')
    }
  }

  return (
    <section
      aria-labelledby="struk-pesanan"
      className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm"
    >
      <h2
        id="struk-pesanan"
        ref={heading}
        tabIndex={-1}
        className="text-xl font-semibold text-slate-900 outline-none"
      >
        Permintaan berhasil dikirim
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Simpan ID pesanan ini untuk melacak status permintaan Anda.
      </p>

      <div className="mt-4 rounded-xl bg-slate-50 p-4">
        <p className="text-sm text-slate-600">ID pesanan</p>
        <p className="mt-1 font-mono text-xl font-semibold tracking-wide break-all text-slate-900 sm:text-2xl">
          {receipt.publicId}
        </p>
        <button
          type="button"
          onClick={() => void copyId()}
          className="mt-3 inline-flex min-h-10 items-center rounded-lg px-4 text-sm font-medium text-brand-700 ring-1 ring-brand-600 hover:bg-brand-50"
        >
          Salin ID pesanan
        </button>
        <p role="status" className="mt-2 text-sm text-slate-600">
          {copy === 'copied'
            ? 'ID pesanan disalin.'
            : copy === 'failed'
              ? 'Tidak dapat menyalin otomatis. Salin ID di atas secara manual.'
              : ''}
        </p>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <Item label="Jenis" value={ORDER_TYPE_LABELS[receipt.type]} />
        <Item label="Status" value={ORDER_STATUS_LABELS[receipt.status]} />
        {receipt.requestedCompletionAt ? (
          <Item
            label="Waktu selesai yang diinginkan"
            value={formatDateTimeWib(receipt.requestedCompletionAt)}
          />
        ) : null}
        {receipt.estimatedTotal !== null ? (
          <Item
            label="Perkiraan total"
            value={formatRupiah(receipt.estimatedTotal)}
          />
        ) : null}
      </dl>
      <p className="mt-3 text-sm text-slate-600">
        Harga akhir dan detail pekerjaan akan kami konfirmasi.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/track-order"
          state={{ publicId: receipt.publicId }}
          className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Lacak pesanan
        </Link>
        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-lg px-5 text-sm font-medium text-emerald-800 ring-1 ring-emerald-600 hover:bg-emerald-50"
          >
            Diskusikan lewat WhatsApp
          </a>
        ) : null}
        <button
          type="button"
          onClick={onNewRequest}
          className="inline-flex min-h-11 items-center rounded-lg px-5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
        >
          Buat permintaan baru
        </button>
      </div>
    </section>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
    </div>
  )
}
