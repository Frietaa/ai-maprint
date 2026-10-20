// Minimal native-fetch client for the MABA PRINTING public API. TanStack
// Query owns caching/retries; this module only builds URLs, performs the
// request and turns every failure into one ApiError type.
import { API_PREFIX, type ApiErrorResponse } from '@maba-printing/shared'

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

// GET a JSON envelope ({ data, meta? }). Resolves with the parsed body;
// rejects with ApiError on network failure, non-2xx status or a body that is
// not a JSON envelope.
export async function apiGet<T extends { data: unknown }>(
  path: string,
  params?: QueryParams,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(buildApiUrl(path, params), {
      headers: { Accept: 'application/json' },
      signal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
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
