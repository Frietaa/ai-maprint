import type { ReactNode } from 'react'
import { Link } from 'react-router'

// Informational next step for service pages. Online requests/orders belong
// to later phases, so this only explains how to proceed today.
export function NextStepNotice({ children }: { children?: ReactNode }) {
  return (
    <aside
      aria-labelledby="langkah-berikutnya"
      className="rounded-xl border border-brand-100 bg-brand-50 p-6"
    >
      <h2
        id="langkah-berikutnya"
        className="text-lg font-semibold text-slate-900"
      >
        Langkah berikutnya
      </h2>
      <p className="mt-2 text-sm text-slate-700">
        {children ??
          'Datang langsung ke lokasi kami atau hubungi kontak yang tercantum di bagian bawah halaman untuk membahas kebutuhan Anda.'}
      </p>
      <Link
        to="/locations"
        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 text-sm font-medium text-white hover:bg-brand-700"
      >
        Lihat lokasi &amp; jam buka
      </Link>
    </aside>
  )
}
