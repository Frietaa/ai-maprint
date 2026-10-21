import type { OrderReceiptDto } from '@maba-printing/shared'
import { type FormEventHandler, type ReactNode, useEffect, useRef } from 'react'
import { FormAlert } from '../../components/ui/FormAlert.tsx'
import { OrderReceipt } from './OrderReceipt.tsx'
import { orderErrorMessage } from './order-error-message.ts'

interface OrderFormFrameProps {
  id: string
  title: string
  intro: ReactNode
  onSubmit: FormEventHandler<HTMLFormElement>
  pending: boolean
  error: unknown
  // Client-side problem not tied to one field (e.g. "add a file or a
  // description").
  formError?: string | null
  receipt: OrderReceiptDto | undefined
  onNewRequest: () => void
  submitLabel?: string
  children: ReactNode
}

// Shared frame of the four order forms: section heading, error summary,
// submit button (disabled while sending, so a double click cannot send
// twice) and the receipt that replaces the form after success.
export function OrderFormFrame({
  id,
  title,
  intro,
  onSubmit,
  pending,
  error,
  formError,
  receipt,
  onNewRequest,
  submitLabel = 'Kirim permintaan',
  children,
}: OrderFormFrameProps) {
  const alert = useRef<HTMLDivElement>(null)
  const message = error ? orderErrorMessage(error) : (formError ?? null)

  useEffect(() => {
    if (message) alert.current?.focus()
  }, [message])

  return (
    <section
      id={id}
      aria-labelledby={`${id}-judul`}
      className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {receipt ? (
        <OrderReceipt receipt={receipt} onNewRequest={onNewRequest} />
      ) : (
        <>
          <h2
            id={`${id}-judul`}
            className="text-xl font-semibold text-slate-900"
          >
            {title}
          </h2>
          <div className="mt-2 text-sm text-slate-600">{intro}</div>
          <form noValidate onSubmit={onSubmit} className="mt-6 space-y-6">
            {message ? (
              <FormAlert ref={alert} tone="error">
                {message}
              </FormAlert>
            ) : null}
            {children}
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
            >
              {pending ? 'Mengirim…' : submitLabel}
            </button>
            {pending ? (
              <p role="status" className="sr-only">
                Sedang mengirim permintaan.
              </p>
            ) : null}
          </form>
        </>
      )}
    </section>
  )
}
