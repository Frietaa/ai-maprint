// Repository integration tests against the LOCAL TEST database
// (maba_printing_test, built from migrations by `npm run test:db`).
// Excluded from `npm run test`. Never uses DATABASE_URL / the dev database.
//
// Isolation: every test inserts its own synthetic fixtures inside an
// interactive transaction that is always rolled back, so tests share no
// state, do not depend on order and leave the test database empty. The
// development seed is not used.
import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, describe, expect, it } from 'vitest'
import {
  assertCurrentDatabase,
  loadTestDatabaseUrl,
} from '../../scripts/test-database.js'
import type { DbClient } from '../db/prisma.js'
import { PrismaClient } from '../generated/prisma/client.js'
import { findBusinessSettings } from './business-settings.repository.js'
import { findLocationById, listLocations } from './location.repository.js'
import { findProductById, listProducts } from './product-catalog.repository.js'
import {
  findServiceById,
  listServices,
  listServicesAtLocation,
} from './service-catalog.repository.js'

// Fails closed (before any connection) unless TEST_DATABASE_URL is the local
// maba_printing_test database.
const testUrl = loadTestDatabaseUrl()

// Dedicated client with query events so tests can count SQL statements.
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: testUrl.toString() }),
  log: [{ emit: 'event', level: 'query' }],
})
let queryCount = 0
db.$on('query', () => {
  queryCount += 1
})

afterAll(async () => {
  await db.$disconnect()
})

// Test-owned fixture IDs (prefix 7e570000-).
const id = {
  locAlpha: '7e570000-0000-4000-8000-000000000101',
  locBeta: '7e570000-0000-4000-8000-000000000102',
  locClosed: '7e570000-0000-4000-8000-000000000103',
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
}

