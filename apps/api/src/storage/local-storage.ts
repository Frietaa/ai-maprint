// Local private storage adapter for development and tests. Files live under
// one root directory (development: apps/api/.local-storage/, git-ignored,
// never served by Express or Vite). Keys are validated before any path is
// built, and the resolved path must stay inside the root, so no key can
// traverse out of it.
import { createReadStream } from 'node:fs'
import { access, copyFile, constants, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import type { Readable } from 'node:stream'
import { assertStorageKey, type StorageService } from './storage-service.js'

export function createLocalStorage(root: string): StorageService {
  const base = path.resolve(root)

  function resolve(key: string): string {
    assertStorageKey(key)
    const target = path.resolve(base, ...key.split('/'))
    if (!target.startsWith(base + path.sep)) {
      throw new Error('Invalid storage key')
    }
    return target
  }

  return {
    async put(key, sourcePath) {
      const target = resolve(key)
      await mkdir(path.dirname(target), { recursive: true })
      // COPYFILE_EXCL: never overwrite an existing object.
      await copyFile(sourcePath, target, constants.COPYFILE_EXCL)
    },

    download(key) {
      const target = resolve(key)
      return access(target).then((): Readable => createReadStream(target))
    },

    async delete(key) {
      await rm(resolve(key), { force: true })
    },

    async exists(key) {
      const target = resolve(key)
      try {
        await access(target)
        return true
      } catch {
        return false
      }
    },
  }
}
