import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { describeStorageContract } from '../test/storage-contract.js'
import { createLocalStorage } from './local-storage.js'
import {
  createStorageFromConfig,
  DEFAULT_LOCAL_STORAGE_ROOT,
} from './storage-factory.js'

const root = mkdtempSync(path.join(tmpdir(), 'maba-test-local-contract-'))
afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

describeStorageContract('local adapter', () => createLocalStorage(root))

describe('createStorageFromConfig', () => {
  it('builds the local adapter on the git-ignored development root by default', () => {
    const resolved = path.resolve(DEFAULT_LOCAL_STORAGE_ROOT)
    expect(path.basename(resolved)).toBe('.local-storage')
    expect(path.basename(path.dirname(resolved))).toBe('api')
    expect(
      createStorageFromConfig({ provider: 'local', localRoot: root }),
    ).toBeDefined()
  })
})
