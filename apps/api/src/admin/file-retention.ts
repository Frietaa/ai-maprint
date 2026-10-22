// Order-file retention (PRD §9, ADR-013, Architecture §37): a document
// becomes eligible for deletion 30 days after its order reached COMPLETED
// (order.completedAt). Never based on createdAt, never for other statuses.
//
// Idempotent: rows already marked deleted are skipped, deletedAt is set only
// after the storage object is gone (a confirmed-missing object counts as
// gone — the local adapter's delete ignores only "not found"), and any
// other failure leaves the row for the next run. Order metadata is kept.
// Scheduling the run is deployment-owned (KI-018).
import type { DbClient } from '../db/prisma.js'
import type { StorageService } from '../storage/storage-service.js'

export const RETENTION_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000
const BATCH_SIZE = 200

export interface RetentionSummary {
  eligible: number
  deleted: number
  failed: number
}

export interface RetentionDeps {
  db: DbClient
  storage: StorageService
  now: () => Date
  // Safe diagnostics only (file record IDs, never names or keys).
  onFailure?: (fileId: string) => void
}

export function retentionCutoff(now: Date): Date {
  return new Date(now.getTime() - RETENTION_DAYS * DAY_MS)
}

export async function cleanupExpiredOrderFiles({
  db,
  storage,
  now,
  onFailure,
}: RetentionDeps): Promise<RetentionSummary> {
  const runAt = now()
  const cutoff = retentionCutoff(runAt)
  const summary: RetentionSummary = { eligible: 0, deleted: 0, failed: 0 }
  let afterId: string | undefined

  for (;;) {
    const files = await db.orderFile.findMany({
      where: {
        deletedAt: null,
        order: { status: 'COMPLETED', completedAt: { lte: cutoff } },
        ...(afterId && { id: { gt: afterId } }),
      },
      select: { id: true, storageKey: true },
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
    })
    if (files.length === 0) break
    afterId = files.at(-1)?.id

    for (const file of files) {
      summary.eligible += 1
      try {
        await storage.delete(file.storageKey)
        await db.orderFile.updateMany({
          where: { id: file.id, deletedAt: null },
          data: { deletedAt: runAt },
        })
        summary.deleted += 1
      } catch {
        summary.failed += 1
        onFailure?.(file.id)
      }
    }
  }
  return summary
}

// Guard against overlapping runs (two schedulers, or a manual run during a
// scheduled one): a PostgreSQL session advisory lock, held on a dedicated
// connection for the whole run. Works across hosts and instances.
export const RETENTION_LOCK_NAME = 'maba-printing:file-retention'

export interface LockConnection {
  query(
    sql: string,
    values: unknown[],
  ): Promise<{ rows: Record<string, unknown>[] }>
}

export async function tryRetentionLock(
  connection: LockConnection,
): Promise<boolean> {
  const result = await connection.query(
    'SELECT pg_try_advisory_lock(hashtext($1)) AS locked',
    [RETENTION_LOCK_NAME],
  )
  return result.rows[0]?.locked === true
}

export async function releaseRetentionLock(
  connection: LockConnection,
): Promise<void> {
  await connection.query('SELECT pg_advisory_unlock(hashtext($1))', [
    RETENTION_LOCK_NAME,
  ])
}
