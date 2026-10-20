import { describe, expect, it } from 'vitest'
import { loginPathFor, safeRedirectPath } from './safe-redirect.ts'

describe('safeRedirectPath', () => {
  it.each([
    ['/account', '/account'],
    ['/atk?categoryId=x#top', '/atk?categoryId=x#top'],
    ['/locations', '/locations'],
  ])('accepts the internal path %s', (raw, expected) => {
    expect(safeRedirectPath(raw)).toBe(expected)
  })

  it.each([
    null,
    undefined,
    '',
    'account',
    'https://evil.example/account',
    'http://localhost/account',
    '//evil.example',
    '//evil.example/account',
    '/\\evil.example',
    '\\\\evil.example',
    'javascript:alert(1)',
    '/%0a//evil.example',
    '/%2F%2Fevil.example',
    '/%5Cevil.example',
    '/%E0%A4%A',
    '/\u0000/evil',
    'data:text/html,hi',
    '/login',
    '/signup?redirect=/account',
  ])('falls back for %j', (raw) => {
    expect(safeRedirectPath(raw)).toBe('/account')
  })

  it('uses the given fallback', () => {
    expect(safeRedirectPath('https://evil.example', '/')).toBe('/')
  })

  it('normalizes dot segments without leaving the origin', () => {
    expect(safeRedirectPath('/a/../account')).toBe('/account')
    expect(safeRedirectPath('/../../account')).toBe('/account')
  })
})

describe('loginPathFor', () => {
  it('encodes the protected location as redirect', () => {
    expect(loginPathFor({ pathname: '/account', search: '?tab=1' })).toBe(
      '/login?redirect=%2Faccount%3Ftab%3D1',
    )
  })
})
