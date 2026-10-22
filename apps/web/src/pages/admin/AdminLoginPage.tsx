import { NoIndex } from '../../components/layout/NoIndex.tsx'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { PageMeta } from '../../components/layout/PageMeta.tsx'
import { FormAlert } from '../../components/ui/FormAlert.tsx'
import { TextField } from '../../components/ui/TextField.tsx'
import { authErrorMessage } from '../../features/auth/auth-error-message.ts'
import { safeAdminRedirectPath } from '../../features/auth/safe-redirect.ts'
import { useCurrentUser, useLogin } from '../../features/auth/use-auth.ts'
import {
  hasErrors,
  validateEmail,
  validatePasswordInput,
} from '../../features/auth/validation.ts'

// Admin sign-in (email + password only). It uses the normal secure login;
// only an ADMIN principal enters the Admin area — the API enforces the role
// on every Admin request regardless.
export function AdminLoginPage() {
  const [params] = useSearchParams()
  const target = safeAdminRedirectPath(params.get('redirect'))
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const login = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  )
  const [submitted, setSubmitted] = useState(false)
  const alert = useRef<HTMLDivElement>(null)

  const notAdmin = submitted && user && user.role !== 'ADMIN'
  useEffect(() => {
    if (login.error || notAdmin) alert.current?.focus()
  }, [login.error, notAdmin])

  if (user?.role === 'ADMIN') return <Navigate to={target} replace />

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next = {
      email: validateEmail(email),
      password: validatePasswordInput(password),
    }
    setErrors(next)
    if (hasErrors(next)) return
    setSubmitted(true)
    login.mutate(
      { email, password },
      {
        onSuccess: (signedIn) => {
          if (signedIn.role === 'ADMIN')
            void navigate(target, { replace: true })
        },
      },
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <NoIndex />
      <PageMeta title="Masuk Admin" description="Masuk ke area Admin." />
      <main className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Masuk Admin</h1>
        <p className="mt-2 text-sm text-slate-600">
          Khusus pengelola. Gunakan email dan kata sandi akun Admin.
        </p>
        <form noValidate onSubmit={onSubmit} className="mt-6 space-y-4">
          {login.error ? (
            <FormAlert ref={alert} tone="error">
              {authErrorMessage(login.error, 'login')}
            </FormAlert>
          ) : notAdmin ? (
            <FormAlert ref={alert} tone="error">
              Akun ini bukan akun Admin.
            </FormAlert>
          ) : null}
          <TextField
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
          />
          <TextField
            label="Kata sandi"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
          />
          <button
            type="submit"
            disabled={login.isPending}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-slate-900 px-5 font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {login.isPending ? 'Memproses…' : 'Masuk'}
          </button>
        </form>
        <Link
          to="/"
          className="mt-6 inline-block text-sm font-medium text-brand-700 hover:underline"
        >
          Ke situs publik
        </Link>
      </main>
    </div>
  )
}
