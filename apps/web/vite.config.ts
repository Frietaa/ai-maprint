/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Local API used by the dev/preview proxy. The web app calls same-origin
// /api/v1/... unless VITE_API_BASE_URL points it elsewhere (e.g. E2E).
const localApi = 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: { '/api': localApi },
  },
  preview: {
    proxy: { '/api': localApi },
  },
  test: {
    environment: 'jsdom',
    // Playwright specs in e2e/ are run by Playwright, not Vitest.
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
