import type { ReactNode } from 'react'
import { Link } from 'react-router'

interface AuthCardProps {
  title: string
  intro: string
  children: ReactNode
  // Link to the other auth page, e.g. "Belum punya akun? Daftar".
  footer: ReactNode
}

// Shared frame of the sign-in and sign-up pages: a compact centered card
// (not a full-screen panel) plus the "continue as guest" option, which is
// plain navigation — no account, no session.
export function AuthCard({ title, intro, children, footer }: AuthCardProps) {
  return (
    <section className="mx-auto w-full max-w-md px-4 py-10 sm:py-14">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{intro}</p>
        <div className="mt-6">{children}</div>
        <p className="mt-6 text-center text-sm text-slate-600">{footer}</p>
      </div>

      <div className="mt-6 text-center">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-lg px-4 font-medium text-brand-700 hover:bg-brand-50"
        >
          Lanjut sebagai tamu
        </Link>
        <p className="mt-1 text-sm text-slate-600">
          Tanpa akun, Anda tetap dapat melihat layanan, katalog, dan lokasi.
        </p>
      </div>
    </section>
  )
}
