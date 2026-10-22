// API process for the Playwright E2E suite (started by apps/web
// playwright.config.ts after `npm run db:test:prepare`).
//
// Serves the real application (createApp) against the LOCAL TEST database
// only: the database client and the session store are built from the
// guarded TEST_DATABASE_URL and DATABASE_URL (development) is never read.
// Deterministic fixtures are loaded before the port opens; Playwright's
// global teardown removes them together with E2E accounts, orders, sessions
// and uploaded files.
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import { provisionAdmin } from '../src/admin/admin-provisioning.js'
import { createApp } from '../src/app.js'
import { parseAllowedOrigins } from '../src/config/env.js'
import { createPgSessionStore } from '../src/db/session-store.js'
import { createLocalStorage } from '../src/storage/local-storage.js'
import { applyE2eFixtures, createTestDbClient } from './e2e-fixtures.js'
import {
  E2E_STORAGE_ROOT,
  E2E_UPLOAD_TEMP_DIR,
  prepareE2eStorage,
} from './e2e-storage.js'
import { loadTestDatabaseUrl } from './test-database.js'

const db = createTestDbClient()
await applyE2eFixtures(db)
// Synthetic Admin for the Admin E2E (test database only; removed with the
// other *.test.invalid accounts by the teardown). Not a real credential.
await provisionAdmin(db, {
  email: 'admin@e2e.test.invalid',
  name: 'Admin E2E',
  password: 'e2e admin password',
  promote: false,
})
// Uploaded E2E documents go to an isolated temp directory (removed again by
// `e2e:fixtures:clean`), never to the development storage.
prepareE2eStorage()

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
  orders: {
    storage: createLocalStorage(E2E_STORAGE_ROOT),
    uploadTempDir: E2E_UPLOAD_TEMP_DIR,
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
