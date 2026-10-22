// The behavior every StorageService adapter must provide (TASK-07.04,
// KI-019). Run it against each adapter — today the local development
// adapter; the production private object store must pass it before the
// production startup guard may be lifted. Synthetic bytes only.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { buffer } from 'node:stream/consumers'
import { afterAll, describe, expect, it } from 'vitest'
import {
  newOrderFileKey,
  type StorageService,
} from '../storage/storage-service.js'

const INVALID_KEYS = [
  '../escape',
  'orders/../../etc/passwd',
  'orders/ABCDEF',
  '/orders/0123456789abcdef0123456789abcdef',
  'orders/0123456789abcdef0123456789abcdef/x',
  'Tugas Akhir.pdf',
  '',
]

export function describeStorageContract(
  name: string,
  createAdapter: () => StorageService,
): void {
  describe(`StorageService contract: ${name}`, () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'maba-test-storage-contract-'))
    const source = path.join(dir, 'source.bin')
    const bytes = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x00, 0xff, 0x0a])
    writeFileSync(source, bytes)
    const storage = createAdapter()
    afterAll(() => {
      rmSync(dir, { recursive: true, force: true })
    })

    it('stores and returns the exact bytes under a random key', async () => {
      const key = newOrderFileKey()
      expect(await storage.exists(key)).toBe(false)
      await storage.put(key, source)
      expect(await storage.exists(key)).toBe(true)
      expect(await buffer(await storage.download(key))).toStrictEqual(bytes)
      await storage.delete(key)
    })

    it('never overwrites an existing object', async () => {
      const key = newOrderFileKey()
      await storage.put(key, source)
      await expect(storage.put(key, source)).rejects.toThrow()
      await storage.delete(key)
    })

    it('deletes idempotently', async () => {
      const key = newOrderFileKey()
      await storage.put(key, source)
      await storage.delete(key)
      await storage.delete(key)
      expect(await storage.exists(key)).toBe(false)
    })

    it('fails to download a missing object instead of returning nothing', async () => {
      await expect(storage.download(newOrderFileKey())).rejects.toThrow()
    })

    it.each(INVALID_KEYS)(
      'rejects the invalid key %j everywhere',
      async (key) => {
        await expect(storage.put(key, source)).rejects.toThrow(
          'Invalid storage key',
        )
        await expect(
          Promise.resolve().then(() => storage.download(key)),
        ).rejects.toThrow('Invalid storage key')
        await expect(storage.delete(key)).rejects.toThrow('Invalid storage key')
        await expect(storage.exists(key)).rejects.toThrow('Invalid storage key')
      },
    )
  })
}
