// Safe, database-free auth configuration for API tests: a random
// per-process session secret and an in-memory session store. Never used by
// the running API (src/test is excluded from the build).
import { randomBytes } from 'node:crypto'
import session from 'express-session'
import type { AuthOptions } from '../app.js'

export function testAuthOptions(overrides: Partial<AuthOptions> = {}) {
  return {
    sessionSecret: randomBytes(32).toString('base64url'),
    sessionStore: new session.MemoryStore(),
    secureCookies: false,
    ...overrides,
  } satisfies AuthOptions
}
