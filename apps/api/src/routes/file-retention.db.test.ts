// Order-file retention cleanup (TASK-05.06) against maba_printing_test and
// the isolated test storage, with an injected clock.
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import pg from 'pg'
import { loadTestDatabaseUrl } from '../../scripts/test-database.js'
import {
  cleanupExpiredOrderFiles,
  releaseRetentionLock,
  tryRetentionLock,
} from '../admin/file-retention.js'
import type { OrderStatus } from '../generated/prisma/client.js'
import type { StorageService } from '../storage/storage-service.js'
import { newOrderFileKey } from '../storage/storage-service.js'
import { generatePublicOrderId } from '../utils/public-order-id.js'
import { storageDir, testDb, testStorage } from '../test/order-db.js'

const NOW = new Date('2026-06-30T12:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000

async function fileFor(status: OrderStatus, completedDaysAgo: number | null) {
  const order = await testDb.order.create({
    data: {
      publicId: generatePublicOrderId(NOW),
      type: 'PRINTING',
      status,
      customerName: 'Uji',
      customerWhatsapp: '0812-0000-0000',
      completedAt:
        completedDaysAgo === null
          ? null
          : new Date(NOW.getTime() - completedDaysAgo * DAY),
      createdAt: new Date(NOW.getTime() - 400 * DAY),
    },
  })
  const source = path.join(storageDir, 'retention-source.pdf')
  writeFileSync(source, '%PDF-1.4 retention')
  const storageKey = newOrderFileKey()
  await testStorage.put(storageKey, source)
  return testDb.orderFile.create({
    data: {
      orderId: order.id,
      storageKey,
      originalName: 'dokumen.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 18,
    },
  })
}

function run(storage: StorageService = testStorage, failures: string[] = []) {
  return cleanupExpiredOrderFiles({
    db: testDb,
    storage,
    now: () => NOW,
    onFailure: (id) => failures.push(id),
  })
}

describe('cleanupExpiredOrderFiles', () => {
  it('deletes files exactly from 30 days after completion', async () => {
    const day29 = await fileFor('COMPLETED', 29.99)
    const day30 = await fileFor('COMPLETED', 30)
    const day31 = await fileFor('COMPLETED', 31)

    expect(await run()).toStrictEqual({ eligible: 2, deleted: 2, failed: 0 })

    for (const [file, deleted] of [
      [day29, false],
      [day30, true],
      [day31, true],
    ] as const) {
      const row = await testDb.orderFile.findUniqueOrThrow({
        where: { id: file.id },
      })
      expect(row.deletedAt !== null).toBe(deleted)
      expect(await testStorage.exists(file.storageKey)).toBe(!deleted)
    }
    // Order and file metadata remain.
    expect(await testDb.orderFile.count()).toBe(3)
    expect(await testDb.order.count()).toBe(3)
  })

  it('never touches orders that are not COMPLETED, whatever their age', async () => {
    const files = []
    for (const status of [
      'SUBMITTED',
      'CONFIRMED',
      'IN_PROGRESS',
      'READY',
      'CANCELLED',
    ] as const) {
      files.push(await fileFor(status, 100))
    }
    files.push(await fileFor('COMPLETED', null))

    expect(await run()).toStrictEqual({ eligible: 0, deleted: 0, failed: 0 })
    for (const file of files) {
      expect(await testStorage.exists(file.storageKey)).toBe(true)
    }
  })

  it('is idempotent and skips already deleted files', async () => {
    await fileFor('COMPLETED', 40)
    expect(await run()).toMatchObject({ deleted: 1 })
    expect(await run()).toStrictEqual({ eligible: 0, deleted: 0, failed: 0 })
  })

  it('treats a confirmed-missing object as deleted', async () => {
    const file = await fileFor('COMPLETED', 40)
    await testStorage.delete(file.storageKey)

    expect(await run()).toMatchObject({ deleted: 1, failed: 0 })
    const row = await testDb.orderFile.findUniqueOrThrow({
      where: { id: file.id },
    })
    expect(row.deletedAt).toEqual(NOW)
  })

  it('keeps deletedAt null when deletion fails and retries next run', async () => {
    const file = await fileFor('COMPLETED', 40)
    const failing: StorageService = {
      ...testStorage,
      delete: () => Promise.reject(new Error('EACCES')),
    }
    const failures: string[] = []

    expect(await run(failing, failures)).toStrictEqual({
      eligible: 1,
      deleted: 0,
      failed: 1,
    })
    expect(failures).toStrictEqual([file.id])
    const row = await testDb.orderFile.findUniqueOrThrow({
      where: { id: file.id },
    })
    expect(row.deletedAt).toBeNull()
    expect(await testStorage.exists(file.storageKey)).toBe(true)

    expect(await run()).toMatchObject({ deleted: 1 })
    expect(await testStorage.exists(file.storageKey)).toBe(false)
  })

  it('continues past a failure with the remaining files', async () => {
    const first = await fileFor('COMPLETED', 40)
    const second = await fileFor('COMPLETED', 40)
    const failing: StorageService = {
      ...testStorage,
      delete: (key) =>
        key === first.storageKey
          ? Promise.reject(new Error('EBUSY'))
          : testStorage.delete(key),
    }
    expect(await run(failing)).toStrictEqual({
      eligible: 2,
      deleted: 1,
      failed: 1,
    })
    const row = await testDb.orderFile.findUniqueOrThrow({
      where: { id: second.id },
    })
    expect(row.deletedAt).not.toBeNull()
  })
})

describe('retention run lock', () => {
  it('lets only one run hold the lock at a time, across connections', async () => {
    const connect = async () => {
      const client = new pg.Client({
        connectionString: loadTestDatabaseUrl().toString(),
      })
      await client.connect()
      return client
    }
    const first = await connect()
    const second = await connect()
    try {
      expect(await tryRetentionLock(first)).toBe(true)
      expect(await tryRetentionLock(second)).toBe(false)
      await releaseRetentionLock(first)
      expect(await tryRetentionLock(second)).toBe(true)
      await releaseRetentionLock(second)
    } finally {
      await first.end()
      await second.end()
    }
  })
})
