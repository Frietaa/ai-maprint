import { defineConfig, devices } from '@playwright/test'

// Production-build smoke: `vite build` + `vite preview` with the website
// security headers (hosting/security-headers.ts) against the real API on the
// LOCAL TEST database with E2E fixtures (same guards as playwright.config).
// Checks that the CSP and other headers do not break the built app.
const WEB_PORT = 5189
const API_PORT = 3189
const webOrigin = `http://localhost:${WEB_PORT}`
const apiOrigin = `http://localhost:${API_PORT}`

export default defineConfig({
  testDir: './e2e-preview',
  reporter: 'list',
  workers: 1,
  globalTeardown: './e2e/global-teardown.ts',
  use: { baseURL: webOrigin },
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
      command: `npx vite build && npx vite preview --port ${WEB_PORT} --strictPort`,
      url: webOrigin,
      env: { VITE_API_BASE_URL: apiOrigin },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
})
