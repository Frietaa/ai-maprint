// Operator command: delete order documents whose retention period ended
// (COMPLETED orders, completedAt + 30 days) from the local development
// storage (apps/api/.local-storage) and mark them deleted in DATABASE_URL.
//
//   npm run files:cleanup
//
// Safe to re-run (idempotent). Prints counts only — never file names, keys
// or contents. Scheduling is a deployment concern (KI-018); production
// object storage does not exist yet (KI-019), so this refuses to run with
// NODE_ENV=production like the API itself.
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PrismaPg } from '@prisma/adapter-pg'
import { cleanupExpiredOrderFiles } from '../src/admin/file-retention.js'
import { parseStorageProvider, readRequired } from '../src/config/env.js'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { createLocalStorage } from '../src/storage/local-storage.js'

if (existsSync('.env')) process.loadEnvFile('.env')

parseStorageProvider(
  process.env.STORAGE_PROVIDER?.trim() || undefined,
  process.env.NODE_ENV === 'production',
)

const storageRoot = fileURLToPath(
  new URL('../.local-storage/', import.meta.url),
)
const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: readRequired(process.env, 'DATABASE_URL'),
  }),
})

try {
  const summary = await cleanupExpiredOrderFiles({
    db,
    storage: createLocalStorage(storageRoot),
    now: () => new Date(),
    onFailure: (fileId) => {
      console.error(
        `Could not delete order file ${fileId}; will retry next run.`,
      )
    },
  })
  console.log(
    `Retention cleanup: ${summary.eligible} eligible, ${summary.deleted} deleted, ${summary.failed} failed.`,
  )
  if (summary.failed > 0) process.exitCode = 1
} catch (error) {
  console.error(
    `Retention cleanup failed (${error instanceof Error ? error.name : 'error'})`,
  )
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
