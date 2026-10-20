import { useEffect, useRef } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { useBusinessIdentity } from '../../features/settings/use-public-settings.ts'
import { Footer } from './Footer.tsx'
import { Header } from './Header.tsx'

export function PublicLayout() {
  const { name, logoSrc, settings } = useBusinessIdentity()
  const mainRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)

  // After client-side navigation, move focus to the main content so keyboard
  // and screen-reader users start on the new page (not on the initial load;
  // comparing paths keeps this correct under StrictMode double effects).
  useEffect(() => {
    if (previousPath.current === pathname) return
    previousPath.current = pathname
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#konten-utama"
        className="sr-only z-30 rounded-md bg-brand-700 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Langsung ke konten utama
      </a>
      <Header businessName={name} logoSrc={logoSrc} />
      <main
        ref={mainRef}
        id="konten-utama"
        tabIndex={-1}
        className="flex-1 outline-none"
      >
        <Outlet />
      </main>
      <Footer businessName={name} settings={settings} />
      <ScrollRestoration />
    </div>
  )
}
