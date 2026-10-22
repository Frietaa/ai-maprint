// HTTP integration tests for the public read API: Supertest → Express →
// controller → service → repository → Prisma → maba_printing_test.
// Each test runs inside a rolled-back transaction (../test/test-db.ts) and
// the app is given that transaction client as its database.
import type {
  ApiErrorResponse,
  ApiListResponse,
  LocationDto,
  ProductDto,
  ServiceDto,
} from '@maba-printing/shared'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app.js'
import { testAuthOptions } from '../test/app-options.js'
import type { DbClient } from '../db/prisma.js'
import { alphaHours, fixtureId as id, inRollback } from '../test/test-db.js'

function api(tx: DbClient) {
  return request(createApp({ getDb: () => tx, auth: testAuthOptions() }))
}

describe('GET /api/v1/public/settings', () => {
  it('returns the public settings DTO only', () =>
    inRollback(async (tx) => {
      const response = await api(tx).get('/api/v1/public/settings')

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toMatch(/application\/json/)
      expect(response.body).toStrictEqual({
        data: {
          businessName: 'Test Business',
          whatsappNumber: '+620000000001',
          logoRef: '/brand/test-logo.png',
          qrisImageRef: null,
          socialLinks: [
            { platform: 'instagram', url: 'https://example.test/maba' },
          ],
          publicInfo: 'Test public info.',
        },
      })
      expect(response.text).not.toMatch(/test-qris|javascript:/i)
    }))

  it('publishes a browser-safe static QRIS reference', () =>
    inRollback(async (tx) => {
      await tx.businessSettings.update({
        where: { id: 1 },
        data: { qrisImageRef: '/brand/qris-statis.png' },
      })
      const response = await api(tx).get('/api/v1/public/settings')
      const body = response.body as { data: { qrisImageRef: string | null } }
      expect(body.data.qrisImageRef).toBe('/brand/qris-statis.png')
    }))

  it('returns data: null when settings are not configured', () =>
    inRollback(
      async (tx) => {
        const response = await api(tx).get('/api/v1/public/settings')

        expect(response.status).toBe(200)
        expect(response.body).toStrictEqual({ data: null })
      },
      { fixtures: false },
    ))

  it('rejects query parameters', () =>
    inRollback(async (tx) => {
      const response = await api(tx).get('/api/v1/public/settings?debug=1')

      expect(response.status).toBe(400)
      expect(response.body).toStrictEqual({
        message: 'Validation failed',
        errors: { debug: ['Unknown query parameter'] },
      })
    }))
})

describe('GET /api/v1/locations', () => {
  it('lists active locations only, ordered, as safe DTOs', () =>
    inRollback(async (tx) => {
      const response = await api(tx).get('/api/v1/locations')

      const body = response.body as ApiListResponse<LocationDto>
      expect(response.status).toBe(200)
      expect(body.meta).toStrictEqual({ count: 3 })
      expect(body.data).toStrictEqual([
        {
          id: id.locAlpha,
          name: 'Test Location Alpha',
          address: 'Test address A',
          openingHours: alphaHours,
        },
        {
          id: id.locBeta,
          name: 'Test Location Beta',
          address: 'Test address B',
          openingHours: null,
        },
        {
          id: id.locGamma,
          name: 'Test Location Gamma',
          address: 'Test address G',
          // Stored opening hours are malformed: degraded, not an error.
          openingHours: null,
        },
      ])
      expect(response.text).not.toMatch(/isActive|createdAt|Closed/)
    }))

  it('returns an empty collection (not 404) when nothing is public', () =>
    inRollback(
      async (tx) => {
        const response = await api(tx).get('/api/v1/locations')
        expect(response.status).toBe(200)
        expect(response.body).toStrictEqual({ data: [], meta: { count: 0 } })
      },
      { fixtures: false },
    ))

  it('rejects any query parameter, including activeOnly', () =>
    inRollback(async (tx) => {
      const response = await api(tx).get('/api/v1/locations?activeOnly=false')
      expect(response.status).toBe(400)
      expect((response.body as ApiErrorResponse).errors).toStrictEqual({
        activeOnly: ['Unknown query parameter'],
      })
    }))
})

