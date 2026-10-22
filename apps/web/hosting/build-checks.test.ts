import { describe, expect, it } from 'vitest'
import { checkProductionApiUrl } from './build-checks.ts'

describe('checkProductionApiUrl', () => {
  it('accepts https, local hosts and same-origin (empty) builds', () => {
    expect(() => {
      checkProductionApiUrl('https://api.example.test', 'production')
      checkProductionApiUrl('http://localhost:3189', 'production')
      checkProductionApiUrl('', 'production')
      checkProductionApiUrl(undefined, 'production')
    }).not.toThrow()
  })

  it('refuses a plain-http remote API for production builds only', () => {
    expect(() =>
      checkProductionApiUrl('http://api.example.test', 'production'),
    ).toThrow('VITE_API_BASE_URL must use https for production builds')
    expect(() =>
      checkProductionApiUrl('http://api.example.test', 'development'),
    ).not.toThrow()
  })
})
