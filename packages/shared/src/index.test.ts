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

  it('exposes the order contract constants', () => {
    expect(shared.ORDER_TYPES).toEqual([
      'PRINTING',
      'ATK',
      'LAPTOP_SERVICE',
      'SOFTWARE_INSTALLATION',
    ])
    // PRD §14 consumer labels for every status.
    expect(shared.ORDER_STATUS_LABELS).toStrictEqual({
      SUBMITTED: 'Menunggu Konfirmasi',
      CONFIRMED: 'Pesanan Diterima',
      IN_PROGRESS: 'Sedang Dikerjakan',
      READY: 'Siap/Selesai',
      COMPLETED: 'Pesanan Selesai',
      CANCELLED: 'Dibatalkan',
    })
    expect(shared.parsePublicOrderId(' mp-2026-7k92d4qx8m7ra ')).toBe(
      'MP-2026-7K92D4QX8M7RA',
    )
    expect(shared.parsePublicOrderId('MP-2026-%')).toBeNull()
  })
})
