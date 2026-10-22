import { describe, expect, it } from 'vitest'
import {
  loadConfig,
  parseAllowedOrigins,
  parseRateLimitStore,
  parseSessionCookieSameSite,
  productionWarnings,
  parseUploadScanner,
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
    // Production needs object storage, which is chosen at deployment.
    expect(() => loadConfig({ ...baseEnv, NODE_ENV: 'production' })).toThrow(
      /development only/,
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

describe('storage and upload configuration', () => {
  it('accepts only the local provider, outside production', () => {
    expect(loadConfig(baseEnv).storageProvider).toBe('local')
    expect(() => loadConfig({ ...baseEnv, STORAGE_PROVIDER: 's3' })).toThrow(
      /STORAGE_PROVIDER/,
    )
  })

  it('reads bounded upload limits', () => {
    expect(loadConfig(baseEnv).uploadLimits).toStrictEqual({
      maxFiles: 5,
      maxFileBytes: 10 * 1024 * 1024,
      maxTotalBytes: 25 * 1024 * 1024,
    })
    expect(
      loadConfig({
        ...baseEnv,
        UPLOAD_MAX_FILES: '3',
        UPLOAD_MAX_FILE_SIZE: '1048576',
      }).uploadLimits,
    ).toMatchObject({ maxFiles: 3, maxFileBytes: 1048576 })
    for (const env of [
      { UPLOAD_MAX_FILES: '0' },
      { UPLOAD_MAX_FILES: '11' },
      { UPLOAD_MAX_FILE_SIZE: String(26 * 1024 * 1024) },
      { UPLOAD_MAX_FILE_SIZE: '10MB' },
    ]) {
      expect(() => loadConfig({ ...baseEnv, ...env })).toThrow(/UPLOAD_MAX/)
    }
  })
})

describe('RATE_LIMIT_STORE', () => {
  it('defaults to the shared store in production and memory elsewhere', () => {
    expect(parseRateLimitStore(undefined, true)).toBe('postgres')
    expect(parseRateLimitStore(undefined, false)).toBe('memory')
    expect(loadConfig(baseEnv).rateLimitStore).toBe('memory')
    expect(
      loadConfig({ ...baseEnv, RATE_LIMIT_STORE: 'postgres' }).rateLimitStore,
    ).toBe('postgres')
  })

  it('rejects unknown stores without echoing values', () => {
    expect(() => parseRateLimitStore('redis', false)).toThrow(
      'Invalid RATE_LIMIT_STORE: expected "postgres" or "memory"',
    )
  })
})

describe('UPLOAD_SCANNER', () => {
  it('defaults to none outside production', () => {
    expect(loadConfig(baseEnv).uploadScanner).toStrictEqual({ kind: 'none' })
  })

  it('must be chosen explicitly in production', () => {
    expect(() => parseUploadScanner({}, true)).toThrow(
      /Missing required environment variable: UPLOAD_SCANNER/,
    )
    expect(parseUploadScanner({ UPLOAD_SCANNER: 'none' }, true)).toStrictEqual({
      kind: 'none',
    })
  })

  it('configures clamd with defaults and validation', () => {
    expect(
      parseUploadScanner(
        { UPLOAD_SCANNER: 'clamav', CLAMAV_HOST: 'clamd' },
        true,
      ),
    ).toStrictEqual({
      kind: 'clamav',
      host: 'clamd',
      port: 3310,
      timeoutMs: 30_000,
    })
    expect(() =>
      parseUploadScanner({ UPLOAD_SCANNER: 'clamav' }, false),
    ).toThrow('Missing required environment variable: CLAMAV_HOST')
    expect(() =>
      parseUploadScanner(
        { UPLOAD_SCANNER: 'clamav', CLAMAV_HOST: 'c', CLAMAV_PORT: '99999' },
        false,
      ),
    ).toThrow(/Invalid CLAMAV_PORT/)
    expect(() =>
      parseUploadScanner({ UPLOAD_SCANNER: 'virustotal' }, false),
    ).toThrow('Invalid UPLOAD_SCANNER: expected "clamav" or "none"')
  })
})

describe('SESSION_COOKIE_SAMESITE (KI-022)', () => {
  it('defaults to lax and accepts strict', () => {
    expect(loadConfig(baseEnv).sessionCookieSameSite).toBe('lax')
    expect(parseSessionCookieSameSite('strict', false)).toBe('strict')
  })

  it('allows none only in production (Secure cookies)', () => {
    expect(parseSessionCookieSameSite('none', true)).toBe('none')
    expect(() => parseSessionCookieSameSite('none', false)).toThrow(
      /requires NODE_ENV=production/,
    )
    expect(() => parseSessionCookieSameSite('None', true)).toThrow(
      /Invalid SESSION_COOKIE_SAMESITE/,
    )
  })
})

describe('productionWarnings', () => {
  const production = {
    ...loadConfig(baseEnv),
    production: true,
  }

  it('names risky but valid production settings without values', () => {
    const warnings = productionWarnings({
      ...production,
      trustProxy: false,
      allowedOrigins: ['http://www.example.test'],
      rateLimitStore: 'memory',
    })
    expect(warnings.join(' ')).toMatch(/TRUST_PROXY is unset/)
    expect(warnings.join(' ')).toMatch(/FRONTEND_URL contains a non-https/)
    expect(warnings.join(' ')).toMatch(/UPLOAD_SCANNER=none/)
    expect(warnings.join(' ')).toMatch(/RATE_LIMIT_STORE=memory/)
    expect(warnings.join(' ')).not.toContain('www.example.test')
  })

  it('is quiet for a complete production configuration and outside production', () => {
    expect(
      productionWarnings({
        ...production,
        trustProxy: 1,
        allowedOrigins: ['https://www.example.test'],
        rateLimitStore: 'postgres',
        uploadScanner: { kind: 'clamav', host: 'c', port: 3310, timeoutMs: 1 },
      }),
    ).toStrictEqual([])
    expect(productionWarnings(loadConfig(baseEnv))).toStrictEqual([])
  })
})
