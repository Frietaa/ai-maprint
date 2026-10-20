import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  eyebrow?: string
  children?: ReactNode
}

// The page's single h1 with optional eyebrow label and intro text.
export function PageHeader({ title, eyebrow, children }: PageHeaderProps) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {eyebrow ? (
          <p className="text-sm font-semibold text-brand-700">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        {children ? (
          <div className="mt-4 max-w-2xl text-base text-slate-600">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  )
}
