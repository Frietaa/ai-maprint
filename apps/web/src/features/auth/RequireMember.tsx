import type { ReactNode } from 'react'
import { NoIndex } from '../../components/layout/NoIndex.tsx'
import { Navigate, useLocation } from 'react-router'
import { ErrorState } from '../../components/ui/DataState.tsx'
import { loginPathFor } from './safe-redirect.ts'
import { useCurrentUser } from './use-auth.ts'

// UX guard for member pages. It only decides what to render — the API is
// the authority and rejects every protected request without a valid MEMBER
// session (401/403). Protected content never renders before the session is
// known.
export function RequireMember({ children }: { children: ReactNode }) {
  const location = useLocation()
  const {
    data: user,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useCurrentUser()

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p role="status" aria-live="polite" className="text-slate-600">
          Memeriksa sesi…
        </p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState
          error={error}
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to={loginPathFor(location)}
        replace
        state={{ notice: 'Silakan masuk untuk membuka akun.' }}
      />
    )
  }

  if (user.role !== 'MEMBER') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Halaman khusus member
        </h1>
        <p className="mt-3 text-slate-600">
          Halaman akun ini hanya tersedia untuk akun member.
        </p>
      </div>
    )
  }

  return (
    <>
      <NoIndex />
      {children}
    </>
  )
}
