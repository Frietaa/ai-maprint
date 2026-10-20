import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { PageMeta } from '../components/layout/PageMeta.tsx'
import { FormAlert } from '../components/ui/FormAlert.tsx'
import { TextField } from '../components/ui/TextField.tsx'
import { pageMeta } from '../config/seo.ts'
import { AuthCard } from '../features/auth/AuthCard.tsx'
import { authErrorMessage } from '../features/auth/auth-error-message.ts'
import { GoogleSignInButton } from '../features/auth/GoogleSignInButton.tsx'
import { safeRedirectPath } from '../features/auth/safe-redirect.ts'
import {
  useCurrentUser,
  useGoogleLogin,
  useRegister,
} from '../features/auth/use-auth.ts'
import { useFocusFirstError } from '../features/auth/use-focus-first-error.ts'
import {
  type FieldErrors,
  hasErrors,
  PASSWORD_HINT,
  validateEmail,
  validateName,
  validateNewPassword,
  validateWhatsapp,
} from '../features/auth/validation.ts'

type Field = 'name' | 'email' | 'password' | 'whatsapp'

// Account-created notice shown once on the next page.
export const ACCOUNT_CREATED_NOTICE = 'Akun berhasil dibuat.'

export function SignupPage() {
  const [params] = useSearchParams()
  const target = safeRedirectPath(params.get('redirect'))
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const register = useRegister()
  const google = useGoogleLogin()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [errors, setErrors] = useState<FieldErrors<Field>>({})
  const [attempt, setAttempt] = useState(0)
  // Once this page signs the visitor in, its own success navigation (with
  // the notice) takes over from the "already signed in" redirect.
  const [submitted, setSubmitted] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const alertRef = useRef<HTMLDivElement>(null)
  useFocusFirstError(formRef, attempt, hasErrors(errors))

  const failure = register.error ?? google.error
  const pending = register.isPending || google.isPending

  useEffect(() => {
    if (failure) alertRef.current?.focus()
  }, [failure])

  if (user && !submitted) return <Navigate to={target} replace />

  const onCreated = () =>
    void navigate(target, {
      replace: true,
      state: { notice: ACCOUNT_CREATED_NOTICE },
    })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next = {
      name: validateName(name),
      email: validateEmail(email),
      password: validateNewPassword(password),
      whatsapp: validateWhatsapp(whatsapp),
    }
    setErrors(next)
    setAttempt((n) => n + 1)
    if (hasErrors(next)) return
    google.reset()
    setSubmitted(true)
    register.mutate(
      {
        name,
        email,
        password,
        whatsapp: whatsapp.trim() === '' ? null : whatsapp,
      },
      { onSuccess: onCreated },
    )
  }

  return (
    <AuthCard
      title="Daftar"
      intro="Buat akun member. Akun bersifat opsional — Anda tetap dapat memesan sebagai tamu."
      footer={
        <>
          Sudah punya akun?{' '}
          <Link
            to={`/login${params.has('redirect') ? `?redirect=${encodeURIComponent(target)}` : ''}`}
            className="font-medium text-brand-700 underline-offset-2 hover:underline"
          >
            Masuk
          </Link>
        </>
      }
    >
      <PageMeta {...pageMeta.signup} />
      <form ref={formRef} noValidate onSubmit={onSubmit} className="space-y-4">
        {failure ? (
          <FormAlert ref={alertRef} tone="error">
            {authErrorMessage(failure, register.error ? 'register' : 'google')}
          </FormAlert>
        ) : null}
        <TextField
          label="Nama"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          required
        />
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
          autoComplete="new-password"
          hint={PASSWORD_HINT}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          required
        />
        <TextField
          label="Nomor WhatsApp"
          type="tel"
          name="whatsapp"
          autoComplete="tel"
          inputMode="tel"
          optional
          value={whatsapp}
          onChange={(event) => setWhatsapp(event.target.value)}
          error={errors.whatsapp}
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {register.isPending ? 'Memproses…' : 'Buat akun'}
        </button>
        {pending ? (
          <p role="status" className="sr-only">
            Sedang membuat akun.
          </p>
        ) : null}
      </form>

      <GoogleSignInButton
        context="signup"
        disabled={pending}
        onCredential={(credential) => {
          register.reset()
          setSubmitted(true)
          google.mutate({ credential }, { onSuccess: onCreated })
        }}
      />
    </AuthCard>
  )
}
