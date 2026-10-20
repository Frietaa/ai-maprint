import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { resetCsrfToken } from '../lib/api-client.ts'
import { mockApi } from './api-mock.ts'

// jsdom does not implement scrolling; React Router's ScrollRestoration calls
// window.scrollTo on navigation.
window.scrollTo = () => {}

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
