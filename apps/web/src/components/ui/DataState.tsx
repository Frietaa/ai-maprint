import type { ReactNode } from 'react'
import { describeLoadError } from '../../lib/error-message.ts'

// Shared presentational states for data-backed sections.

interface LoadingStateProps {
  label: string
  // Number of placeholder cards to draw.
  count?: number
}

export function LoadingState({ label, count = 3 }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <ul
        aria-hidden="true"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: count }, (_, index) => (
          <li
            key={index}
            className="h-36 rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="h-4 w-2/3 rounded bg-slate-200 motion-safe:animate-pulse" />
            <div className="mt-3 h-3 w-full rounded bg-slate-100 motion-safe:animate-pulse" />
            <div className="mt-2 h-3 w-5/6 rounded bg-slate-100 motion-safe:animate-pulse" />
          </li>
        ))}
      </ul>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  children?: ReactNode
}

export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <p className="font-semibold text-slate-900">{title}</p>
      {children ? (
        <div className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          {children}
        </div>
      ) : null}
    </div>
  )
}

interface ErrorStateProps {
  error: unknown
  onRetry: () => void
  retrying?: boolean
}

export function ErrorState({
  error,
  onRetry,
  retrying = false,
}: ErrorStateProps) {
  const copy = describeLoadError(error)
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center"
    >
      <p className="font-semibold text-red-900">{copy.title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-red-800">
        {copy.description}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-white px-5 text-sm font-medium text-red-900 ring-1 ring-red-300 hover:bg-red-100 disabled:opacity-60"
      >
        {retrying ? 'Memuat ulang…' : 'Coba lagi'}
      </button>
    </div>
  )
}

// Shown while a lazily loaded page (the Admin area) is downloaded.
export function PageLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p role="status" aria-live="polite" className="text-slate-600">
        Memuat halaman…
      </p>
    </div>
  )
}
