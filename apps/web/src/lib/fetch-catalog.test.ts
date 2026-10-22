import { describe, expect, it } from 'vitest'
import { mockApi } from '../test/api-mock.ts'
import { fetchCatalog, MAX_CATALOG_PAGES } from './fetch-catalog.ts'

function page(ids: string[], pageNo: number, totalPages: number) {
  return {
    body: {
      data: ids.map((id) => ({ id })),
      meta: {
        count: ids.length,
        page: pageNo,
        pageSize: 2,
        total: totalPages * 2,
        totalPages,
      },
    },
  }
}

describe('fetchCatalog', () => {
  it('reads every page in order', async () => {
    const api = mockApi({
      '/api/v1/products': [
        page(['a', 'b'], 1, 3),
        page(['c', 'd'], 2, 3),
        page(['e'], 3, 3),
      ],
    })
    const items = await fetchCatalog<{ id: string }>('/products', {
      categoryId: 'x',
    })
    expect(items.map((item) => item.id)).toStrictEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
    ])
    const calls = api.calls.filter((url) => url.pathname === '/api/v1/products')
    expect(calls.map((url) => url.searchParams.get('page'))).toStrictEqual([
      null,
      '2',
      '3',
    ])
    expect(
      calls.every((url) => url.searchParams.get('categoryId') === 'x'),
    ).toBe(true)
  })

  it('stops after one request for a single (or empty) page', async () => {
    const api = mockApi({ '/api/v1/services': page([], 1, 0) })
    expect(await fetchCatalog('/services')).toStrictEqual([])
    expect(api.calls).toHaveLength(1)
  })

  it('never reads more than the page cap', async () => {
    const api = mockApi({ '/api/v1/products': page(['a'], 1, 1000) })
    await fetchCatalog('/products')
    expect(api.calls).toHaveLength(MAX_CATALOG_PAGES)
  })
})
