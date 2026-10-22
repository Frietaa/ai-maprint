import type { ReactNode } from 'react'

// Small building blocks of the dense operational Admin UI.

export function AdminPageTitle({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {children}
    </div>
  )
}

export function Panel({
  title,
  children,
  actions,
}: {
  title: string
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <section
      aria-label={title}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  )
}

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 break-words whitespace-pre-line text-slate-900">
        {value}
      </dd>
    </div>
  )
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
        active
          ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
          : 'bg-slate-100 text-slate-600 ring-slate-300'
      }`}
    >
      {active ? 'Aktif' : 'Nonaktif'}
    </span>
  )
}

export const buttonPrimary =
  'inline-flex min-h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60'
export const buttonSecondary =
  'inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-slate-800 ring-1 ring-slate-300 hover:bg-slate-100 disabled:opacity-60'
export const inputClass =
  'mt-1 block min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900'
// `relative`: keeps visually hidden (absolutely positioned) header labels
// inside the scroll container instead of widening the page.
export const tableWrap =
  'relative overflow-x-auto rounded-xl border border-slate-200 bg-white'
export const tableClass = 'w-full min-w-2xl text-left text-sm'
export const th =
  'px-3 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase'
export const td = 'px-3 py-2 align-top text-slate-800'
