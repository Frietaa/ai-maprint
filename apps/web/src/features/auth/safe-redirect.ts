// Open-redirect protection for `?redirect=` after sign-in: only internal,
// same-origin application paths are accepted ("/account", "/atk?x=1").
// Everything else — absolute URLs, protocol-relative "//host", backslash
// tricks, "javascript:" and the like — falls back to the default.
export const DEFAULT_AFTER_SIGN_IN = '/account'

const BASE = 'https://app.invalid'

// eslint-disable-next-line no-control-regex
const UNSAFE_CHARACTERS = /[\u0000-\u001F\u007F\\]/

export function safeRedirectPath(
  raw: string | null | undefined,
  fallback: string = DEFAULT_AFTER_SIGN_IN,
): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return fallback
  if (UNSAFE_CHARACTERS.test(raw)) return fallback

  let url: URL
  try {
    url = new URL(raw, BASE)
  } catch {
    return fallback
  }
  if (url.origin !== BASE) return fallback

  const path = `${url.pathname}${url.search}${url.hash}`
  // Defense in depth: no encoded control characters, backslashes or "//"
  // that a later decoding step could turn into something else.
  let decoded: string
  try {
    decoded = decodeURIComponent(url.pathname)
  } catch {
    return fallback
  }
  if (UNSAFE_CHARACTERS.test(decoded) || decoded.includes('//')) {
    return fallback
  }
  // Never bounce back into the sign-in pages themselves.
  if (url.pathname === '/login' || url.pathname === '/signup') return fallback
  return path
}

// "/login?redirect=…" for a protected location.
export function loginPathFor(location: {
  pathname: string
  search: string
}): string {
  const target = `${location.pathname}${location.search}`
  return `/login?redirect=${encodeURIComponent(target)}`
}

// Admin area: only internal /admin paths (never the Admin login itself).
export const DEFAULT_ADMIN_PATH = '/admin'

export function safeAdminRedirectPath(raw: string | null | undefined): string {
  const path = safeRedirectPath(raw, DEFAULT_ADMIN_PATH)
  const pathname = path.split(/[?#]/)[0] ?? ''
  if (pathname !== '/admin' && !pathname.startsWith('/admin/')) {
    return DEFAULT_ADMIN_PATH
  }
  if (pathname === '/admin/login') return DEFAULT_ADMIN_PATH
  return path
}

export function adminLoginPathFor(location: {
  pathname: string
  search: string
}): string {
  const target = `${location.pathname}${location.search}`
  return `/admin/login?redirect=${encodeURIComponent(target)}`
}
