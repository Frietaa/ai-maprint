import { Link } from 'react-router'

export function AdminNotFoundPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        Halaman tidak ditemukan
      </h1>
      <Link
        to="/admin"
        className="mt-4 inline-block font-medium text-brand-700 hover:underline"
      >
        Ke dashboard
      </Link>
    </div>
  )
}
