import { defineConfig, devices } from '@playwright/test'

// Dedicated ports so E2E never attaches to a developer's own servers.
const WEB_PORT = 5179
const API_PORT = 3199
const webOrigin = `http://localhost:${WEB_PORT}`
const apiOrigin = `http://localhost:${API_PORT}`

// Full-stack E2E: the real API runs against the LOCAL TEST database
// (maba_printing_test, guarded) with deterministic E2E fixtures; the web dev
// server calls it cross-origin, exercising the CORS allowlist. Requires the
// Docker PostgreSQL (npm run db:start) and TEST_DATABASE_URL in
// apps/api/.env. The development database is never used.
export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  // One shared fixture set: run serially.
  workers: 1,
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    baseURL: webOrigin,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run db:test:prepare && npm run e2e:api',
      cwd: '../api',
      url: `${apiOrigin}/api/v1/health`,
      env: { PORT: String(API_PORT), FRONTEND_URL: webOrigin },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: webOrigin,
      env: { VITE_API_BASE_URL: apiOrigin },
      reuseExistingServer: false,
    },
  ],
})
