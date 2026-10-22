import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useBusinessIdentity } from '../settings/use-public-settings.ts'
import { useClearSession, useCurrentUser, useLogout } from '../auth/use-auth.ts'
import { RequireAdmin } from './RequireAdmin.tsx'

const navigation = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/orders', label: 'Pesanan', end: false },
  { to: '/admin/products', label: 'Produk', end: false },
  { to: '/admin/services', label: 'Layanan', end: false },
  { to: '/admin/locations', label: 'Lokasi', end: false },
  { to: '/admin/settings', label: 'Pengaturan', end: false },
] as const

function navClass({ isActive }: { isActive: boolean }): string {
  return `inline-flex min-h-10 items-center rounded-md px-3 text-sm font-medium ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
  }`
}

// Operational Admin shell: dense, functional, no marketing chrome.
export function AdminLayout() {
  return (
    <RequireAdmin>
      <AdminShell />
    </RequireAdmin>
  )
}

function AdminShell() {
  const { name } = useBusinessIdentity()
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const clearSession = useClearSession()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const main = useRef<HTMLElement>(null)
  const previous = useRef(pathname)

  useEffect(() => {
    if (previous.current === pathname) return
    previous.current = pathname
    main.current?.focus({ preventScroll: true })
  }, [pathname])

  // Leave the Admin area first, then forget the session (the guard must not
  // see the signed-out state while still mounted).
  const signedOut = useRef(false)
  useEffect(
    () => () => {
      if (signedOut.current) clearSession()
    },
    [clearSession],
  )

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <a
        href="#admin-konten"
        className="sr-only z-30 rounded-md bg-slate-900 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Langsung ke konten utama
      </a>
      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="font-semibold text-slate-900">
            {name} <span className="font-normal text-slate-500">· Admin</span>
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-600">{user?.name}</span>
            <button
              type="button"
              disabled={logout.isPending}
              onClick={() =>
                logout.mutate(undefined, {
                  onSuccess: () => {
                    signedOut.current = true
                    void navigate('/admin/login', { replace: true })
                  },
                })
              }
              className="inline-flex min-h-10 items-center rounded-md px-3 font-medium text-red-700 ring-1 ring-red-300 hover:bg-red-50 disabled:opacity-60"
            >
              Keluar
            </button>
          </div>
        </div>
        <nav
          aria-label="Navigasi admin"
          className="mx-auto max-w-7xl px-4 pb-3"
        >
          <ul className="flex flex-wrap gap-1">
            {navigation.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={navClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main
        ref={main}
        id="admin-konten"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 outline-none"
      >
        <Outlet />
      </main>
    </div>
  )
}
