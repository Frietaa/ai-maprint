// API process for the Playwright E2E suite (started by apps/web
// playwright.config.ts after `npm run db:test:prepare`).
//
// Serves the real application (createApp) against the LOCAL TEST database
// only: the database client and the session store are built from the
// guarded TEST_DATABASE_URL and DATABASE_URL (development) is never read.
// Deterministic fixtures are loaded before the port opens; Playwright's
// global teardown removes them together with E2E accounts and sessions.
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import { createApp } from '../src/app.js'
import { parseAllowedOrigins } from '../src/config/env.js'
import { createPgSessionStore } from '../src/db/session-store.js'
import { applyE2eFixtures, createTestDbClient } from './e2e-fixtures.js'
import { loadTestDatabaseUrl } from './test-database.js'

const db = createTestDbClient()
await applyE2eFixtures(db)

const sessionPool = new pg.Pool({
  connectionString: loadTestDatabaseUrl().toString(),
  max: 3,
})

const port = Number(process.env.PORT)
const server = createApp({
  getDb: () => db,
  allowedOrigins: parseAllowedOrigins(process.env.FRONTEND_URL),
  auth: {
    // Ephemeral per-run secret: E2E sessions never outlive the process.
    sessionSecret: randomBytes(32).toString('base64url'),
    sessionStore: createPgSessionStore(sessionPool, {
      pruneIntervalSeconds: false,
    }),
    secureCookies: false,
  },
}).listen(port, () => {
  console.log(`E2E API (maba_printing_test) listening on port ${port}`)
})

function shutdown() {
  server.close(() => {
    void Promise.allSettled([db.$disconnect(), sessionPool.end()]).finally(() =>
      process.exit(0),
    )
  })
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
