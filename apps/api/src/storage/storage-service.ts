// Private file storage abstraction (Architecture §34). Customer documents
// never have a public URL: bytes live behind this interface, PostgreSQL keeps
// only metadata and the random storage key. Development uses the local
// adapter; production object storage is chosen at deployment (KI-001).
import { randomBytes } from 'node:crypto'
import type { Readable } from 'node:stream'

export interface StorageService {
  // Stores the file at `sourcePath` under `key`. Fails if the key exists.
  put(key: string, sourcePath: string): Promise<void>
  // For the later authorized Admin download; no HTTP route uses it yet.
  download(key: string): Promise<Readable>
  // Idempotent: deleting a missing key is not an error.
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
}

// "orders/<32 hex>": 128 random bits, no original filename, no public ID.
export const STORAGE_KEY_PATTERN = /^orders\/[0-9a-f]{32}$/

export function newOrderFileKey(): string {
  return `orders/${randomBytes(16).toString('hex')}`
}

export function assertStorageKey(key: string): void {
  if (!STORAGE_KEY_PATTERN.test(key)) {
    throw new Error('Invalid storage key')
  }
}
