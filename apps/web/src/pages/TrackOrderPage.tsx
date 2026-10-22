import { ORDER_TYPE_LABELS, parsePublicOrderId } from '@maba-printing/shared'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { PageMeta } from '../components/layout/PageMeta.tsx'
import { FormAlert } from '../components/ui/FormAlert.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { TextField } from '../components/ui/TextField.tsx'
import { pageMeta } from '../config/seo.ts'
import {
  OrderTimeline,
  StatusBadge,
} from '../features/orders/OrderTimeline.tsx'
import { useTrackedOrder } from '../features/orders/use-orders.ts'
import { PaymentInfo } from '../features/payment/PaymentInfo.tsx'
import { ApiError } from '../lib/api-client.ts'
import { formatDateTimeWib } from '../lib/format-datetime.ts'

function stateId(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'publicId' in state) {
    return typeof state.publicId === 'string' ? state.publicId : ''
  }
  return ''
}

function lookupError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.kind === 'network') {
      return 'Tidak dapat terhubung. Periksa koneksi internet Anda, lalu coba lagi.'
    }
    if (error.status === 404) {
      return 'Pesanan tidak ditemukan. Periksa kembali ID pesanan Anda.'
    }
    if (error.status === 400) return 'Format ID pesanan tidak valid.'
    if (error.status === 429) {
      return 'Terlalu banyak pencarian. Tunggu beberapa saat, lalu coba lagi.'
    }
  }
  return 'Terjadi gangguan pada server kami. Silakan coba lagi.'
}

// Guest tracking by exact Public Order ID. Fetches only after an explicit
// submit; shows the safe public status only.
export function TrackOrderPage() {
  const location = useLocation()
  const initial = stateId(location.state)
  const [input, setInput] = useState(initial)
  const [inputError, setInputError] = useState<string | undefined>()
  const [publicId, setPublicId] = useState<string | null>(
    parsePublicOrderId(initial),
  )
  const tracked = useTrackedOrder(publicId)
  const result = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (tracked.data) result.current?.focus()
  }, [tracked.data])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = parsePublicOrderId(input)
    if (!parsed) {
      setInputError('Masukkan ID pesanan seperti MP-2026-7K92D4QX8M7RA.')
      return
    }
    setInputError(undefined)
    if (parsed === publicId) void tracked.refetch()
    else setPublicId(parsed)
  }

  return (
    <>
      <PageMeta {...pageMeta.trackOrder} />
      <PageHeader eyebrow="Pesanan" title="Lacak Pesanan">
        Masukkan ID pesanan dari tanda terima Anda untuk melihat statusnya.
      </PageHeader>
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        <form noValidate onSubmit={onSubmit} className="space-y-4">
          <TextField
            label="ID pesanan"
            name="publicId"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            error={inputError}
          />
          <button
            type="submit"
            disabled={tracked.isFetching}
            className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {tracked.isFetching ? 'Mencari…' : 'Lacak'}
          </button>
        </form>

        {tracked.isFetching && !tracked.data ? (
          <p role="status" className="text-slate-600">
            Mencari pesanan…
          </p>
        ) : tracked.isError ? (
          <FormAlert tone="error">{lookupError(tracked.error)}</FormAlert>
        ) : tracked.data ? (
          <section
            aria-labelledby="hasil-lacak"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2
                id="hasil-lacak"
                ref={result}
                tabIndex={-1}
                className="font-mono text-lg font-semibold break-all text-slate-900 outline-none"
              >
                {tracked.data.publicId}
              </h2>
              <StatusBadge status={tracked.data.status} />
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">Jenis</dt>
                <dd className="font-medium text-slate-900">
                  {ORDER_TYPE_LABELS[tracked.data.type]}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Diajukan</dt>
                <dd className="font-medium text-slate-900">
                  {formatDateTimeWib(tracked.data.createdAt)}
                </dd>
              </div>
              {tracked.data.requestedCompletionAt ? (
                <div>
                  <dt className="text-sm text-slate-500">
                    Waktu selesai yang diinginkan
                  </dt>
                  <dd className="font-medium text-slate-900">
                    {formatDateTimeWib(tracked.data.requestedCompletionAt)}
                  </dd>
                </div>
              ) : null}
              {tracked.data.location ? (
                <div>
                  <dt className="text-sm text-slate-500">Lokasi</dt>
                  <dd className="font-medium text-slate-900">
                    {tracked.data.location.name}
                  </dd>
                </div>
              ) : null}
            </dl>
            <h3 className="mt-6 text-sm font-semibold text-slate-900">
              Riwayat status
            </h3>
            <div className="mt-3">
              <OrderTimeline entries={tracked.data.timeline} />
            </div>
          </section>
        ) : null}
        {/* General payment instructions only: guest tracking never shows
            the order's payment state (PRD §16). */}
        {tracked.data &&
        !tracked.isError &&
        tracked.data.status !== 'CANCELLED' &&
        tracked.data.status !== 'COMPLETED' ? (
          <PaymentInfo
            publicId={tracked.data.publicId}
            status={tracked.data.status}
          />
        ) : null}
      </div>
    </>
  )
}
