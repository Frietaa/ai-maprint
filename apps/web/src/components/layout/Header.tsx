import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { headerNavigation, isNavGroup } from '../../config/navigation.ts'
import { useCurrentUser } from '../../features/auth/use-auth.ts'
import { Logo, defaultLogoSrc } from './Logo.tsx'
import { MobileNavGroup, NavDropdown } from './NavMenus.tsx'

interface HeaderProps {
  businessName: string
  logoSrc?: string | null
}

const linkBase =
  'relative rounded-xl px-3 py-2 text-sm font-semibold transition-all motion-safe:duration-200'

// Primary call to action (yellow highlight on dark text).
const ctaClass =
  'inline-flex min-h-10 items-center justify-center rounded-xl bg-highlight-500 px-5 text-sm font-bold text-brand-950 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-highlight-400 hover:shadow-md motion-safe:duration-200'

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return isActive
    ? `${linkBase} bg-brand-50 text-brand-800`
    : `${linkBase} text-text-muted hover:bg-brand-50 hover:text-brand-800`
}

export function Header({ businessName, logoSrc }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  // At most one desktop dropdown and one mobile accordion open at a time.
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [mobileGroup, setMobileGroup] = useState<string | null>(null)
  const menuId = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Escape closes the mobile menu and returns focus to its toggle button.
  useEffect(() => {
    if (!menuOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  const closeMenu = () => {
    setMenuOpen(false)
    setMobileGroup(null)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-page/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="shrink-0 rounded-xl transition-opacity hover:opacity-90"
          aria-label={`${businessName} — Beranda`}
          onClick={closeMenu}
        >
          <Logo name={businessName} imageSrc={logoSrc ?? defaultLogoSrc} />
        </Link>

        <nav aria-label="Navigasi utama" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {headerNavigation.map((entry) =>
              isNavGroup(entry) ? (
                <NavDropdown
                  key={entry.id}
                  group={entry}
                  open={openGroup === entry.id}
                  onOpenChange={(open) =>
                    setOpenGroup((current) =>
                      open ? entry.id : current === entry.id ? null : current,
                    )
                  }
                />
              ) : (
                <li key={entry.to}>
                  <NavLink
                    to={entry.to}
                    end
                    className={(state) =>
                      `${navLinkClass(state)} inline-flex py-2`
                    }
                  >
                    {entry.label}
                  </NavLink>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="hidden lg:block">
          <AccountLinks layout="inline" />
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-text-muted transition-colors hover:bg-brand-50 hover:text-brand-800 motion-safe:duration-200 lg:hidden"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
        >
          <MenuIcon open={menuOpen} />
          Menu
        </button>
      </div>

      {/* Slides open with a height transition; hidden (visibility) when
          closed so its links are out of the tab order. */}
      <nav
        id={menuId}
        aria-label="Navigasi utama (seluler)"
        style={{ visibility: menuOpen ? 'visible' : 'hidden' }}
        className={`grid transition-[grid-template-rows,opacity,visibility] ease-out motion-safe:duration-300 motion-reduce:transition-none lg:hidden ${
          menuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-line bg-surface">
            <ul className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
              {headerNavigation.map((entry) =>
                isNavGroup(entry) ? (
                  <MobileNavGroup
                    key={entry.id}
                    group={entry}
                    open={mobileGroup === entry.id}
                    onOpenChange={(open) =>
                      setMobileGroup(open ? entry.id : null)
                    }
                    onNavigate={closeMenu}
                  />
                ) : (
                  <li key={entry.to}>
                    <NavLink
                      to={entry.to}
                      end
                      className={(state) => `${navLinkClass(state)} block py-3`}
                      onClick={closeMenu}
                    >
                      {entry.label}
                    </NavLink>
                  </li>
                ),
              )}
            </ul>
            <div className="mx-auto max-w-7xl border-t border-line px-4 py-3 sm:px-6">
              <AccountLinks layout="stacked" onNavigate={closeMenu} />
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

interface AccountLinksProps {
  layout: 'inline' | 'stacked'
  onNavigate?: () => void
}

// Sign-in entry points or the member's account link. Nothing is shown until
// the session state is known, so links never flicker between states.
function AccountLinks({ layout, onNavigate }: AccountLinksProps) {
  const { data: user, isPending } = useCurrentUser()
  if (isPending) return null

  const stacked = layout === 'stacked'
  const wrapper = stacked ? 'flex flex-col gap-2' : 'flex items-center gap-2'
  const block = stacked ? 'flex justify-center py-3' : ''

  if (user?.role === 'ADMIN') {
    return (
      <div className={wrapper}>
        <Link
          to="/admin"
          onClick={onNavigate}
          className={`${navLinkClass({ isActive: false })} ${block}`}
        >
          Admin
        </Link>
      </div>
    )
  }

  if (user) {
    return (
      <div className={wrapper}>
        <NavLink
          to="/account"
          onClick={onNavigate}
          className={(state) => `${navLinkClass(state)} ${block}`}
        >
          Akun
        </NavLink>
      </div>
    )
  }

  return (
    <div className={wrapper}>
      <NavLink
        to="/login"
        onClick={onNavigate}
        className={(state) => `${navLinkClass(state)} ${block}`}
      >
        Masuk
      </NavLink>

      <Link
        to="/signup"
        onClick={onNavigate}
        className={`${ctaClass} ${block}`}
      >
        Daftar
      </Link>
    </div>
  )
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  )
}
