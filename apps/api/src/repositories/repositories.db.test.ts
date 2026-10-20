// Repository integration tests against the LOCAL TEST database. Fixtures,
// per-test rollback and the database guard live in ../test/test-db.ts.
// Run with `npm run test:db`; excluded from `npm run test`.
import { describe, expect, it } from 'vitest'
import {
  alphaHours,
  countQueries,
  fixtureId as id,
  inRollback,
} from '../test/test-db.js'
import { findBusinessSettings } from './business-settings.repository.js'
import { findLocationById, listLocations } from './location.repository.js'
import { findProductById, listProducts } from './product-catalog.repository.js'
import {
  findServiceById,
  listServices,
  listServicesAtLocation,
} from './service-catalog.repository.js'

describe('business settings repository', () => {
  it('reads the singleton row', () =>
    inRollback(async (tx) => {
      expect(await findBusinessSettings(tx)).toMatchObject({
        businessName: 'Test Business',
        whatsappNumber: '+620000000001',
        logoRef: '/brand/test-logo.png',
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
        'Test Location Gamma',
      ])
      const all = await listLocations(tx, { activeOnly: false })
      expect(all.map((l) => l.name)).toEqual([
        'Test Location Alpha',
        'Test Location Beta',
        'Test Location Closed',
        'Test Location Gamma',
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

  it('filters by location and lists only active available locations', () =>
    inRollback(async (tx) => {
      const atBeta = await listServices(tx, {
        activeOnly: true,
        locationId: id.locBeta,
      })
      expect(atBeta.map((s) => s.name)).toEqual(['Test Binding'])

      // Linked and available, but the location is inactive.
      const atClosed = await listServices(tx, {
        activeOnly: true,
        locationId: id.locClosed,
      })
      expect(atClosed).toEqual([])

      const color = await findServiceById(tx, id.svcColor)
      expect(color?.locations).toEqual([{ locationId: id.locAlpha }])
      expect(color?.category.description).toBe('Cetak')
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
      // One statement per relation level (service, category, available
      // locations; plus the link table for location reads), never per row.
      expect(Math.max(allRows, atAlpha)).toBeLessThanOrEqual(4)
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

  it('filters by availability', () =>
    inRollback(async (tx) => {
      const unavailable = await listProducts(tx, {
        activeOnly: true,
        availability: 'UNAVAILABLE',
      })
      expect(unavailable.map((p) => p.name)).toEqual(['Test Paper Ream'])
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
