import { describe, expect, it } from 'vitest'
import { loadConfig, parseAllowedOrigins } from './env.js'

describe('FRONTEND_URL allowlist', () => {
  it('normalizes comma-separated values to origins', () => {
    expect(
      parseAllowedOrigins(
        ' http://localhost:5173/ , https://web.example.test/x ',
      ),
    ).toStrictEqual(['http://localhost:5173', 'https://web.example.test'])
  })

  it('is empty when unset', () => {
    expect(loadConfig({}).allowedOrigins).toStrictEqual([])
  })

  it.each(['*', 'ftp://example.test', 'localhost:5173'])(
    'rejects %s',
    (value) => {
      expect(() => parseAllowedOrigins(value)).toThrow(/FRONTEND_URL/)
    },
  )
})
