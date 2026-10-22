import { describe, expect, it } from 'vitest'
import { ApiError } from '../lib/api-client.ts'
import { createQueryClient } from './query-client.ts'

// Whether `auth/me` was invalidated after a query with `key` failed.
async function sessionRecheckedAfter(key: readonly unknown[], status: number) {
  const client = createQueryClient()
  client.setQueryData(['auth', 'me'], { name: 'Ana' })
  await client
    .fetchQuery({
      queryKey: key,
      queryFn: () => Promise.reject(new ApiError('http', 'x', status)),
      retry: false,
    })
    .catch(() => undefined)
  return client.getQueryState(['auth', 'me'])?.isInvalidated ?? false
}

describe('createQueryClient', () => {
  it('re-checks the session after a 401 from an account or Admin query', async () => {
    expect(await sessionRecheckedAfter(['account', 'orders'], 401)).toBe(true)
    expect(await sessionRecheckedAfter(['admin', 'dashboard'], 401)).toBe(true)
  })

  it('leaves the session alone for other failures', async () => {
    expect(await sessionRecheckedAfter(['account', 'orders'], 404)).toBe(false)
    expect(await sessionRecheckedAfter(['public', 'products'], 401)).toBe(false)
  })
})
