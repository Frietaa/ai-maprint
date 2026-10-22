// MABA PRINTING website security headers (KI-016) — the one provider-neutral
// definition of what the host serving apps/web/dist must send. `vite
// preview` applies it (vite.config.ts), so the production build is tested
// with it; the chosen host must reproduce the same headers
// (docs/DEPLOYMENT.md). The API sets its own headers (helmet).

export interface WebsiteHeaderOptions {
  // Origin of the API when it is not served from the website's origin
  // (VITE_API_BASE_URL), e.g. "https://api.example.test"; null = same
  // origin (reverse proxy).
  apiOrigin: string | null
  // Google Identity Services is enabled (VITE_GOOGLE_CLIENT_ID set).
  googleSignIn: boolean
  // Served over HTTPS (production): adds HSTS and upgrade-insecure-requests.
  https: boolean
}

const GOOGLE_GSI = 'https://accounts.google.com/gsi/'

export function originOf(url: string | null | undefined): string | null {
  const value = url?.trim()
  if (!value) return null
  const parsed = new URL(value)
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('API base URL must be an http(s) URL')
  }
  return parsed.origin
}

export function contentSecurityPolicy({
  apiOrigin,
  googleSignIn,
  https,
}: WebsiteHeaderOptions): string {
  const google = (path: string) =>
    googleSignIn ? [`${GOOGLE_GSI}${path}`] : []
  const directives: [string, string[]][] = [
    ['default-src', ["'self'"]],
    // Vite emits only external, hashed module scripts: no inline script.
    ['script-src', ["'self'", ...google('client')]],
    ['style-src', ["'self'", ...google('style')]],
    // Owner-configured logo, product and QRIS images are https URLs or
    // website paths (safeImageRef).
    ['img-src', ["'self'", 'https:']],
    ['font-src', ["'self'"]],
    [
      'connect-src',
      ["'self'", ...(apiOrigin ? [apiOrigin] : []), ...google('')],
    ],
    ['frame-src', googleSignIn ? [GOOGLE_GSI] : ["'none'"]],
    ['object-src', ["'none'"]],
    ['base-uri', ["'self'"]],
    ['form-action', ["'self'"]],
    ['frame-ancestors', ["'none'"]],
  ]
  const policy = directives.map(
    ([name, sources]) => `${name} ${sources.join(' ')}`,
  )
  if (https) policy.push('upgrade-insecure-requests')
  return policy.join('; ')
}

// Headers for every website response.
export function websiteSecurityHeaders(
  options: WebsiteHeaderOptions,
): Record<string, string> {
  return {
    'Content-Security-Policy': contentSecurityPolicy(options),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    // WhatsApp and other outbound links receive the origin only.
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    // Google Sign-In uses a popup that must be able to message back.
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    ...(options.https && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    }),
  }
}

// Hashed build assets never change; everything else (index.html, SPA
// routes, robots.txt) must be revalidated so a release is picked up.
export function cacheControlFor(pathname: string): string {
  return pathname.startsWith('/assets/')
    ? 'public, max-age=31536000, immutable'
    : 'no-cache'
}
