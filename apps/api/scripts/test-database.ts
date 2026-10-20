// Test-database identity guard, shared by scripts/test-db.ts and the
// database integration tests. Fails closed: anything that is not clearly the
// local test database is rejected before a connection is opened.
//
// Only TEST_DATABASE_URL is read. DATABASE_URL (the development database) is
// never used as a fallback.
import { existsSync } from 'node:fs'
import { readRequired } from '../src/config/env.js'

export const TEST_DATABASE_NAME = 'maba_printing_test'

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

// apps/api/.env is optional; real environment variables take precedence.
export function loadTestDatabaseUrl(): URL {
  if (existsSync('.env')) {
    process.loadEnvFile('.env')
  }
  return assertTestDatabaseUrl(readRequired(process.env, 'TEST_DATABASE_URL'))
}

export function assertTestDatabaseUrl(value: string): URL {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('TEST_DATABASE_URL is not a valid URL')
  }
  const name = decodeURIComponent(url.pathname.replace(/^\//, ''))
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('TEST_DATABASE_URL must be a PostgreSQL URL')
  }
  if (!LOOPBACK_HOSTS.has(url.hostname)) {
    throw new Error('TEST_DATABASE_URL must point to a local (loopback) host')
  }
  if (name !== TEST_DATABASE_NAME) {
    throw new Error(
      `TEST_DATABASE_URL must name the database ${TEST_DATABASE_NAME}`,
    )
  }
  return url
}

// Server-side check after connecting: the session really is in the test DB.
export function assertCurrentDatabase(
  currentDatabase: string | undefined,
): void {
  if (currentDatabase !== TEST_DATABASE_NAME) {
    throw new Error(
      `Connected to an unexpected database; expected ${TEST_DATABASE_NAME}`,
    )
  }
}
