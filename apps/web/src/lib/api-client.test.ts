import { describe, expect, it } from 'vitest'
import { mockApi, TEST_CSRF_TOKEN } from '../test/api-mock.ts'
import {
  ApiError,
  apiGet,
  apiSend,
  buildApiUrl,
  resetCsrfToken,
} from './api-client.ts'

describe('buildApiUrl', () => {
  it('prefixes /api/v1 and drops empty parameters', () => {
    expect(
      buildApiUrl('/products', {
        categoryId: 'abc',
        availability: undefined,
        x: '',
      }),
    ).toBe('/api/v1/products?categoryId=abc')
    expect(buildApiUrl('/locations')).toBe('/api/v1/locations')
  })
})

describe('apiGet', () => {
  it('always sends credentials (session cookie)', async () => {
    const { requests } = mockApi()
    await apiGet('/locations')
    expect(requests[0]?.credentials).toBe('include')
  })

  it('resolves with the JSON envelope', async () => {
    mockApi({
      '/api/v1/locations': { body: { data: [1], meta: { count: 1 } } },
    })

    await expect(apiGet('/locations')).resolves.toStrictEqual({
      data: [1],
      meta: { count: 1 },
    })
  })

  it('normalizes HTTP errors, keeping status and field errors', async () => {
    mockApi({
      '/api/v1/products': {
        status: 400,
        body: {
          message: 'Validation failed',
          errors: { categoryId: ['Must be a valid UUID'] },
        },
      },
    })

    const error = await apiGet('/products').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      kind: 'http',
      status: 400,
      message: 'Validation failed',
      fieldErrors: { categoryId: ['Must be a valid UUID'] },
    })
  })

  it('normalizes network failures', async () => {
    mockApi({ '/api/v1/locations': 'network-error' })

    await expect(apiGet('/locations')).rejects.toMatchObject({
      kind: 'network',
      status: null,
    })
  })

  it('rejects bodies that are not a data envelope', async () => {
    mockApi({ '/api/v1/locations': { body: ['not', 'an', 'envelope'] } })

    await expect(apiGet('/locations')).rejects.toMatchObject({
      kind: 'invalid-response',
    })
  })

  it('handles non-JSON error bodies', async () => {
    mockApi({ '/api/v1/locations': { status: 502, body: undefined } })

    await expect(apiGet('/locations')).rejects.toMatchObject({
      kind: 'http',
      status: 502,
      message: 'HTTP 502',
    })
  })
})

describe('apiSend', () => {
  const user = { name: 'Ana', email: 'ana@example.test', role: 'MEMBER' }

  it('fetches the CSRF token first and sends it with JSON and credentials', async () => {
    const api = mockApi({ 'POST /api/v1/auth/login': { body: { data: user } } })

    await expect(
      apiSend('POST', '/auth/login', { email: 'a', password: 'b' }),
    ).resolves.toStrictEqual({ data: user })

    expect(api.requests.map((r) => `${r.method} ${r.url.pathname}`)).toEqual([
      'GET /api/v1/auth/csrf',
      'POST /api/v1/auth/login',
    ])
    const post = api.requests[1]
    expect(post?.headers.get('X-CSRF-Token')).toBe(TEST_CSRF_TOKEN)
    expect(post?.headers.get('Content-Type')).toBe('application/json')
    expect(post?.credentials).toBe('include')
    expect(post?.body).toStrictEqual({ email: 'a', password: 'b' })
  })

  it('reuses the token until it is reset', async () => {
    const api = mockApi({
      'POST /api/v1/auth/logout': { body: { data: null } },
    })
    await apiSend('POST', '/auth/logout')
    await apiSend('POST', '/auth/logout')
    expect(api.requestsTo('GET', '/api/v1/auth/csrf')).toHaveLength(1)

    resetCsrfToken()
    await apiSend('POST', '/auth/logout')
    expect(api.requestsTo('GET', '/api/v1/auth/csrf')).toHaveLength(2)
  })

  it('refreshes the token and retries once after a CSRF rejection', async () => {
    const api = mockApi({
      '/api/v1/auth/csrf': [
        { body: { data: { csrfToken: 'stale' } } },
        { body: { data: { csrfToken: 'fresh' } } },
      ],
      'PATCH /api/v1/account/profile': [
        { status: 403, body: { message: 'Invalid CSRF token' } },
        { body: { data: { name: 'Ana' } } },
      ],
    })

    await expect(
      apiSend('PATCH', '/account/profile', { name: 'Ana' }),
    ).resolves.toStrictEqual({ data: { name: 'Ana' } })
    const patches = api.requestsTo('PATCH', '/api/v1/account/profile')
    expect(patches.map((r) => r.headers.get('X-CSRF-Token'))).toEqual([
      'stale',
      'fresh',
    ])
  })

  it('does not retry other 403 responses', async () => {
    const api = mockApi({
      'PATCH /api/v1/account/profile': {
        status: 403,
        body: { message: 'Forbidden' },
      },
    })
    await expect(
      apiSend('PATCH', '/account/profile', { name: 'x' }),
    ).rejects.toMatchObject({ status: 403 })
    expect(api.requestsTo('PATCH', '/api/v1/account/profile')).toHaveLength(1)
  })

  it('surfaces a failing CSRF request and tries again next time', async () => {
    const api = mockApi({
      '/api/v1/auth/csrf': [
        'network-error',
        { body: { data: { csrfToken: 't' } } },
      ],
      'POST /api/v1/auth/logout': { body: { data: null } },
    })
    await expect(apiSend('POST', '/auth/logout')).rejects.toBeInstanceOf(
      ApiError,
    )
    await expect(apiSend('POST', '/auth/logout')).resolves.toStrictEqual({
      data: null,
    })
    expect(api.requestsTo('GET', '/api/v1/auth/csrf')).toHaveLength(2)
  })

  it('never stores the token in web storage', async () => {
    mockApi({ 'POST /api/v1/auth/logout': { body: { data: null } } })
    await apiSend('POST', '/auth/logout')
    expect(JSON.stringify({ ...localStorage })).not.toContain(TEST_CSRF_TOKEN)
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(TEST_CSRF_TOKEN)
  })
})
