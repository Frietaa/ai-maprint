// Helpers for authentication DB tests (*.db.test.ts) against the LOCAL TEST
// database maba_printing_test only.
//
// Unlike the catalog tests these cannot run inside a rolled-back
// transaction: the session store (connect-pg-simple) writes through its own
// pg pool. So auth tests commit real rows and clean up deterministically
// after every test — synthetic accounts use the reserved domain
// auth.test.invalid and every test-database session row is deleted
// (removeTestAccounts asserts the database identity first). DB test files
// run one at a time (--no-file-parallelism).
import { randomBytes } from 'node:crypto'
import { hash } from '@node-rs/argon2'
import {
  type ApiItemResponse,
  type CsrfTokenDto,
  CSRF_HEADER,
} from '@maba-printing/shared'
import pg from 'pg'
import request from 'supertest'
import { afterAll, afterEach, beforeEach } from 'vitest'
import {
  AUTH_TEST_EMAIL_DOMAIN,
  removeTestAccounts,
} from '../../scripts/e2e-fixtures.js'
import { loadTestDatabaseUrl } from '../../scripts/test-database.js'
import { type AppOptions, createApp } from '../app.js'
import { createPgSessionStore } from '../db/session-store.js'
import type { UserRole } from '../generated/prisma/client.js'
import { countQueries, testDb } from './test-db.js'

export { countQueries, testDb }

const pool = new pg.Pool({
  connectionString: loadTestDatabaseUrl().toString(),
  max: 3,
})

// One store and secret per test file, so "server restarts" (new app
// instances) can share persisted sessions like the real API does.
export const sessionStore = createPgSessionStore(pool, {
  pruneIntervalSeconds: false,
})
// Every app instance attaches connect/disconnect listeners to the store.
sessionStore.setMaxListeners(0)
const sessionSecret = randomBytes(32).toString('base64url')

beforeEach(async () => {
  await removeTestAccounts(testDb)
})

afterEach(async () => {
  await removeTestAccounts(testDb)
})

afterAll(async () => {
  await pool.end()
})

export function testEmail(local: string): string {
  return `${local}@${AUTH_TEST_EMAIL_DOMAIN}`
}

type TestAppOptions = Omit<AppOptions, 'auth'> & {
  auth?: Partial<AppOptions['auth']>
}

// The real app on the test database with the PostgreSQL session store.
export function createTestApp({ auth, ...options }: TestAppOptions = {}) {
  return createApp({
    getDb: () => testDb,
    ...options,
    auth: {
      sessionSecret,
      sessionStore,
      secureCookies: false,
      ...auth,
    },
  })
}

// A cookie-keeping client with CSRF handling: `csrf()` fetches (and caches)
// the session's token, `send()` performs an unsafe request with it.
export function browser(app = createTestApp()) {
  const agent = request.agent(app)
  let token: string | undefined

  return {
    agent,
    async csrf(): Promise<string> {
      token ??= csrfTokenOf(await agent.get('/api/v1/auth/csrf'))
      return token
    },
    // A new session ID comes with a new token: forget the cached one.
    resetCsrf(): void {
      token = undefined
    },
    async post(path: string, body?: object) {
      const csrf = await this.csrf()
      return agent.post(path).set(CSRF_HEADER, csrf).send(body)
    },
    async patch(path: string, body?: object) {
      const csrf = await this.csrf()
      return agent.patch(path).set(CSRF_HEADER, csrf).send(body)
    },
    // Password sign-in; the session (and so the CSRF token) is replaced.
    async signIn(email: string, password: string) {
      const response = await this.post('/api/v1/auth/login', {
        email,
        password,
      })
      if (response.status !== 200) {
        throw new Error(`Test sign-in failed with ${response.status}`)
      }
      token = undefined
      return response
    },
  }
}

// Typed access to a JSON response body.
export function bodyOf<T>(response: { body: unknown }): T {
  return response.body as T
}

export function csrfTokenOf(response: { body: unknown }): string {
  return bodyOf<ApiItemResponse<CsrfTokenDto>>(response).data.csrfToken
}

export interface TestUserInput {
  email: string
  name?: string
  password?: string | null
  googleId?: string | null
  role?: UserRole
  isActive?: boolean
  whatsapp?: string | null
}

// Inserts a synthetic account directly (password hashed with Argon2id).
export async function insertUser(input: TestUserInput) {
  return testDb.user.create({
    data: {
      email: input.email,
      name: input.name ?? 'Test Member',
      passwordHash:
        input.password === null || input.password === undefined
          ? null
          : await hash(input.password),
      googleId: input.googleId ?? null,
      role: input.role ?? 'MEMBER',
      isActive: input.isActive ?? true,
      whatsapp: input.whatsapp ?? null,
    },
    select: { id: true },
  })
}

// Session rows currently stored (test database only).
export async function sessionRows(): Promise<
  { sid: string; sess: Record<string, unknown> }[]
> {
  const result = await pool.query<{
    sid: string
    sess: Record<string, unknown>
  }>('SELECT sid, sess FROM user_sessions')
  return result.rows
}

// Set-Cookie headers of a response (always a list).
export function setCookieOf(response: { headers: object }): string[] {
  const value = (response.headers as Record<string, unknown>)['set-cookie']
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : []
}

// Raw signed cookie value of maba.sid from a Set-Cookie header list.
export function sessionCookie(
  setCookie: string[] | string | undefined,
): string | undefined {
  const list = Array.isArray(setCookie)
    ? setCookie
    : setCookie
      ? [setCookie]
      : []
  const entry = list.find((c) => c.startsWith('maba.sid='))
  return entry?.split(';')[0]?.slice('maba.sid='.length)
}

export { pool as sessionPool }
