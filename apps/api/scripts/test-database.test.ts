// Fast guard tests (no database): part of the normal `npm run test`.
import { describe, expect, it } from 'vitest'
import {
  assertCurrentDatabase,
  assertTestDatabaseUrl,
} from './test-database.js'

const local = 'postgresql://maba_dev:maba_dev_password@localhost:5432'

describe('test database guard', () => {
  it('accepts only the local maba_printing_test database', () => {
    expect(
      assertTestDatabaseUrl(`${local}/maba_printing_test?schema=public`)
        .hostname,
    ).toBe('localhost')
    expect(() =>
      assertTestDatabaseUrl(
        'postgresql://u:p@127.0.0.1:5432/maba_printing_test',
      ),
    ).not.toThrow()
  })

  it('rejects the development database', () => {
    expect(() =>
      assertTestDatabaseUrl(`${local}/maba_printing_dev?schema=public`),
    ).toThrow(/maba_printing_test/)
  })

  it('rejects other names, remote hosts and invalid URLs', () => {
    expect(() => assertTestDatabaseUrl(`${local}/postgres`)).toThrow()
    expect(() =>
      assertTestDatabaseUrl(`${local}/maba_printing_test_old`),
    ).toThrow()
    expect(() => assertTestDatabaseUrl(`${local}/`)).toThrow()
    expect(() =>
      assertTestDatabaseUrl(
        'postgresql://u:p@db.example.test:5432/maba_printing_test',
      ),
    ).toThrow(/local/)
    expect(() =>
      assertTestDatabaseUrl('mysql://u:p@localhost/maba_printing_test'),
    ).toThrow()
    expect(() => assertTestDatabaseUrl('not a url')).toThrow()
  })

  it('rejects a connection whose current_database() is not the test database', () => {
    expect(() => assertCurrentDatabase('maba_printing_test')).not.toThrow()
    expect(() => assertCurrentDatabase('maba_printing_dev')).toThrow()
    expect(() => assertCurrentDatabase(undefined)).toThrow()
  })
})
