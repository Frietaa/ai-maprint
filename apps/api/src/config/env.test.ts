import { describe, expect, it } from 'vitest'
import {
  loadConfig,
  parseAllowedOrigins,
  parseSessionSecret,
  parseTrustProxy,
} from './env.js'

// Synthetic values only.
const baseEnv = {
  SESSION_SECRET: 'x'.repeat(32),
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
}

describe('FRONTEND_URL allowlist', () => {
  it('normalizes comma-separated values to origins', () => {
    expect(
      parseAllowedOrigins(
        ' http://localhost:5173/ , https://web.example.test/x ',
      ),
    ).toStrictEqual(['http://localhost:5173', 'https://web.example.test'])
  })

  it('is empty when unset', () => {
    expect(loadConfig(baseEnv).allowedOrigins).toStrictEqual([])
  })

  it.each(['*', 'ftp://example.test', 'localhost:5173'])(
    'rejects %s',
    (value) => {
      expect(() => parseAllowedOrigins(value)).toThrow(/FRONTEND_URL/)
    },
  )
})

describe('SESSION_SECRET', () => {
  it('is required, without any fallback', () => {
    expect(() => loadConfig({ DATABASE_URL: baseEnv.DATABASE_URL })).toThrow(
      'Missing required environment variable: SESSION_SECRET',
    )
    expect(() => loadConfig({ ...baseEnv, SESSION_SECRET: '   ' })).toThrow(
      /SESSION_SECRET/,
    )
  })

  it('must be at least 32 characters and is never echoed', () => {
    const secret = 'short-secret-value'
    expect(() => parseSessionSecret(secret)).toThrow(/at least 32/)
    try {
      parseSessionSecret(secret)
    } catch (error) {
      expect(String(error)).not.toContain(secret)
    }
    expect(parseSessionSecret('y'.repeat(32))).toBe('y'.repeat(32))
  })
})

describe('other auth configuration', () => {
  it('requires DATABASE_URL for the session store', () => {
    expect(() =>
      loadConfig({ SESSION_SECRET: baseEnv.SESSION_SECRET }),
    ).toThrow('Missing required environment variable: DATABASE_URL')
  })

  it('enables production behavior only for NODE_ENV=production', () => {
    expect(loadConfig(baseEnv).production).toBe(false)
    expect(loadConfig({ ...baseEnv, NODE_ENV: 'development' }).production).toBe(
      false,
    )
    expect(loadConfig({ ...baseEnv, NODE_ENV: 'production' }).production).toBe(
      true,
    )
  })

  it('parses TRUST_PROXY as a hop count', () => {
    expect(parseTrustProxy(undefined)).toBe(false)
    expect(parseTrustProxy('0')).toBe(false)
    expect(parseTrustProxy('1')).toBe(1)
    expect(() => parseTrustProxy('true')).toThrow(/TRUST_PROXY/)
  })

  it('treats a missing GOOGLE_CLIENT_ID as Google Sign-In disabled', () => {
    expect(loadConfig(baseEnv).googleClientId).toBeNull()
    expect(
      loadConfig({ ...baseEnv, GOOGLE_CLIENT_ID: 'id.apps.example' })
        .googleClientId,
    ).toBe('id.apps.example')
  })
})
