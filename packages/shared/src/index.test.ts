import { describe, expect, it } from 'vitest'
import * as shared from './index.js'

describe('@maba-printing/shared entry point', () => {
  it('exposes the public contract constants', () => {
    expect(shared.API_PREFIX).toBe('/api/v1')
    expect(shared.PRICE_TYPES).toEqual(['FIXED', 'REQUIRES_CONFIRMATION'])
    expect(shared.PRODUCT_AVAILABILITIES).toEqual(['AVAILABLE', 'UNAVAILABLE'])
    expect(shared.WEEKDAYS).toHaveLength(7)
  })

  it('exposes the auth contract constants', () => {
    expect(shared.AUTH_API_PATHS.me).toBe('/auth/me')
    expect(shared.ACCOUNT_API_PATHS.profile).toBe('/account/profile')
    expect(shared.CSRF_HEADER).toBe('X-CSRF-Token')
    // Guest is not a role.
    expect(shared.USER_ROLES).toEqual(['MEMBER', 'ADMIN'])
    expect(shared.AUTH_LIMITS.passwordMinLength).toBe(8)
    expect(shared.AUTH_LIMITS.passwordMaxLength).toBe(128)
  })
})
