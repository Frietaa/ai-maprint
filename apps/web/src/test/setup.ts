import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, vi } from 'vitest'
import { resetCsrfToken } from '../lib/api-client.ts'
import { mockApi } from './api-mock.ts'

// jsdom does not implement scrolling; React Router's ScrollRestoration calls
// window.scrollTo on navigation.
window.scrollTo = () => {}

// The Admin area is a lazily loaded chunk in the app (routes.tsx). Load the
// module once up front so the first lazy route in a test does not race the
// default findBy* timeout; lazy routes still resolve asynchronously.
beforeAll(async () => {
  await import('../app/admin-pages.ts')
})
configure({ asyncUtilTimeout: 2000 })

// Every test starts with the default (empty/unconfigured) API; tests that
// need data call mockApi() again with their own responses.
beforeEach(() => {
  mockApi()
  // The in-memory CSRF token must not leak between tests.
  resetCsrfToken()
})

// Vitest globals are off, so React Testing Library cannot auto-cleanup.
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
