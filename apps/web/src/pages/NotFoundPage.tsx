import { PageMeta } from '../components/layout/PageMeta.tsx'
import { pageMeta } from '../config/seo.ts'
import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <PageMeta {...pageMeta.notFound} />
      <p className="text-sm font-semibold text-brand-700">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-4 text-slate-600">
        Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700"
      >
        Kembali ke beranda
      </Link>
    </section>
  )
}
