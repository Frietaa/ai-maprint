// Runs `work` in a database transaction. With the shared PrismaClient a new
// interactive transaction is opened; when `db` already is a transaction
// client (callers that compose a larger transaction), it simply joins it.
import type { DbClient } from './prisma.js'
import type { PrismaClient } from '../generated/prisma/client.js'

export function inTransaction<T>(
  db: DbClient,
  work: (tx: DbClient) => Promise<T>,
): Promise<T> {
  if ('$transaction' in db) {
    return (db as unknown as PrismaClient).$transaction(work, {
      // Short, bounded transactions (Architecture §33).
      maxWait: 5_000,
      timeout: 10_000,
    })
  }
  return work(db)
}
