import { vi } from 'vitest'

// Declarative fetch mock for component tests, keyed by URL pathname
// (e.g. "/api/v1/locations") or by "METHOD pathname" (e.g.
// "PATCH /api/v1/account/profile"; checked first). Unlisted public endpoints
// answer with an empty/unconfigured response and the visitor is signed out,
// so the shell always renders.
export type MockResponse =
  { status?: number; body: unknown } | 'network-error' | 'pending'

export type MockRoutes = Record<string, MockResponse | MockResponse[]>

export interface RecordedRequest {
  method: string
  url: URL
  headers: Headers
  credentials: RequestCredentials | undefined
  // Parsed JSON body, if any.
  body: unknown
  // multipart (FormData) requests: field name -> values (files by name).
  form: Record<string, string[]> | null
}

function formEntries(body: unknown): Record<string, string[]> | null {
  if (!(body instanceof FormData)) return null
  const entries: Record<string, string[]> = {}
  for (const [key, value] of body.entries()) {
    ;(entries[key] ??= []).push(typeof value === 'string' ? value : value.name)
  }
  return entries
}

export const TEST_CSRF_TOKEN = 'test-csrf-token'

const defaults: MockRoutes = {
  '/api/v1/public/settings': { body: { data: null } },
  '/api/v1/locations': { body: { data: [], meta: { count: 0 } } },
  '/api/v1/services': { body: { data: [], meta: { count: 0 } } },
  '/api/v1/products': { body: { data: [], meta: { count: 0 } } },
  '/api/v1/auth/me': { body: { data: null } },
  '/api/v1/auth/csrf': { body: { data: { csrfToken: TEST_CSRF_TOKEN } } },
}

export function mockApi(routes: MockRoutes = {}) {
  const table = { ...defaults, ...routes }
  const calls: URL[] = []
  const requests: RecordedRequest[] = []
  const seen = new Map<string, number>()

  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(
      input instanceof Request ? input.url : String(input),
      'http://localhost',
    )
    const method = (init?.method ?? 'GET').toUpperCase()
    calls.push(url)
    requests.push({
      method,
      url,
      headers: new Headers(init?.headers),
      credentials: init?.credentials,
      body:
        typeof init?.body === 'string'
          ? (JSON.parse(init.body) as unknown)
          : undefined,
      form: formEntries(init?.body),
    })

    const key = `${method} ${url.pathname}`
    const routeKey = key in table ? key : url.pathname
    const entry = table[routeKey]
    if (entry === undefined) {
      return Promise.resolve(json(404, { message: 'Not found' }))
    }
    // Arrays answer successive calls in order (last one repeats).
    const index = seen.get(routeKey) ?? 0
    seen.set(routeKey, index + 1)
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

  // Requests to `path` with `method`.
  function requestsTo(method: string, path: string): RecordedRequest[] {
    return requests.filter(
      (r) => r.method === method && r.url.pathname === path,
    )
  }

  return { calls, requests, requestsTo, fetchMock }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
