import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { primaryNavigation } from '../../config/navigation.ts'
import { Logo } from './Logo.tsx'

interface HeaderProps {
  businessName: string
  logoSrc?: string | null
}

const linkBase =
  'rounded-md px-3 py-2 text-sm font-medium transition-colors motion-safe:duration-150'

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return isActive
    ? `${linkBase} bg-brand-50 text-brand-700`
    : `${linkBase} text-slate-600 hover:bg-slate-100 hover:text-slate-900`
}

export function Header({ businessName, logoSrc }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
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

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="rounded-md"
          aria-label={`${businessName} — Beranda`}
          onClick={closeMenu}
        >
          <Logo name={businessName} imageSrc={logoSrc} />
        </Link>

        <nav aria-label="Navigasi utama" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {primaryNavigation.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end className={navLinkClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MenuIcon open={menuOpen} />
          Menu
        </button>
      </div>

      <nav
        id={menuId}
        aria-label="Navigasi utama (seluler)"
        hidden={!menuOpen}
        className="border-t border-slate-200 bg-white lg:hidden"
      >
        <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
          {primaryNavigation.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end
                className={(state) => `${navLinkClass(state)} block py-3`}
                onClick={closeMenu}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
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