const alphaHours = {
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

// Flat createMany calls only (no nested writes).
async function insertFixtures(tx: DbClient): Promise<void> {
  await tx.businessSettings.create({
    data: {
      id: 1,
      businessName: 'Test Business',
      whatsappNumber: '+620000000001',
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
    ],
  })
  await tx.serviceCategory.createMany({
    data: [
      { id: id.catPrint, name: 'Test Printing' },
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
async function inRollback(
  test: (tx: DbClient) => Promise<void>,
  { fixtures = true }: { fixtures?: boolean } = {},
): Promise<void> {
  const run = db.$transaction(async (tx) => {
    const [row] = await tx.$queryRaw<
      { name: string }[]
    >`SELECT current_database() AS name`
    assertCurrentDatabase(row?.name)
    if (fixtures) {
      await insertFixtures(tx)
    }
    await test(tx)
    throw new Rollback()
  })
  await expect(run).rejects.toBeInstanceOf(Rollback)
}

async function countQueries(run: () => Promise<unknown>): Promise<number> {
  queryCount = 0
  await run()
  return queryCount
}

describe('business settings repository', () => {
  it('reads the singleton row', () =>
    inRollback(async (tx) => {
      expect(await findBusinessSettings(tx)).toMatchObject({
        businessName: 'Test Business',
        whatsappNumber: '+620000000001',
        logoRef: null,
      })
    }))

  it('returns null when settings are not configured', () =>
    inRollback(
      async (tx) => {
        expect(await findBusinessSettings(tx)).toBeNull()
      },
      { fixtures: false },
    ))
})

describe('location repository', () => {
  it('filters by active state in deterministic order', () =>
    inRollback(async (tx) => {
      const active = await listLocations(tx, { activeOnly: true })
      expect(active.map((l) => l.name)).toEqual([
        'Test Location Alpha',
        'Test Location Beta',
      ])
      const all = await listLocations(tx, { activeOnly: false })
      expect(all.map((l) => l.name)).toEqual([
        'Test Location Alpha',
        'Test Location Beta',
        'Test Location Closed',
      ])
    }))

  it('returns openingHours exactly as stored', () =>
    inRollback(async (tx) => {
      expect((await findLocationById(tx, id.locAlpha))?.openingHours).toEqual(
        alphaHours,
      )
      expect((await findLocationById(tx, id.locBeta))?.openingHours).toBeNull()
      expect(
        await findLocationById(tx, '00000000-0000-4000-8000-000000000000'),
      ).toBeNull()
    }))
})

describe('service catalog repository', () => {
  it('includes the category and represents price types and nullable prices', () =>
    inRollback(async (tx) => {
      expect(await findServiceById(tx, id.svcBinding)).toMatchObject({
        priceType: 'REQUIRES_CONFIRMATION',
        price: null,
        category: { id: id.catPrint, name: 'Test Printing', isActive: true },
      })
      expect(await findServiceById(tx, id.svcColor)).toMatchObject({
        priceType: 'FIXED',
        price: 1500,
      })
    }))

  it('filters inactive services and inactive categories only when asked', () =>
    inRollback(async (tx) => {
      const active = await listServices(tx, { activeOnly: true })
      expect(active.map((s) => s.name)).toEqual([
        'Test Binding',
        'Test Print Color',
      ])
      const all = await listServices(tx, { activeOnly: false })
      expect(all.map((s) => s.name)).toEqual([
        'Test In Hidden Category',
        'Test Binding',
        'Test Print Color',
        'Test Retired',
      ])
    }))

  it('lists location availability', () =>
    inRollback(async (tx) => {
      const atAlpha = await listServicesAtLocation(tx, id.locAlpha, {
        activeOnly: true,
      })
      expect(atAlpha.map((s) => s.name)).toEqual([
        'Test Binding',
        'Test Print Color',
      ])

      const atBeta = await listServicesAtLocation(tx, id.locBeta, {
        activeOnly: false,
      })
      expect(atBeta.map((s) => [s.name, s.isAvailable])).toEqual([
        ['Test Binding', true],
        ['Test Print Color', false],
      ])
      const publicAtBeta = await listServicesAtLocation(tx, id.locBeta, {
        activeOnly: true,
      })
      expect(publicAtBeta.map((s) => s.name)).toEqual(['Test Binding'])
    }))

  it('uses a constant number of queries regardless of row count (no N+1)', () =>
    inRollback(async (tx) => {
      const allRows = await countQueries(() =>
        listServices(tx, { activeOnly: false }),
      )
      const oneCategory = await countQueries(() =>
        listServices(tx, { activeOnly: false, categoryId: id.catHidden }),
      )
      const atAlpha = await countQueries(() =>
        listServicesAtLocation(tx, id.locAlpha, { activeOnly: false }),
      )
      const atBeta = await countQueries(() =>
        listServicesAtLocation(tx, id.locBeta, { activeOnly: false }),
      )
      expect(allRows).toBe(oneCategory)
      expect(atAlpha).toBe(atBeta)
      expect(Math.max(allRows, atAlpha)).toBeLessThanOrEqual(3)
    }))
})

describe('product catalog repository', () => {
  it('includes the category, availability, active state and optional imageRef', () =>
    inRollback(async (tx) => {
      const all = await listProducts(tx, { activeOnly: false })
      expect(all.map((p) => [p.name, p.availability, p.isActive])).toEqual([
        ['Test Paper Ream', 'UNAVAILABLE', true],
        ['Test Eraser', 'AVAILABLE', false],
        ['Test Pen', 'AVAILABLE', true],
        ['Test Pencil', 'AVAILABLE', true],
      ])
      expect(await findProductById(tx, id.prodPencil)).toMatchObject({
        price: 2500,
        imageRef: 'test/pencil.png',
        category: { id: id.catWriting, name: 'Test Writing' },
      })
      expect((await findProductById(tx, id.prodPen))?.imageRef).toBeNull()
    }))

  it('returns only active products for public reads, including UNAVAILABLE ones', () =>
    inRollback(async (tx) => {
      const active = await listProducts(tx, { activeOnly: true })
      expect(active.map((p) => p.name)).toEqual([
        'Test Paper Ream',
        'Test Pen',
        'Test Pencil',
      ])
    }))

  it('uses a constant number of queries regardless of row count (no N+1)', () =>
    inRollback(async (tx) => {
      const allRows = await countQueries(() =>
        listProducts(tx, { activeOnly: false }),
      )
      const oneCategory = await countQueries(() =>
        listProducts(tx, { activeOnly: false, categoryId: id.catPaper }),
      )
      expect(allRows).toBe(oneCategory)
      expect(allRows).toBeLessThanOrEqual(2)
    }))
})
