import { describe, expect, it } from 'vitest'
import { mockApi } from '../test/api-mock.ts'
import { ApiError, apiGet, buildApiUrl } from './api-client.ts'

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
