/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { checkProductionApiUrl } from './hosting/build-checks.ts'
import {
  cacheControlFor,
  originOf,
  websiteSecurityHeaders,
} from './hosting/security-headers.ts'

// Local API used by the dev/preview proxy. The web app calls same-origin
// /api/v1/... unless VITE_API_BASE_URL points it elsewhere (e.g. E2E).
const localApi = 'http://localhost:3000'

// `vite preview` serves the production build with the website security
// headers the real host must send (KI-016, hosting/security-headers.ts).
// Not applied to the dev server: Vite's HMR client needs inline scripts.
function productionHeaders(): Plugin {
  const headers = websiteSecurityHeaders({
    apiOrigin: originOf(process.env.VITE_API_BASE_URL),
    googleSignIn: Boolean(process.env.VITE_GOOGLE_CLIENT_ID?.trim()),
    https: process.env.PREVIEW_HTTPS === 'true',
  })
  return {
    name: 'maba-production-headers',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        for (const [name, value] of Object.entries(headers)) {
          res.setHeader(name, value)
        }
        res.setHeader(
          'Cache-Control',
          cacheControlFor(new URL(req.url ?? '/', 'http://x').pathname),
        )
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    checkProductionApiUrl(process.env.VITE_API_BASE_URL, mode)
  }
  return {
    plugins: [react(), tailwindcss(), productionHeaders()],
    server: {
      proxy: { '/api': localApi },
    },
    preview: {
      proxy: { '/api': localApi },
    },
    test: {
      environment: 'jsdom',
      // Playwright specs in e2e/ are run by Playwright, not Vitest.
      include: ['src/**/*.test.{ts,tsx}', 'hosting/**/*.test.ts'],
      setupFiles: ['./src/test/setup.ts'],
    },
  }
})
