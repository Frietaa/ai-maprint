// Shared PostgreSQL rate-limit store (TASK-07.02, KI-015) against
// maba_printing_test.
import type { Options } from 'express-rate-limit'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { browser, createTestApp, testDb } from '../test/auth-db.js'
import {
  PostgresRateLimitStore,
  postgresRateLimitStores,
} from './rate-limit-store.js'

async function clearCounters() {
  await testDb.$executeRaw`DELETE FROM rate_limit_counters`
}

beforeEach(clearCounters)
afterEach(clearCounters)

function store(prefix = 'test', windowMs = 60_000) {
  const instance = new PostgresRateLimitStore(() => testDb, prefix)
  instance.init({ windowMs } as Options)
  return instance
}

describe('PostgresRateLimitStore', () => {
  it('counts hits per key within the window', async () => {
    const limiter = store()
    const first = await limiter.increment('203.0.113.7')
    const second = await limiter.increment('203.0.113.7')
    expect(first.totalHits).toBe(1)
    expect(second.totalHits).toBe(2)
    expect(second.resetTime?.getTime()).toBe(first.resetTime?.getTime())
    const remainingMs = (first.resetTime?.getTime() ?? 0) - Date.now()
    expect(remainingMs).toBeGreaterThan(55_000)
    expect(remainingMs).toBeLessThanOrEqual(61_000)
    expect(await limiter.get('203.0.113.7')).toMatchObject({ totalHits: 2 })
    expect((await limiter.increment('198.51.100.1')).totalHits).toBe(1)
  })

  it('starts a new window once the old one ended', async () => {
    const limiter = store('short', 300)
    await limiter.increment('ip')
    await limiter.increment('ip')
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(await limiter.get('ip')).toBeUndefined()
    expect((await limiter.increment('ip')).totalHits).toBe(1)
  })

  it('decrements and resets keys', async () => {
    const limiter = store()
    await limiter.increment('ip')
    await limiter.increment('ip')
    await limiter.decrement('ip')
    expect(await limiter.get('ip')).toMatchObject({ totalHits: 1 })
    await limiter.resetKey('ip')
    expect(await limiter.get('ip')).toBeUndefined()
  })

  it('keeps limiters apart by prefix', async () => {
    await store('sign-in').increment('ip')
    expect(await store('orders').get('ip')).toBeUndefined()
    const rows = await testDb.rateLimitCounter.findMany({
      orderBy: { key: 'asc' },
    })
    expect(rows.map((row) => row.key)).toStrictEqual(['sign-in:ip'])
  })

  it('counts concurrent increments exactly once each', async () => {
    const limiter = store()
    const results = await Promise.all(
      Array.from({ length: 40 }, () => limiter.increment('busy')),
    )
    expect(results.map((r) => r.totalHits).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 40 }, (_, index) => index + 1),
    )
  })

  it('prunes only expired counters', async () => {
    await store('old', 100).increment('ip')
    await store('live').increment('ip')
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(await store('live').prune()).toBe(1)
    const rows = await testDb.rateLimitCounter.findMany()
    expect(rows.map((row) => row.key)).toStrictEqual(['live:ip'])
  })
})

describe('shared limits across API instances', () => {
  it('enforces one budget for two app instances', async () => {
    const options = {
      auth: {
        rateLimits: { windowMs: 60_000, signInFailures: 50, registrations: 3 },
      },
      rateLimitStores: postgresRateLimitStores(() => testDb),
    }
    const instanceA = browser(createTestApp(options))
    const instanceB = browser(createTestApp(options))
    const register = (client: ReturnType<typeof browser>, n: number) =>
      client.post('/api/v1/auth/register', {
        name: 'x',
        email: 'not-an-email',
        password: `password ${n}`,
      })

    const statuses = [
      (await register(instanceA, 1)).status,
      (await register(instanceB, 2)).status,
      (await register(instanceA, 3)).status,
      (await register(instanceB, 4)).status,
    ]
    // Three attempts (invalid ones count too) pass the limiter; the fourth
    // is refused although it reached the other instance.
    expect(statuses.slice(0, 3)).toStrictEqual([400, 400, 400])
    expect(statuses[3]).toBe(429)
  })
})
