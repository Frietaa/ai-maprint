// Shared rate-limit store for express-rate-limit (TASK-07.02, KI-015):
// RATE_LIMIT_STORE=postgres. Counters live in rate_limit_counters (one row
// per limiter key and window), so every API instance enforces the same
// budget and a restart does not reset it. Each increment is one atomic
// upsert evaluated with the database clock, so concurrent requests on
// different instances can never both read a stale count.
import type {
  ClientRateLimitInfo,
  IncrementResponse,
  Options,
  Store,
} from 'express-rate-limit'
import type { DbClient } from '../db/prisma.js'

// Expired counters are removed at most this often per store.
const PRUNE_INTERVAL_MS = 10 * 60 * 1000

interface CounterRow {
  hits: number
  reset_at: Date
}

export class PostgresRateLimitStore implements Store {
  // Keys incremented here are visible to every instance.
  readonly localKeys = false
  readonly prefix: string
  private readonly getDb: () => DbClient
  private windowMs = 60_000
  private lastPrune = 0

  // `prefix` distinguishes the limiters (sign-in, orders, ...) that share
  // the table: keys are `${prefix}:${client key}`.
  constructor(getDb: () => DbClient, prefix: string) {
    this.getDb = getDb
    this.prefix = `${prefix}:`
  }

  init(options: Options): void {
    this.windowMs = options.windowMs
  }

  private keyFor(key: string): string {
    return `${this.prefix}${key}`.slice(0, 200)
  }

  async get(key: string): Promise<ClientRateLimitInfo | undefined> {
    const rows = await this.getDb().$queryRaw<CounterRow[]>`
      SELECT hits, reset_at FROM rate_limit_counters
      WHERE key = ${this.keyFor(key)} AND reset_at > now()`
    const row = rows[0]
    return row ? { totalHits: row.hits, resetTime: row.reset_at } : undefined
  }

  async increment(key: string): Promise<IncrementResponse> {
    const rows = await this.getDb().$queryRaw<CounterRow[]>`
      INSERT INTO rate_limit_counters AS c (key, hits, reset_at)
      VALUES (${this.keyFor(key)}, 1,
              now() + make_interval(secs => ${this.windowMs / 1000}))
      ON CONFLICT (key) DO UPDATE SET
        hits = CASE WHEN c.reset_at <= now() THEN 1 ELSE c.hits + 1 END,
        reset_at = CASE WHEN c.reset_at <= now() THEN EXCLUDED.reset_at
                        ELSE c.reset_at END
      RETURNING hits, reset_at`
    this.pruneSoon()
    const row = rows[0]
    if (!row) throw new Error('Rate limit counter not returned')
    return { totalHits: row.hits, resetTime: row.reset_at }
  }

  async decrement(key: string): Promise<void> {
    await this.getDb().$executeRaw`
      UPDATE rate_limit_counters SET hits = GREATEST(hits - 1, 0)
      WHERE key = ${this.keyFor(key)} AND reset_at > now()`
  }

  async resetKey(key: string): Promise<void> {
    await this.getDb().$executeRaw`
      DELETE FROM rate_limit_counters WHERE key = ${this.keyFor(key)}`
  }

  // Deletes counters whose window ended (all limiters).
  async prune(): Promise<number> {
    return this.getDb().$executeRaw`
      DELETE FROM rate_limit_counters WHERE reset_at <= now()`
  }

  // Opportunistic, non-blocking pruning: no timers to keep alive.
  private pruneSoon(): void {
    const now = Date.now()
    if (now - this.lastPrune < PRUNE_INTERVAL_MS) return
    this.lastPrune = now
    this.prune().catch(() => {
      // A failed prune is retried on a later request; counting is unaffected.
    })
  }
}

// One store per limiter (express-rate-limit refuses a shared instance).
export type RateLimitStoreFactory = (limiterName: string) => Store | undefined

export function postgresRateLimitStores(
  getDb: () => DbClient,
): RateLimitStoreFactory {
  return (limiterName) => new PostgresRateLimitStore(getDb, limiterName)
}
