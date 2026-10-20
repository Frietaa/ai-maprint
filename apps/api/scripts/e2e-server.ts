// API process for the Playwright E2E suite (started by apps/web
// playwright.config.ts after `npm run db:test:prepare`).
//
// Serves the real application (createApp) against the LOCAL TEST database
// only: the database client is built from the guarded TEST_DATABASE_URL and
// DATABASE_URL (development) is never read. Deterministic fixtures are
// loaded before the port opens; Playwright's global teardown removes them.
import { createApp } from '../src/app.js'
import { loadConfig } from '../src/config/env.js'
import { applyE2eFixtures, createTestDbClient } from './e2e-fixtures.js'

const db = createTestDbClient()
await applyE2eFixtures(db)

const { port, allowedOrigins } = loadConfig()
const server = createApp({ getDb: () => db, allowedOrigins }).listen(
  port,
  () => {
    console.log(`E2E API (maba_printing_test) listening on port ${port}`)
  },
)

function shutdown() {
  server.close(() => {
    void db.$disconnect().finally(() => process.exit(0))
  })
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
