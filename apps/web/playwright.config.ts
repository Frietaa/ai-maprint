import { defineConfig, devices } from '@playwright/test'

// Dedicated port so the smoke test never attaches to a developer's own server.
const PORT = 5179

export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  // Phase 00: Chromium only.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
  },
})
