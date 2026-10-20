import { describe, expect, it } from 'vitest'
import * as shared from './index.js'

describe('@maba-printing/shared entry point', () => {
  it('exposes the public contract constants', () => {
    expect(shared.API_PREFIX).toBe('/api/v1')
    expect(shared.PRICE_TYPES).toEqual(['FIXED', 'REQUIRES_CONFIRMATION'])
    expect(shared.PRODUCT_AVAILABILITIES).toEqual(['AVAILABLE', 'UNAVAILABLE'])
    expect(shared.WEEKDAYS).toHaveLength(7)
  })
})
