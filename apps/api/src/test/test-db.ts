// Shared helpers for database tests (*.db.test.ts) against the LOCAL TEST
// database maba_printing_test (built from migrations by `npm run test:db`).
// Never uses DATABASE_URL / the development database.
//
// Isolation: every test inserts its own synthetic fixtures inside an
// interactive transaction that is always rolled back, so tests share no
// state, do not depend on order and leave the test database empty. The
// development seed is not used. Not part of the API build (src/test is
// excluded in tsconfig.build.json).
import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, expect } from 'vitest'
import {
  assertCurrentDatabase,
  loadTestDatabaseUrl,
} from '../../scripts/test-database.js'
import type { DbClient } from '../db/prisma.js'
import { PrismaClient } from '../generated/prisma/client.js'

// Fails closed (before any connection) unless TEST_DATABASE_URL is the local
// maba_printing_test database.
const testUrl = loadTestDatabaseUrl()

// Dedicated client with query events so tests can count SQL statements.
export const testDb = new PrismaClient({
  adapter: new PrismaPg({ connectionString: testUrl.toString() }),
  log: [{ emit: 'event', level: 'query' }],
})
let queryCount = 0
testDb.$on('query', () => {
  queryCount += 1
})

afterAll(async () => {
  await testDb.$disconnect()
})

export async function countQueries(
  run: () => Promise<unknown>,
): Promise<number> {
  queryCount = 0
  await run()
  return queryCount
}

// Test-owned fixture IDs (prefix 7e570000-).
export const fixtureId = {
  locAlpha: '7e570000-0000-4000-8000-000000000101',
  locBeta: '7e570000-0000-4000-8000-000000000102',
  locClosed: '7e570000-0000-4000-8000-000000000103',
  locGamma: '7e570000-0000-4000-8000-000000000104',
  catPrint: '7e570000-0000-4000-8000-000000000201',
  catHidden: '7e570000-0000-4000-8000-000000000202',
  svcColor: '7e570000-0000-4000-8000-000000000301',
  svcBinding: '7e570000-0000-4000-8000-000000000302',
  svcRetired: '7e570000-0000-4000-8000-000000000303',
  svcInHidden: '7e570000-0000-4000-8000-000000000304',
  catWriting: '7e570000-0000-4000-8000-000000000401',
  catPaper: '7e570000-0000-4000-8000-000000000402',
  prodPen: '7e570000-0000-4000-8000-000000000501',
  prodPencil: '7e570000-0000-4000-8000-000000000502',
  prodEraser: '7e570000-0000-4000-8000-000000000503',
  prodReam: '7e570000-0000-4000-8000-000000000504',
} as const

export const alphaHours = {
  weekly: {
    mon: [
      { open: '07:30', close: '12:00' },
      { open: '13:00', close: '16:00' },
    ],
    tue: [],
    wed: [{ open: '08:00', close: '17:00' }],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  },
  note: 'Test schedule.',
}

const id = fixtureId

// Flat create/createMany calls only (no nested writes).
export async function insertFixtures(tx: DbClient): Promise<void> {
  await tx.businessSettings.create({
    data: {
      id: 1,
      businessName: 'Test Business',
      whatsappNumber: '+620000000001',
      logoRef: '/brand/test-logo.png',
      // A bare storage key: not browser-safe, so never published.
      qrisImageRef: 'private/test-qris.png',
      socialLinks: {
        instagram: 'https://example.test/maba',
        tiktok: 'javascript:alert(1)',
      },
      publicInfo: 'Test public info.',
    },
  })
  // Inserted out of name order to prove deterministic ordering.
  await tx.location.createMany({
    data: [
      { id: id.locBeta, name: 'Test Location Beta', address: 'Test address B' },
      {
        id: id.locAlpha,
        name: 'Test Location Alpha',
        address: 'Test address A',
        openingHours: alphaHours,
      },
      {
        id: id.locClosed,
        name: 'Test Location Closed',
        address: 'Test address C',
        isActive: false,
      },
      {
        id: id.locGamma,
        name: 'Test Location Gamma',
        address: 'Test address G',
        // Not the documented shape: must degrade to null, not break reads.
        openingHours: 'Senin-Jumat 08.00-17.00',
      },
    ],
  })
  await tx.serviceCategory.createMany({
    data: [
      { id: id.catPrint, name: 'Test Printing', description: 'Cetak' },
      { id: id.catHidden, name: 'Test Hidden Category', isActive: false },
    ],
  })
  await tx.service.createMany({
    data: [
      {
        id: id.svcColor,
        categoryId: id.catPrint,
        name: 'Test Print Color',
        priceType: 'FIXED',
        price: 1500,
      },
      {
        id: id.svcBinding,
        categoryId: id.catPrint,
        name: 'Test Binding',
        priceType: 'REQUIRES_CONFIRMATION',
      },
      {
        id: id.svcRetired,
        categoryId: id.catPrint,
        name: 'Test Retired',
        priceType: 'FIXED',
        price: 1000,
        isActive: false,
      },
      {
        id: id.svcInHidden,
        categoryId: id.catHidden,
        name: 'Test In Hidden Category',
        priceType: 'FIXED',
        price: 100,
      },
    ],
  })
  await tx.locationService.createMany({
    data: [
      { locationId: id.locAlpha, serviceId: id.svcColor },
      { locationId: id.locAlpha, serviceId: id.svcBinding },
      { locationId: id.locAlpha, serviceId: id.svcRetired },
      { locationId: id.locBeta, serviceId: id.svcColor, isAvailable: false },
      { locationId: id.locBeta, serviceId: id.svcBinding },
      // Available, but the location is inactive: never public.
      { locationId: id.locClosed, serviceId: id.svcColor },
    ],
  })
  await tx.productCategory.createMany({
    data: [
      { id: id.catWriting, name: 'Test Writing' },
      { id: id.catPaper, name: 'Test Paper' },
    ],
  })
  await tx.product.createMany({
    data: [
      {
        id: id.prodPen,
        categoryId: id.catWriting,
        name: 'Test Pen',
        price: 3000,
      },
      {
        id: id.prodPencil,
        categoryId: id.catWriting,
        name: 'Test Pencil',
        price: 2500,
        imageRef: 'test/pencil.png',
      },
      {
        id: id.prodEraser,
        categoryId: id.catWriting,
        name: 'Test Eraser',
        price: 1500,
        isActive: false,
      },
      {
        id: id.prodReam,
        categoryId: id.catPaper,
        name: 'Test Paper Ream',
        price: 55000,
        availability: 'UNAVAILABLE',
      },
    ],
  })
}

class Rollback extends Error {}

// Runs `test` in a transaction that is always rolled back.
export async function inRollback(
  test: (tx: DbClient) => Promise<void>,
  { fixtures = true }: { fixtures?: boolean } = {},
): Promise<void> {
  const run = testDb.$transaction(
    async (tx) => {
      const [row] = await tx.$queryRaw<
        { name: string }[]
      >`SELECT current_database() AS name`
      assertCurrentDatabase(row?.name)
      if (fixtures) {
        await insertFixtures(tx)
      }
      await test(tx)
      throw new Rollback()
    },
    { timeout: 15_000 },
  )
  await expect(run).rejects.toBeInstanceOf(Rollback)
}
