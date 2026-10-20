import { type FormEvent, useEffect, useRef, useState } from 'react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router'
import { PageMeta } from '../components/layout/PageMeta.tsx'
import { FormAlert } from '../components/ui/FormAlert.tsx'
import { TextField } from '../components/ui/TextField.tsx'
import { pageMeta } from '../config/seo.ts'
import { AuthCard } from '../features/auth/AuthCard.tsx'
import { authErrorMessage } from '../features/auth/auth-error-message.ts'
import { GoogleSignInButton } from '../features/auth/GoogleSignInButton.tsx'
import { noticeFrom } from '../features/auth/navigation-notice.ts'
import { safeRedirectPath } from '../features/auth/safe-redirect.ts'
import {
  useCurrentUser,
  useGoogleLogin,
  useLogin,
} from '../features/auth/use-auth.ts'
import { useFocusFirstError } from '../features/auth/use-focus-first-error.ts'
import {
  type FieldErrors,
  hasErrors,
  validateEmail,
  validatePasswordInput,
} from '../features/auth/validation.ts'

type Field = 'email' | 'password'

export function LoginPage() {
  const [params] = useSearchParams()
  const target = safeRedirectPath(params.get('redirect'))
  const navigate = useNavigate()
  const notice = noticeFrom(useLocation().state)
  const { data: user } = useCurrentUser()
  const login = useLogin()
  const google = useGoogleLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors<Field>>({})
  const [attempt, setAttempt] = useState(0)
  // Once this page signs the visitor in, its own success navigation takes
  // over from the "already signed in" redirect.
  const [submitted, setSubmitted] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const alertRef = useRef<HTMLDivElement>(null)
  useFocusFirstError(formRef, attempt, hasErrors(errors))

  const failure = login.error ?? google.error
  const pending = login.isPending || google.isPending

  useEffect(() => {
    if (failure) alertRef.current?.focus()
  }, [failure])

  if (user && !submitted) return <Navigate to={target} replace />

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next = {
      email: validateEmail(email),
      password: validatePasswordInput(password),
    }
    setErrors(next)
    setAttempt((n) => n + 1)
    if (hasErrors(next)) return
    google.reset()
    setSubmitted(true)
    login.mutate(
      { email, password },
      { onSuccess: () => void navigate(target, { replace: true }) },
    )
  }

  return (
    <AuthCard
      title="Masuk"
      intro="Masuk ke akun member Anda."
      footer={
        <>
          Belum punya akun?{' '}
          <Link
            to={`/signup${params.has('redirect') ? `?redirect=${encodeURIComponent(target)}` : ''}`}
            className="font-medium text-brand-700 underline-offset-2 hover:underline"
          >
            Daftar
          </Link>
        </>
      }
    >
      <PageMeta {...pageMeta.login} />
      <form ref={formRef} noValidate onSubmit={onSubmit} className="space-y-4">
        {failure ? (
          <FormAlert ref={alertRef} tone="error">
            {authErrorMessage(failure, login.error ? 'login' : 'google')}
          </FormAlert>
        ) : notice ? (
          <p
            role="status"
            className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800"
          >
            {notice}
          </p>
        ) : null}
        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          required
        />
        <TextField
          label="Kata sandi"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          required
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {login.isPending ? 'Memproses…' : 'Masuk'}
        </button>
        {pending ? (
          <p role="status" className="sr-only">
            Sedang memproses permintaan masuk.
          </p>
        ) : null}
      </form>

      <GoogleSignInButton
        context="signin"
        disabled={pending}
        onCredential={(credential) => {
          login.reset()
          setSubmitted(true)
          google.mutate(
            { credential },
            { onSuccess: () => void navigate(target, { replace: true }) },
          )
        }}
      />
    </AuthCard>
  )
}
