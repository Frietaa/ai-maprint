// The single place a StorageService adapter is chosen from configuration
// (TASK-07.04, KI-019) — used by the API (server.ts) and the operator
// commands. Adding the production private object store means: implement
// StorageService (passing storage-contract.ts), add its provider name to
// parseStorageProvider (env.ts) and a branch here. Until then only the local
// development adapter exists and NODE_ENV=production refuses to start.
import { fileURLToPath } from 'node:url'
import type { StorageProvider } from '../config/env.js'
import { createLocalStorage } from './local-storage.js'
import type { StorageService } from './storage-service.js'

// apps/api/.local-storage/ (git-ignored, never served), resolved from src/
// or dist/.
export const DEFAULT_LOCAL_STORAGE_ROOT = fileURLToPath(
  new URL('../../.local-storage/', import.meta.url),
)

export interface StorageConfig {
  provider: StorageProvider
  // Local adapter root; defaults to DEFAULT_LOCAL_STORAGE_ROOT.
  localRoot?: string
}

export function createStorageFromConfig({
  provider,
  localRoot = DEFAULT_LOCAL_STORAGE_ROOT,
}: StorageConfig): StorageService {
  switch (provider) {
    case 'local':
      return createLocalStorage(localRoot)
  }
}
