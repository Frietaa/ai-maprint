// Private file storage for the Playwright E2E API: fixed directories under
// the OS temp dir, never the development storage (apps/api/.local-storage).
// Removal is guarded: only these exact paths are ever deleted.
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const base = path.resolve(tmpdir())

export const E2E_STORAGE_ROOT = path.join(base, 'maba-printing-e2e-storage')
export const E2E_UPLOAD_TEMP_DIR = path.join(base, 'maba-printing-e2e-uploads')

const OWNED = new Set([E2E_STORAGE_ROOT, E2E_UPLOAD_TEMP_DIR])

export function removeE2eStorage(): void {
  for (const dir of OWNED) {
    const resolved = path.resolve(dir)
    if (!OWNED.has(resolved) || path.dirname(resolved) !== base) {
      throw new Error('Refusing to delete a non-E2E storage directory')
    }
    rmSync(resolved, { recursive: true, force: true })
  }
}

// Fresh, empty directories for a new E2E run.
export function prepareE2eStorage(): void {
  removeE2eStorage()
  mkdirSync(E2E_STORAGE_ROOT, { recursive: true })
  mkdirSync(E2E_UPLOAD_TEMP_DIR, { recursive: true })
}
