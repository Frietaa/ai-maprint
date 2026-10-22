// Minimal native-fetch client for the MABA PRINTING API — the only one in
// the web app. TanStack Query owns caching/retries; this module builds URLs,
// performs requests and turns every failure into one ApiError type.
//
// Session handling: every request is sent with `credentials: "include"` so
// the HttpOnly session cookie travels with it (also cross-origin, where the
// API's CORS allowlist permits credentials). JavaScript never sees the
// session ID. Unsafe requests carry the session-bound CSRF token, which is
// kept in memory only (never in localStorage/sessionStorage).
import {
  API_PREFIX,
  type ApiErrorResponse,
  type ApiItemResponse,
  AUTH_API_PATHS,
  CSRF_HEADER,
  type CsrfTokenDto,
} from '@maba-printing/shared'

export type ApiErrorKind = 'network' | 'http' | 'invalid-response'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly fieldErrors: Record<string, string[]> | null

  constructor(
    kind: ApiErrorKind,
    message: string,
    status: number | null = null,
    fieldErrors: Record<string, string[]> | null = null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export type QueryParams = Record<string, string | undefined>

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '')
  .trim()
  .replace(/\/+$/, '')

export function buildApiUrl(path: string, params: QueryParams = {}): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, value)
  }
  const query = search.toString()
  return `${apiBase}${API_PREFIX}${path}${query ? `?${query}` : ''}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toFieldErrors(value: unknown): Record<string, string[]> | null {
  if (!isRecord(value)) return null
  const result: Record<string, string[]> = {}
  for (const [field, messages] of Object.entries(value)) {
    if (Array.isArray(messages)) {
      result[field] = messages.filter((m): m is string => typeof m === 'string')
    }
  }
  return result
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown
  } catch {
    return undefined
  }
}

// Performs the request and returns the parsed JSON envelope ({ data, ... }).
async function request<T extends { data: unknown }>(
  url: string,
  init: RequestInit,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, { ...init, credentials: 'include' })
  } catch (error) {
    if (init.signal?.aborted) throw error
    throw new ApiError('network', 'Network request failed')
  }

  const body = await readJson(response)

  if (!response.ok) {
    const errorBody = isRecord(body) ? (body as Partial<ApiErrorResponse>) : {}
    throw new ApiError(
      'http',
      typeof errorBody.message === 'string'
        ? errorBody.message
        : `HTTP ${response.status}`,
      response.status,
      toFieldErrors(errorBody.errors),
    )
  }

  if (!isRecord(body) || !('data' in body)) {
    throw new ApiError(
      'invalid-response',
      'Unexpected response format',
      response.status,
    )
  }
  return body as T
}

// GET a JSON envelope ({ data, meta? }). Resolves with the parsed body;
// rejects with ApiError on network failure, non-2xx status or a body that is
// not a JSON envelope.
export function apiGet<T extends { data: unknown }>(
  path: string,
  params?: QueryParams,
  signal?: AbortSignal,
): Promise<T> {
  return request<T>(buildApiUrl(path, params), {
    headers: { Accept: 'application/json' },
    signal,
  })
}

// --- CSRF ---------------------------------------------------------------------

let csrfToken: Promise<string> | null = null

// The current session's CSRF token, fetched once and then reused. Fetching
// it is what creates the (anonymous) server session, so it happens only
// right before an unsafe request — never merely for browsing.
function getCsrfToken(): Promise<string> {
  csrfToken ??= apiGet<ApiItemResponse<CsrfTokenDto>>(AUTH_API_PATHS.csrf)
    .then((body) => {
      if (typeof body.data.csrfToken !== 'string') {
        throw new ApiError('invalid-response', 'Unexpected response format')
      }
      return body.data.csrfToken
    })
    .catch((error: unknown) => {
      csrfToken = null
      throw error
    })
  return csrfToken
}

// Forget the token after the server rotated the session (sign-in,
// registration, Google sign-in, logout).
export function resetCsrfToken(): void {
  csrfToken = null
}

export function isCsrfRejection(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 403 &&
    error.message === 'Invalid CSRF token'
  )
}

// POST/PATCH with the CSRF header: a JSON body, or FormData (multipart,
// e.g. printing documents) whose Content-Type and boundary the browser sets
// itself. A CSRF rejection (expired or rotated session) refreshes the token
// and retries exactly once. `headers` adds request-specific headers (e.g.
// Idempotency-Key); it cannot replace the CSRF or content headers.
export async function apiSend<T extends { data: unknown }>(
  method: 'POST' | 'PATCH' | 'PUT',
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<T> {
  const multipart = body instanceof FormData
  const send = async () =>
    request<T>(buildApiUrl(path), {
      method,
      headers: {
        ...headers,
        Accept: 'application/json',
        ...(multipart ? {} : { 'Content-Type': 'application/json' }),
        [CSRF_HEADER]: await getCsrfToken(),
      },
      body: multipart
        ? body
        : body === undefined
          ? undefined
          : JSON.stringify(body),
    })

  try {
    return await send()
  } catch (error) {
    if (!isCsrfRejection(error)) throw error
    resetCsrfToken()
    return send()
  }
}
