// Helpers for order DB tests (*.db.test.ts) against the LOCAL TEST database
// maba_printing_test and an isolated temporary storage root.
//
// Like the auth tests, order tests commit real rows (the session store and
// file storage live outside Prisma transactions) and clean up
// deterministically: every test-database order (removeAllOrders, asserted),
// synthetic accounts and the catalog fixtures below (prefix a7d00000-).
// Files go to a fresh directory under the OS temp dir, removed after the
// file with a guard that refuses anything else.
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeEach } from 'vitest'
import { removeAllOrders } from '../../scripts/e2e-fixtures.js'
import type { AppOptions, OrderOptions } from '../app.js'
import { createLocalStorage } from '../storage/local-storage.js'
import { createTestApp, testDb } from './auth-db.js'

export * from './auth-db.js'

const TEST_DIR_PREFIX = 'maba-test-storage-'

// Fresh per test file: <tmp>/maba-test-storage-XXXXXX/{files,uploads}
export const storageDir = mkdtempSync(path.join(tmpdir(), TEST_DIR_PREFIX))
export const storageRoot = path.join(storageDir, 'files')
export const uploadTempDir = path.join(storageDir, 'uploads')
mkdirSync(storageRoot, { recursive: true })
mkdirSync(uploadTempDir, { recursive: true })

export const testStorage = createLocalStorage(storageRoot)

// Only ever deletes inside the directory created above.
function assertTestStorageDir(): string {
  const resolved = path.resolve(storageDir)
  if (
    path.dirname(resolved) !== path.resolve(tmpdir()) ||
    !path.basename(resolved).startsWith(TEST_DIR_PREFIX)
  ) {
    throw new Error('Refusing to delete a non-test storage directory')
  }
  return resolved
}

function clearStoredFiles(): void {
  rmSync(path.join(assertTestStorageDir(), 'files', 'orders'), {
    recursive: true,
    force: true,
  })
}

function removeTestStorage(): void {
  rmSync(assertTestStorageDir(), { recursive: true, force: true })
}

export const fixture = {
  locOpen: 'a7d00000-0000-4000-8000-000000000101',
  locClosed: 'a7d00000-0000-4000-8000-000000000102',
  catWriting: 'a7d00000-0000-4000-8000-000000000201',
  catHidden: 'a7d00000-0000-4000-8000-000000000202',
  prodPen: 'a7d00000-0000-4000-8000-000000000301',
  prodPaper: 'a7d00000-0000-4000-8000-000000000302',
  prodSoldOut: 'a7d00000-0000-4000-8000-000000000303',
  prodRetired: 'a7d00000-0000-4000-8000-000000000304',
  prodInHidden: 'a7d00000-0000-4000-8000-000000000305',
  prodExpensive: 'a7d00000-0000-4000-8000-000000000306',
} as const

const PREFIX = 'a7d00000-%'

async function removeCatalogFixtures(): Promise<void> {
  await removeAllOrders(testDb)
  await testDb.$executeRaw`DELETE FROM products WHERE id::text LIKE ${PREFIX}`
  await testDb.$executeRaw`DELETE FROM product_categories WHERE id::text LIKE ${PREFIX}`
  await testDb.$executeRaw`DELETE FROM locations WHERE id::text LIKE ${PREFIX}`
}

async function insertCatalogFixtures(): Promise<void> {
  const id = fixture
  await testDb.location.createMany({
    data: [
      { id: id.locOpen, name: 'Order Test Open', address: 'Jl. Uji 1' },
      {
        id: id.locClosed,
        name: 'Order Test Closed',
        address: 'Jl. Uji 2',
        isActive: false,
      },
    ],
  })
  await testDb.productCategory.createMany({
    data: [
      { id: id.catWriting, name: 'Order Test Writing' },
      { id: id.catHidden, name: 'Order Test Hidden', isActive: false },
    ],
  })
  await testDb.product.createMany({
    data: [
      {
        id: id.prodPen,
        categoryId: id.catWriting,
        name: 'Pulpen Uji',
        description: 'Tinta biru',
        price: 3000,
      },
      {
        id: id.prodPaper,
        categoryId: id.catWriting,
        name: 'Kertas Uji',
        price: 55000,
      },
      {
        id: id.prodSoldOut,
        categoryId: id.catWriting,
        name: 'Habis Uji',
        price: 1000,
        availability: 'UNAVAILABLE',
      },
      {
        id: id.prodRetired,
        categoryId: id.catWriting,
        name: 'Nonaktif Uji',
        price: 1000,
        isActive: false,
      },
      {
        id: id.prodInHidden,
        categoryId: id.catHidden,
        name: 'Tersembunyi Uji',
        price: 1000,
      },
      {
        id: id.prodExpensive,
        categoryId: id.catWriting,
        name: 'Mahal Uji',
        price: 2_000_000_000,
      },
    ],
  })
}

beforeEach(async () => {
  await removeCatalogFixtures()
  clearStoredFiles()
  await insertCatalogFixtures()
})

afterEach(async () => {
  await removeCatalogFixtures()
  clearStoredFiles()
})

afterAll(() => {
  removeTestStorage()
})

// Files currently stored in the test storage root.
export async function storedFiles(): Promise<string[]> {
  try {
    return await readdir(path.join(storageRoot, 'orders'))
  } catch {
    return []
  }
}

export async function pendingUploads(): Promise<string[]> {
  return readdir(uploadTempDir)
}

type OrderTestOptions = Omit<AppOptions, 'auth' | 'orders'> & {
  auth?: Partial<AppOptions['auth']>
  orders?: Partial<OrderOptions>
}

// The real app on the test database with test storage and generous limits.
export function createOrderTestApp({
  orders,
  ...options
}: OrderTestOptions = {}) {
  return createTestApp({
    ...options,
    orders: {
      storage: testStorage,
      uploadTempDir,
      rateLimits: {
        windowMs: 60_000,
        submissions: 1000,
        trackingLookups: 1000,
      },
      ...orders,
    },
  })
}

// An ISO instant `days` from now.
export function inDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

export const customer = {
  customerName: 'Rina Pelanggan',
  customerWhatsapp: '0812-3456-7890',
}
