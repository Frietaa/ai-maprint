import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { ErrorState } from '../../components/ui/DataState.tsx'
import { adminLoginPathFor } from '../auth/safe-redirect.ts'
import { useCurrentUser } from '../auth/use-auth.ts'

// UX guard for the Admin area. The API is the authority (every
// /api/v1/admin route answers 401/403 itself); this only decides what to
// render, and never shows Admin content before the role is known.
export function RequireAdmin({ children }: { children: ReactNode }) {
  const location = useLocation()
  const user = useCurrentUser()

  if (user.isPending) {
    return (
      <p role="status" className="p-8 text-slate-600">
        Memeriksa sesi…
      </p>
    )
  }
  if (user.isError) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <ErrorState
          error={user.error}
          onRetry={() => void user.refetch()}
          retrying={user.isFetching}
        />
      </div>
    )
  }
  if (!user.data) {
    return <Navigate to={adminLoginPathFor(location)} replace />
  }
  if (user.data.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-xl p-8">
        <h1 className="text-2xl font-bold text-slate-900">Khusus Admin</h1>
        <p className="mt-3 text-slate-600">
          Akun Anda tidak memiliki akses ke halaman Admin.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700"
        >
          Kembali ke beranda
        </Link>
      </div>
    )
  }
  return children
}