describe('GET /api/v1/services', () => {
  async function list(tx: DbClient, query = '') {
    const response = await api(tx).get(`/api/v1/services${query}`)
    return {
      response,
      body: response.body as ApiListResponse<ServiceDto>,
    }
  }

  it('lists active services in active categories as safe DTOs', () =>
    inRollback(async (tx) => {
      const { response, body } = await list(tx)

      expect(response.status).toBe(200)
      expect(body.meta).toStrictEqual({
        count: 2,
        page: 1,
        pageSize: 100,
        total: 2,
        totalPages: 1,
      })
      expect(body.data).toStrictEqual([
        {
          id: id.svcBinding,
          name: 'Test Binding',
          description: null,
          priceType: 'REQUIRES_CONFIRMATION',
          price: null,
          category: {
            id: id.catPrint,
            name: 'Test Printing',
            description: 'Cetak',
          },
          availableLocationIds: [id.locAlpha, id.locBeta],
        },
        {
          id: id.svcColor,
          name: 'Test Print Color',
          description: null,
          priceType: 'FIXED',
          price: 1500,
          category: {
            id: id.catPrint,
            name: 'Test Printing',
            description: 'Cetak',
          },
          // Beta has it unavailable; Closed is an inactive location.
          availableLocationIds: [id.locAlpha],
        },
      ])
      expect(response.text).not.toMatch(/Retired|Hidden|isActive/)
    }))

  it('filters by category', () =>
    inRollback(async (tx) => {
      const { body } = await list(tx, `?categoryId=${id.catHidden}`)
      // Inactive category: nothing public, even when asked directly.
      expect(body.data).toStrictEqual([])

      const printing = await list(tx, `?categoryId=${id.catPrint}`)
      expect(printing.body.meta.count).toBe(2)
    }))

  it('filters by location availability', () =>
    inRollback(async (tx) => {
      const beta = await list(tx, `?locationId=${id.locBeta}`)
      expect(beta.body.data.map((s) => s.name)).toStrictEqual(['Test Binding'])

      const closed = await list(tx, `?locationId=${id.locClosed}`)
      expect(closed.response.status).toBe(200)
      expect(closed.body).toStrictEqual({
        data: [],
        meta: { count: 0, page: 1, pageSize: 100, total: 0, totalPages: 0 },
      })
    }))

  it.each([
    ['?categoryId=not-a-uuid', { categoryId: ['Must be a valid UUID'] }],
    ['?locationId=1', { locationId: ['Must be a valid UUID'] }],
    ['?activeOnly=false', { activeOnly: ['Unknown query parameter'] }],
  ])('rejects %s with 400', (query, errors) =>
    inRollback(async (tx) => {
      const { response } = await list(tx, query)
      expect(response.status).toBe(400)
      expect(response.body).toStrictEqual({
        message: 'Validation failed',
        errors,
      })
    }),
  )
})

describe('GET /api/v1/products', () => {
  async function list(tx: DbClient, query = '') {
    const response = await api(tx).get(`/api/v1/products${query}`)
    return {
      response,
      body: response.body as ApiListResponse<ProductDto>,
    }
  }

  it('lists active products, keeping UNAVAILABLE ones visible', () =>
    inRollback(async (tx) => {
      const { response, body } = await list(tx)

      expect(response.status).toBe(200)
      expect(body.meta).toStrictEqual({
        count: 3,
        page: 1,
        pageSize: 100,
        total: 3,
        totalPages: 1,
      })
      expect(body.data.map((p) => [p.name, p.availability])).toStrictEqual([
        ['Test Paper Ream', 'UNAVAILABLE'],
        ['Test Pen', 'AVAILABLE'],
        ['Test Pencil', 'AVAILABLE'],
      ])
      expect(body.data[2]).toStrictEqual({
        id: id.prodPencil,
        name: 'Test Pencil',
        description: null,
        price: 2500,
        availability: 'AVAILABLE',
        imageRef: 'test/pencil.png',
        category: {
          id: id.catWriting,
          name: 'Test Writing',
          description: null,
        },
      })
      // Inactive product is never public.
      expect(response.text).not.toMatch(/Eraser|isActive/)
    }))

  it('serves bounded, non-overlapping pages', () =>
    inRollback(async (tx) => {
      const all = await list(tx)
      const first = await list(tx, '?pageSize=2')
      const second = await list(tx, '?pageSize=2&page=2')
      const beyond = await list(tx, '?pageSize=2&page=3')

      expect(first.body.meta).toStrictEqual({
        count: 2,
        page: 1,
        pageSize: 2,
        total: 3,
        totalPages: 2,
      })
      expect(second.body.meta).toMatchObject({ count: 1, page: 2, total: 3 })
      expect(
        [...first.body.data, ...second.body.data].map((p) => p.id),
      ).toStrictEqual(all.body.data.map((p) => p.id))
      expect(beyond.body.data).toStrictEqual([])

      const tooLarge = await list(tx, '?pageSize=101')
      expect(tooLarge.response.status).toBe(400)
    }))

  it('filters by category and availability', () =>
    inRollback(async (tx) => {
      const writing = await list(tx, `?categoryId=${id.catWriting}`)
      expect(writing.body.data.map((p) => p.name)).toStrictEqual([
        'Test Pen',
        'Test Pencil',
      ])

      const unavailable = await list(tx, '?availability=UNAVAILABLE')
      expect(unavailable.body.data.map((p) => p.name)).toStrictEqual([
        'Test Paper Ream',
      ])

      const both = await list(
        tx,
        `?categoryId=${id.catWriting}&availability=UNAVAILABLE`,
      )
      expect(both.body).toStrictEqual({
        data: [],
        meta: { count: 0, page: 1, pageSize: 100, total: 0, totalPages: 0 },
      })
    }))

  it.each([
    [
      '?availability=SOLD_OUT',
      { availability: ['Must be AVAILABLE or UNAVAILABLE'] },
    ],
    ['?categoryId=123', { categoryId: ['Must be a valid UUID'] }],
    ['?includeInactive=true', { includeInactive: ['Unknown query parameter'] }],
  ])('rejects %s with 400', (query, errors) =>
    inRollback(async (tx) => {
      const { response } = await list(tx, query)
      expect(response.status).toBe(400)
      expect(response.body).toStrictEqual({
        message: 'Validation failed',
        errors,
      })
    }),
  )
})
