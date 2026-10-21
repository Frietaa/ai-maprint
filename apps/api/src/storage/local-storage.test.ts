import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { text } from 'node:stream/consumers'
import { afterAll, describe, expect, it } from 'vitest'
import { createLocalStorage } from './local-storage.js'
import { newOrderFileKey, STORAGE_KEY_PATTERN } from './storage-service.js'

const dir = mkdtempSync(path.join(tmpdir(), 'maba-test-local-storage-'))
const root = path.join(dir, 'root')
const source = path.join(dir, 'source.pdf')
writeFileSync(source, '%PDF-1.4 sample')
afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('storage keys', () => {
  it('are random orders/<32 hex> keys', () => {
    const keys = new Set(Array.from({ length: 200 }, newOrderFileKey))
    expect(keys.size).toBe(200)
    for (const key of keys) expect(key).toMatch(STORAGE_KEY_PATTERN)
  })
})

describe('createLocalStorage', () => {
  const storage = createLocalStorage(root)

  it('stores, reads, checks and deletes inside the root', async () => {
    const key = newOrderFileKey()
    await storage.put(key, source)

    const target = path.join(root, ...key.split('/'))
    expect(readFileSync(target, 'utf8')).toBe('%PDF-1.4 sample')
    expect(await storage.exists(key)).toBe(true)
    expect(await text(await storage.download(key))).toBe('%PDF-1.4 sample')

    await storage.delete(key)
    expect(await storage.exists(key)).toBe(false)
    // Idempotent.
    await expect(storage.delete(key)).resolves.toBeUndefined()
  })

  it('never overwrites an existing object', async () => {
    const key = newOrderFileKey()
    await storage.put(key, source)
    await expect(storage.put(key, source)).rejects.toThrow()
  })

  it.each([
    '../escape',
    'orders/../../escape',
    'orders/..',
    'orders/ABCDEF',
    '/etc/passwd',
    'C:\\Windows\\win.ini',
    'orders/0123456789abcdef0123456789abcdef/extra',
    `orders/${'0'.repeat(31)}g`,
  ])('rejects the invalid key %j', async (key) => {
    await expect(storage.put(key, source)).rejects.toThrow(
      'Invalid storage key',
    )
    await expect(storage.delete(key)).rejects.toThrow('Invalid storage key')
    await expect(storage.exists(key)).rejects.toThrow('Invalid storage key')
  })
})
