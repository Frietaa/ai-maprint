import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { PageMeta } from '../components/layout/PageMeta.tsx'
import { ErrorState } from '../components/ui/DataState.tsx'
import { FormAlert } from '../components/ui/FormAlert.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { pageMeta } from '../config/seo.ts'
import { ProfileForm } from '../features/account/ProfileForm.tsx'
import { useProfile } from '../features/account/use-profile.ts'
import { authErrorMessage } from '../features/auth/auth-error-message.ts'
import { noticeFrom } from '../features/auth/navigation-notice.ts'
import { RequireMember } from '../features/auth/RequireMember.tsx'
import { useClearSession, useLogout } from '../features/auth/use-auth.ts'

export function AccountPage() {
  return (
    <RequireMember>
      <PageMeta {...pageMeta.account} />
      <PageHeader title="Akun Saya" eyebrow="Member">
        <p>Kelola data profil Anda.</p>
      </PageHeader>
      <AccountContent />
    </RequireMember>
  )
}

function AccountContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const profile = useProfile()
  const logout = useLogout()
  const clearSession = useClearSession()
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState(() => noticeFrom(location.state))
  const editButton = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef(false)

  // After closing the editor, return focus to the "Ubah profil" button.
  useEffect(() => {
    if (!editing && returnFocus.current) {
      returnFocus.current = false
      editButton.current?.focus()
    }
  }, [editing])

  // After a successful logout the page navigates home and forgets the
  // session only once it has unmounted, so the member guard never sees the
  // signed-out state and redirects to the login page on the way out.
  const signedOut = useRef(false)
  useEffect(
    () => () => {
      if (signedOut.current) clearSession()
    },
    [clearSession],
  )

  function onLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        signedOut.current = true
        void navigate('/', { replace: true })
      },
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      {notice ? <FormAlert tone="success">{notice}</FormAlert> : null}

      <section
        aria-labelledby="profil-heading"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2
          id="profil-heading"
          className="text-lg font-semibold text-slate-900"
        >
          Profil
        </h2>

        {profile.isPending ? (
          <p role="status" className="mt-4 text-slate-600">
            Memuat profil…
          </p>
        ) : profile.isError ? (
          <div className="mt-4">
            <ErrorState
              error={profile.error}
              onRetry={() => void profile.refetch()}
              retrying={profile.isFetching}
            />
          </div>
        ) : editing ? (
          <div className="mt-4">
            <ProfileForm
              profile={profile.data}
              onDone={(saved) => {
                setEditing(false)
                returnFocus.current = true
                setNotice(saved ? 'Profil berhasil diperbarui.' : null)
              }}
            />
          </div>
        ) : (
          <>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <ProfileItem label="Nama" value={profile.data.name} />
              <ProfileItem label="Email" value={profile.data.email} />
              <ProfileItem
                label="Nomor WhatsApp"
                value={profile.data.whatsapp ?? 'Belum diisi'}
              />
              <ProfileItem
                label="Cara masuk"
                value={signInMethodsLabel(profile.data.signInMethods)}
              />
            </dl>
            <button
              ref={editButton}
              type="button"
              onClick={() => {
                setNotice(null)
                setEditing(true)
              }}
              className="mt-6 inline-flex min-h-11 items-center rounded-lg px-5 font-medium text-brand-700 ring-1 ring-brand-600 hover:bg-brand-50"
            >
              Ubah profil
            </button>
          </>
        )}
      </section>

      <section
        aria-labelledby="pesanan-heading"
        className="rounded-2xl border border-dashed border-slate-300 bg-white p-6"
      >
        <h2
          id="pesanan-heading"
          className="text-lg font-semibold text-slate-900"
        >
          Riwayat pesanan
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Riwayat pesanan akan tersedia setelah fitur pemesanan aktif.
        </p>
      </section>

      <section aria-label="Keluar" className="space-y-3">
        {logout.error ? (
          <FormAlert tone="error">
            {authErrorMessage(logout.error, 'logout')}
          </FormAlert>
        ) : null}
        <button
          type="button"
          onClick={onLogout}
          disabled={logout.isPending}
          className="inline-flex min-h-11 items-center rounded-lg px-5 font-medium text-red-700 ring-1 ring-red-300 hover:bg-red-50 disabled:opacity-60"
        >
          {logout.isPending ? 'Keluar…' : 'Keluar'}
        </button>
      </section>
    </div>
  )
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium break-words text-slate-900">{value}</dd>
    </div>
  )
}

function signInMethodsLabel(methods: {
  password: boolean
  google: boolean
}): string {
  const labels = [
    methods.password ? 'Email dan kata sandi' : null,
    methods.google ? 'Google' : null,
  ].filter((label): label is string => label !== null)
  return labels.join(', ') || '—'
}
