// Operator command — the provider-neutral retention contract (KI-018):
// deletes order documents whose retention period ended (COMPLETED orders,
// completedAt + 30 days) from the configured document storage and marks
// them deleted in DATABASE_URL.
//
//   npm run files:cleanup            (development, via tsx)
//   node dist/cli/files-cleanup.js   (built API, e.g. a daily scheduled job)
//
// Contract for any scheduler: run once a day (any time); safe to re-run
// (idempotent); overlapping runs are skipped through a PostgreSQL advisory
// lock. Output: one JSON line per event (LOG_LEVEL), with counts only —
// never file names, keys or contents. Exit code 0 = finished (or skipped
// because another run holds the lock), 1 = configuration error, run failure
// or at least one file that could not be deleted (retried next run).
// Refuses NODE_ENV=production until production object storage exists
// (KI-019), like the API itself.
import { existsSync } from 'node:fs'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import {
  cleanupExpiredOrderFiles,
  releaseRetentionLock,
  tryRetentionLock,
} from '../admin/file-retention.js'
import { parseStorageProvider, readRequired } from '../config/env.js'
import { PrismaClient } from '../generated/prisma/client.js'
import {
  createLogger,
  errorCategory,
  parseLogLevel,
} from '../observability/logger.js'
import { createStorageFromConfig } from '../storage/storage-factory.js'

if (existsSync('.env')) process.loadEnvFile('.env')

const log = createLogger({
  level: parseLogLevel(process.env.LOG_LEVEL?.trim() || undefined),
})

async function run(): Promise<number> {
  let provider
  let databaseUrl
  try {
    provider = parseStorageProvider(
      process.env.STORAGE_PROVIDER?.trim() || undefined,
      process.env.NODE_ENV === 'production',
    )
    databaseUrl = readRequired(process.env, 'DATABASE_URL')
  } catch (error) {
    // Configuration messages name variables, never their values.
    log.error('retention.config_error', {
      message: error instanceof Error ? error.message : 'invalid configuration',
    })
    return 1
  }

  const lock = new pg.Client({ connectionString: databaseUrl })
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  })
  try {
    await lock.connect()
    if (!(await tryRetentionLock(lock))) {
      log.info('retention.cleanup', { skipped: 'another run is active' })
      return 0
    }
    try {
      const summary = await cleanupExpiredOrderFiles({
        db,
        storage: createStorageFromConfig({ provider }),
        now: () => new Date(),
        onFailure: (fileId) => {
          log.warn('retention.file_failed', { fileId })
        },
      })
      log.info('retention.cleanup', { ...summary })
      return summary.failed > 0 ? 1 : 0
    } finally {
      await releaseRetentionLock(lock)
    }
  } catch (error) {
    log.error('retention.cleanup_failed', { category: errorCategory(error) })
    return 1
  } finally {
    await lock.end().catch(() => undefined)
    await db.$disconnect()
  }
}

process.exitCode = await run()
