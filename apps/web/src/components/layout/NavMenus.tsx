import { type FocusEvent, useEffect, useId, useRef } from 'react'
import { NavLink, useLocation } from 'react-router'
import type { NavGroup } from '../../config/navigation.ts'

// Header dropdowns (desktop) and accordions (mobile) for grouped links.
// Disclosure pattern: a button with aria-expanded controls a list of links.
// Closed panels are visibility:hidden (set as a style so the state is also
// right without the stylesheet), which removes their links from the tab
// order and the accessibility tree while the fade/slide or height
// transition runs. Motion is skipped for prefers-reduced-motion.

const triggerBase =
  'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors motion-safe:duration-200'

function useGroupActive(group: NavGroup): boolean {
  const { pathname } = useLocation()
  return group.items.some((item) => item.to === pathname)
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`size-4 transition-transform motion-safe:duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 7.5l5 5 5-5" />
    </svg>
  )
}

interface NavDropdownProps {
  group: NavGroup
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Desktop dropdown: opens on click (or hover with a mouse); closes on
// Escape (focus returns to the button), a click outside, focus leaving the
// group, or choosing a link.
export function NavDropdown({ group, open, onOpenChange }: NavDropdownProps) {
  const panelId = useId()
  const rootRef = useRef<HTMLLIElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  const active = useGroupActive(group)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onOpenChange(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onOpenChange])

  useEffect(() => () => clearTimeout(hoverTimer.current), [])

  // Hover opens/closes with a short grace period so moving the pointer from
  // the button into the panel does not close it.
  function hover(next: boolean, event: { pointerType: string }) {
    if (event.pointerType !== 'mouse') return
    clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => onOpenChange(next), next ? 60 : 160)
  }

  function onBlur(event: FocusEvent<HTMLLIElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) onOpenChange(false)
  }

  return (
    <li
      ref={rootRef}
      className="relative"
      onPointerEnter={(event) => hover(true, event)}
      onPointerLeave={(event) => hover(false, event)}
      onBlur={onBlur}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          clearTimeout(hoverTimer.current)
          onOpenChange(!open)
        }}
        className={`${triggerBase} ${
          open || active
            ? 'bg-brand-50 text-brand-800'
            : 'text-text-muted hover:bg-brand-50 hover:text-brand-800'
        }`}
      >
        {group.label}
        <Chevron open={open} />
      </button>

      <div
        id={panelId}
        style={{ visibility: open ? 'visible' : 'hidden' }}
        className={`absolute top-full left-1/2 z-50 w-72 -translate-x-1/2 pt-3 transition-[opacity,transform,visibility] ease-out motion-safe:duration-200 motion-reduce:transition-none ${
          open
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-1 opacity-0'
        }`}
      >
        <ul className="rounded-2xl border border-line bg-surface p-2 shadow-xl shadow-brand-950/10">
          {group.items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end
                onClick={() => onOpenChange(false)}
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2.5 transition-colors motion-safe:duration-150 ${
                    isActive ? 'bg-brand-50' : 'hover:bg-brand-50'
                  }`
                }
              >
                <span className="block text-sm font-semibold text-brand-900">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-xs text-text-muted">
                  {item.description}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}

interface MobileNavGroupProps {
  group: NavGroup
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: () => void
}

// Mobile accordion: the list slides open with a height transition
// (grid rows 0fr -> 1fr).
export function MobileNavGroup({
  group,
  open,
  onOpenChange,
  onNavigate,
}: MobileNavGroupProps) {
  const panelId = useId()
  const active = useGroupActive(group)

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
        className={`${triggerBase} w-full justify-between py-3 ${
          active ? 'text-brand-800' : 'text-text-muted hover:bg-brand-50'
        }`}
      >
        {group.label}
        <Chevron open={open} />
      </button>
      <div
        id={panelId}
        style={{ visibility: open ? 'visible' : 'hidden' }}
        className={`grid transition-[grid-template-rows,opacity,visibility] ease-out motion-safe:duration-300 motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <ul className="overflow-hidden">
          {group.items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end
                onClick={onNavigate}
                className={({ isActive }) =>
                  `ml-3 block rounded-r-xl border-l-2 px-4 py-3 text-sm font-semibold transition-colors motion-safe:duration-150 ${
                    isActive
                      ? 'border-brand-600 bg-brand-50 text-brand-800'
                      : 'border-line text-text-muted hover:bg-brand-50 hover:text-brand-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}
