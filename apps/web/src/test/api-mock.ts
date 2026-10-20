import { vi } from 'vitest'

// Declarative fetch mock for component tests, keyed by URL pathname
// (e.g. "/api/v1/locations"). Unlisted public endpoints answer with an
// empty/unconfigured response so the shell always renders.
export type MockResponse =
  { status?: number; body: unknown } | 'network-error' | 'pending'

export type MockRoutes = Record<string, MockResponse | MockResponse[]>

const defaults: MockRoutes = {
  '/api/v1/public/settings': { body: { data: null } },
  '/api/v1/locations': { body: { data: [], meta: { count: 0 } } },
  '/api/v1/services': { body: { data: [], meta: { count: 0 } } },
  '/api/v1/products': { body: { data: [], meta: { count: 0 } } },
}

export function mockApi(routes: MockRoutes = {}) {
  const table = { ...defaults, ...routes }
  const calls: URL[] = []
  const seen = new Map<string, number>()

  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = new URL(
      input instanceof Request ? input.url : String(input),
      'http://localhost',
    )
    calls.push(url)
    const entry = table[url.pathname]
    if (entry === undefined) {
      return Promise.resolve(json(404, { message: 'Not found' }))
    }
    // Arrays answer successive calls in order (last one repeats).
    const index = seen.get(url.pathname) ?? 0
    seen.set(url.pathname, index + 1)
    const response = Array.isArray(entry)
      ? entry[Math.min(index, entry.length - 1)]
      : entry

    if (response === undefined || response === 'pending') {
      return new Promise<Response>(() => {})
    }
    if (response === 'network-error') {
      return Promise.reject(new TypeError('Failed to fetch'))
    }
    return Promise.resolve(json(response.status ?? 200, response.body))
  })

  vi.stubGlobal('fetch', fetchMock)
  return { calls, fetchMock }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
