// Server-only. PostgreSQL-backed express-session store (connect-pg-simple)
// on the table user_sessions, which is owned by the Prisma migration
// history (migration auth_sessions) — the library never creates tables.
import connectPgSimple from 'connect-pg-simple'
import session from 'express-session'
import type pg from 'pg'

export const SESSION_TABLE = 'user_sessions'

// Expired rows never authenticate (the store filters on `expire`); pruning
// only removes them. 15 minutes is the library default.
export const DEFAULT_PRUNE_INTERVAL_SECONDS = 15 * 60

const PgSessionStore = connectPgSimple(session)

export function createPgSessionStore(
  pool: pg.Pool,
  { pruneIntervalSeconds }: { pruneIntervalSeconds: number | false },
): session.Store {
  return new PgSessionStore({
    pool,
    tableName: SESSION_TABLE,
    createTableIfMissing: false,
    pruneSessionInterval: pruneIntervalSeconds,
    // Log the failure category only; never session payloads or connection
    // details.
    errorLog: (message: unknown, error?: unknown) => {
      console.error(
        `Session store: ${String(message)}`,
        error instanceof Error ? error.name : '',
      )
    },
  })
}
