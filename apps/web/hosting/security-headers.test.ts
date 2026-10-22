import { describe, expect, it } from 'vitest'
import {
  cacheControlFor,
  contentSecurityPolicy,
  originOf,
  websiteSecurityHeaders,
} from './security-headers.ts'

describe('website security headers', () => {
  it('allows only the site, the API origin and Google Identity Services', () => {
    const csp = contentSecurityPolicy({
      apiOrigin: 'https://api.example.test',
      googleSignIn: true,
      https: true,
    })
    expect(csp).toContain(
      "script-src 'self' https://accounts.google.com/gsi/client",
    )
    expect(csp).toContain(
      "connect-src 'self' https://api.example.test https://accounts.google.com/gsi/",
    )
    expect(csp).toContain('frame-src https://accounts.google.com/gsi/')
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain('upgrade-insecure-requests')
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|\*/)
  })

  it('drops Google sources when Google Sign-In is off', () => {
    const csp = contentSecurityPolicy({
      apiOrigin: null,
      googleSignIn: false,
      https: false,
    })
    expect(csp).not.toContain('google')
    expect(csp).toContain("frame-src 'none'")
    expect(csp).toContain("connect-src 'self';")
    expect(csp).not.toContain('upgrade-insecure-requests')
  })

  it('sends HSTS only over HTTPS', () => {
    const base = { apiOrigin: null, googleSignIn: false }
    expect(
      websiteSecurityHeaders({ ...base, https: true })[
        'Strict-Transport-Security'
      ],
    ).toBe('max-age=31536000; includeSubDomains')
    const local = websiteSecurityHeaders({ ...base, https: false })
    expect(local['Strict-Transport-Security']).toBeUndefined()
    expect(local).toMatchObject({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    })
  })

  it('caches hashed assets forever and revalidates the rest', () => {
    expect(cacheControlFor('/assets/index-abc123.js')).toBe(
      'public, max-age=31536000, immutable',
    )
    expect(cacheControlFor('/')).toBe('no-cache')
    expect(cacheControlFor('/account/orders')).toBe('no-cache')
  })

  it('derives the API origin from VITE_API_BASE_URL', () => {
    expect(originOf('https://api.example.test/')).toBe(
      'https://api.example.test',
    )
    expect(originOf('')).toBeNull()
    expect(() => originOf('javascript:alert(1)')).toThrow()
  })
})
