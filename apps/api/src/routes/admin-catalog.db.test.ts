// Admin catalog, location and business-settings management (TASK-05.07,
// TASK-05.08) against maba_printing_test.
import type {
  AdminLocationDto,
  AdminProductDto,
  AdminServiceDto,
  AdminSettingsDto,
  ApiItemResponse,
  ApiListResponse,
} from '@maba-printing/shared'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import {
  bodyOf,
  browser,
  createOrderTestApp,
  fixture,
  insertUser,
  testDb,
  testEmail,
} from '../test/order-db.js'

const secret = 'admin password 1'
const base = '/api/v1/admin'

async function admin(local = 'admin') {
  const user = await insertUser({
    email: testEmail(local),
    password: secret,
    role: 'ADMIN',
  })
  const client = browser(createOrderTestApp())
  await client.signIn(testEmail(local), secret)
  return { client, user }
}

function dataOf<T>(response: { body: unknown }): T {
  return bodyOf<ApiItemResponse<T>>(response).data
}

async function auditActions(): Promise<string[]> {
  const rows = await testDb.adminAuditLog.findMany({
    orderBy: { createdAt: 'asc' },
  })
  return rows.map((row) => row.action)
}

const hours = {
  weekly: {
    mon: [
      { open: '13:00', close: '16:00' },
      { open: '07:30', close: '12:00' },
    ],
    tue: [{ open: '08:00', close: '17:00' }],
    wed: [],
    thu: [],
    fri: [{ open: '08:00', close: '11:30' }],
    sat: [],
    sun: [],
  },
  note: 'Tutup hari libur.',
}

// Catalog rows created through the API by these tests are not covered by
// the a7d00000- fixture cleanup; remove them explicitly (test DB only).
async function removeCreatedCatalog(): Promise<void> {
  await testDb.locationService.deleteMany({
    where: {
      OR: [
        { location: { name: { startsWith: 'Admin Uji' } } },
        { service: { name: { startsWith: 'Admin Uji' } } },
      ],
    },
  })
  await testDb.product.deleteMany({
    where: { name: { startsWith: 'Admin Uji' } },
  })
  await testDb.service.deleteMany({
    where: { name: { startsWith: 'Admin Uji' } },
  })
  await testDb.productCategory.deleteMany({
    where: { name: { startsWith: 'Admin Uji' } },
  })
  await testDb.serviceCategory.deleteMany({
    where: { name: { startsWith: 'Admin Uji' } },
  })
  await testDb.location.deleteMany({
    where: { name: { startsWith: 'Admin Uji' } },
  })
  await testDb.businessSettings.deleteMany({ where: { id: 1 } })
}

describe('products and product categories', () => {
  it('creates, updates, deactivates and reactivates with audit rows', async () => {
    const { client, user } = await admin()
    try {
      const category = await client.post(`${base}/product-categories`, {
        name: 'Admin Uji Kategori',
      })
      expect(category.status).toBe(201)
      const categoryId = dataOf<{ id: string }>(category).id

      const created = await client.post(`${base}/products`, {
        categoryId,
        name: 'Admin Uji Buku',
        price: 12000,
        availability: 'AVAILABLE',
        imageRef: 'https://cdn.example.test/buku.png',
      })
      expect(created.status).toBe(201)
      const product = dataOf<AdminProductDto>(created)
      expect(product).toMatchObject({
        name: 'Admin Uji Buku',
        price: 12000,
        availability: 'AVAILABLE',
        isActive: true,
        category: { id: categoryId, isActive: true },
      })

      // Availability and isActive are separate: UNAVAILABLE stays public.
      await client.patch(`${base}/products/${product.id}`, {
        availability: 'UNAVAILABLE',
      })
      let publicList =
        await request(createOrderTestApp()).get('/api/v1/products')
      expect(publicList.text).toContain('Admin Uji Buku')

      await client.patch(`${base}/products/${product.id}`, { isActive: false })
      publicList = await request(createOrderTestApp()).get('/api/v1/products')
      expect(publicList.text).not.toContain('Admin Uji Buku')

      const reactivated = await client.patch(`${base}/products/${product.id}`, {
        isActive: true,
        price: 15000,
      })
      expect(dataOf<AdminProductDto>(reactivated)).toMatchObject({
        isActive: true,
        price: 15000,
      })

      expect(await auditActions()).toStrictEqual([
        'PRODUCT_CATEGORY_CREATED',
        'PRODUCT_CREATED',
        'PRODUCT_UPDATED',
        'PRODUCT_DEACTIVATED',
        'PRODUCT_REACTIVATED',
      ])
      const last = await testDb.adminAuditLog.findFirstOrThrow({
        where: { action: 'PRODUCT_REACTIVATED' },
      })
      expect(last).toMatchObject({
        actorId: user.id,
        entityType: 'PRODUCT',
        entityId: product.id,
        metadata: {
          isActive: { from: false, to: true },
          price: { from: 12000, to: 15000 },
        },
      })

      // Admin lists include inactive records.
      await client.patch(`${base}/product-categories/${categoryId}`, {
        isActive: false,
      })
      const adminList = await client.agent.get(`${base}/products`)
      const listed = bodyOf<ApiListResponse<AdminProductDto>>(adminList).data
      expect(listed.find((p) => p.id === product.id)?.category.isActive).toBe(
        false,
      )
    } finally {
      await removeCreatedCatalog()
    }
  })

  it.each([
    [{ price: -1 }],
    [{ price: 1.5 }],
    [{ availability: 'SOLD_OUT' }],
    [{ imageRef: 'javascript:alert(1)' }],
    [{ imageRef: 'http://insecure.example/x.png' }],
    [{ imageRef: '//evil.example/x.png' }],
    [{ imageRef: 'data:image/png;base64,AAAA' }],
    [{ imageRef: '/../../etc/passwd' }],
    [{ categoryId: 'a7d00000-0000-4000-8000-000000000999' }],
    [{ stock: 5 }],
    [{ name: '' }],
  ])('rejects product input %j', async (extra) => {
    const { client } = await admin()
    const response = await client.post(`${base}/products`, {
      categoryId: fixture.catWriting,
      name: 'Admin Uji Salah',
      price: 1000,
      availability: 'AVAILABLE',
      ...extra,
    })
    expect(response.status).toBe(400)
    expect(response.text).not.toMatch(/constraint|Prisma|SQL/i)
    expect(
      await testDb.product.count({ where: { name: 'Admin Uji Salah' } }),
    ).toBe(0)
  })

  it('answers 404 for unknown products and 400 for malformed IDs', async () => {
    const { client } = await admin()
    expect(
      (
        await client.patch(
          `${base}/products/a7d00000-0000-4000-8000-000000000999`,
          { price: 1 },
        )
      ).status,
    ).toBe(404)
    expect(
      (await client.patch(`${base}/products/abc`, { price: 1 })).status,
    ).toBe(400)
  })
})

describe('services', () => {
  it('requires a price for FIXED services on create and update', async () => {
    const { client } = await admin()
    try {
      const category = dataOf<{ id: string }>(
        await client.post(`${base}/service-categories`, {
          name: 'Admin Uji Layanan',
        }),
      )
      const noPrice = await client.post(`${base}/services`, {
        categoryId: category.id,
        name: 'Admin Uji Cetak',
        priceType: 'FIXED',
        price: null,
      })
      expect(noPrice.status).toBe(400)
      expect(noPrice.body).toMatchObject({
        errors: { price: ['A fixed price is required'] },
      })

      const created = dataOf<AdminServiceDto>(
        await client.post(`${base}/services`, {
          categoryId: category.id,
          name: 'Admin Uji Cetak',
          priceType: 'REQUIRES_CONFIRMATION',
          price: null,
        }),
      )
      const toFixed = await client.patch(`${base}/services/${created.id}`, {
        priceType: 'FIXED',
      })
      expect(toFixed.status).toBe(400)
      const fixed = await client.patch(`${base}/services/${created.id}`, {
        priceType: 'FIXED',
        price: 700,
      })
      expect(dataOf<AdminServiceDto>(fixed)).toMatchObject({
        priceType: 'FIXED',
        price: 700,
      })

      await client.patch(`${base}/services/${created.id}`, { isActive: false })
      expect(await auditActions()).toStrictEqual([
        'SERVICE_CATEGORY_CREATED',
        'SERVICE_CREATED',
        'SERVICE_UPDATED',
        'SERVICE_DEACTIVATED',
      ])
    } finally {
      await removeCreatedCatalog()
    }
  })
})

describe('locations', () => {
  it('manages locations, opening hours and per-location service availability', async () => {
    const { client } = await admin()
    try {
      const created = await client.post(`${base}/locations`, {
        name: 'Admin Uji Cabang',
        address: 'Jl. Admin 1',
        openingHours: hours,
      })
      expect(created.status).toBe(201)
      const location = dataOf<AdminLocationDto>(created)
      // Ranges are stored sorted in the existing JSON shape.
      expect(location.openingHours?.weekly.mon).toStrictEqual([
        { open: '07:30', close: '12:00' },
        { open: '13:00', close: '16:00' },
      ])
      expect(location.openingHours?.note).toBe('Tutup hari libur.')

      const service = await testDb.service.create({
        data: {
          categoryId: (
            await testDb.serviceCategory.create({
              data: { name: 'Admin Uji Kat' },
            })
          ).id,
          name: 'Admin Uji Jilid',
          priceType: 'FIXED',
          price: 5000,
        },
      })
      const token = await client.csrf()
      const on = await client.agent
        .put(`${base}/locations/${location.id}/services/${service.id}`)
        .set('X-CSRF-Token', token)
        .send({ isAvailable: true })
      expect(on.status).toBe(200)
      expect(
        dataOf<AdminLocationDto>(on).services.find(
          (s) => s.serviceId === service.id,
        ),
      ).toStrictEqual({ serviceId: service.id, isAvailable: true })

      let publicServices = await request(createOrderTestApp()).get(
        `/api/v1/services?locationId=${location.id}`,
      )
      expect(publicServices.text).toContain('Admin Uji Jilid')

      await client.agent
        .put(`${base}/locations/${location.id}/services/${service.id}`)
        .set('X-CSRF-Token', token)
        .send({ isAvailable: false })
      publicServices = await request(createOrderTestApp()).get(
        `/api/v1/services?locationId=${location.id}`,
      )
      expect(publicServices.text).not.toContain('Admin Uji Jilid')
      // The service itself stays active.
      expect(
        (await testDb.service.findUniqueOrThrow({ where: { id: service.id } }))
          .isActive,
      ).toBe(true)

      await client.patch(`${base}/locations/${location.id}`, {
        isActive: false,
      })
      const publicLocations =
        await request(createOrderTestApp()).get('/api/v1/locations')
      expect(publicLocations.text).not.toContain('Admin Uji Cabang')

      const closed = await client.patch(`${base}/locations/${location.id}`, {
        openingHours: null,
      })
      expect(dataOf<AdminLocationDto>(closed).openingHours).toBeNull()

      expect(await auditActions()).toStrictEqual([
        'LOCATION_CREATED',
        'LOCATION_SERVICE_AVAILABILITY_UPDATED',
        'LOCATION_SERVICE_AVAILABILITY_UPDATED',
        'LOCATION_DEACTIVATED',
        'LOCATION_UPDATED',
      ])
    } finally {
      await removeCreatedCatalog()
    }
  })

  const day = (ranges: unknown) => ({
    ...hours,
    weekly: { ...hours.weekly, tue: ranges },
  })

  it.each([
    ['open after close', day([{ open: '17:00', close: '08:00' }])],
    [
      'overlapping ranges',
      day([
        { open: '08:00', close: '12:00' },
        { open: '11:00', close: '13:00' },
      ]),
    ],
    ['bad time format', day([{ open: '8:00', close: '17:00' }])],
    [
      'too many ranges',
      day(
        Array.from({ length: 5 }, (_, i) => ({
          open: `0${i}:00`,
          close: `0${i}:30`,
        })),
      ),
    ],
    ['a missing weekday', { weekly: { mon: [] }, note: null }],
    [
      'an unknown weekday',
      { ...hours, weekly: { ...hours.weekly, holiday: [] } },
    ],
    ['raw text', 'Senin-Jumat 08.00-17.00'],
  ])('rejects opening hours with %s', async (_label, openingHours) => {
    const { client } = await admin()
    const response = await client.post(`${base}/locations`, {
      name: 'Admin Uji Salah',
      address: 'Jl. X',
      openingHours,
    })
    expect(response.status).toBe(400)
    expect(
      await testDb.location.count({ where: { name: 'Admin Uji Salah' } }),
    ).toBe(0)
  })
})

describe('business settings', () => {
  it('creates the singleton on first save, updates partially and is public at once', async () => {
    const { client } = await admin()
    try {
      const empty = await client.agent.get(`${base}/settings`)
      expect(dataOf<AdminSettingsDto>(empty)).toStrictEqual({
        businessName: null,
        whatsappNumber: null,
        logoRef: null,
        qrisImageRef: null,
        socialLinks: {},
        publicInfo: null,
        updatedAt: null,
      })

      const saved = await client.patch(`${base}/settings`, {
        businessName: 'MABA PRINTING Baru',
        whatsappNumber: '+62 812-3456-7890',
        logoRef: '/brand/logo.png',
        qrisImageRef: 'https://cdn.example.test/qris.png',
        socialLinks: { instagram: 'https://instagram.example/maba' },
        publicInfo: 'Info panjang yang bersifat publik.',
      })
      expect(saved.status).toBe(200)
      expect(await testDb.businessSettings.count()).toBe(1)

      const partial = await client.patch(`${base}/settings`, {
        publicInfo: null,
      })
      expect(dataOf<AdminSettingsDto>(partial)).toMatchObject({
        businessName: 'MABA PRINTING Baru',
        publicInfo: null,
      })

      const publicSettings = await request(createOrderTestApp()).get(
        '/api/v1/public/settings',
      )
      expect(publicSettings.body).toMatchObject({
        data: {
          businessName: 'MABA PRINTING Baru',
          whatsappNumber: '+62 812-3456-7890',
          logoRef: '/brand/logo.png',
          socialLinks: [
            { platform: 'instagram', url: 'https://instagram.example/maba' },
          ],
          publicInfo: null,
        },
      })
      // QRIS stays internal configuration.
      expect(publicSettings.text).not.toContain('qris')

      const audit = await testDb.adminAuditLog.findMany({
        orderBy: { createdAt: 'asc' },
      })
      expect(audit.map((row) => row.action)).toStrictEqual([
        'BUSINESS_SETTINGS_UPDATED',
        'BUSINESS_SETTINGS_UPDATED',
      ])
      expect(audit[0]?.metadata).toMatchObject({
        businessName: { from: null, to: 'MABA PRINTING Baru' },
      })
      expect(JSON.stringify(audit)).not.toContain('Info panjang')
    } finally {
      await removeCreatedCatalog()
    }
  })

  it.each([
    [{ logoRef: 'javascript:alert(1)' }],
    [{ qrisImageRef: 'data:image/png;base64,AAAA' }],
    [{ qrisImageRef: 'C:\\qris.png' }],
    [{ socialLinks: { instagram: 'ftp://x.example' } }],
    [{ socialLinks: { instagram: 'javascript:alert(1)' } }],
    [{ socialLinks: { 'Bad Key': 'https://x.example' } }],
    [
      {
        socialLinks: Object.fromEntries(
          Array.from({ length: 11 }, (_, i) => [`p${i}`, 'https://x.example']),
        ),
      },
    ],
    [{ whatsappNumber: 'call me' }],
    [{ businessName: 'x'.repeat(121) }],
    [{ publicInfo: 'x'.repeat(2001) }],
    [{ id: 2 }],
    [{}],
  ])('rejects settings %j', async (body) => {
    const { client } = await admin()
    const response = await client.patch(`${base}/settings`, body)
    expect(response.status).toBe(400)
    expect(await testDb.businessSettings.count()).toBe(0)
  })
})

describe('authorization', () => {
  it('refuses catalog and settings mutations to MEMBERs, guests and requests without CSRF', async () => {
    await insertUser({ email: testEmail('member'), password: secret })
    const member = browser(createOrderTestApp())
    await member.signIn(testEmail('member'), secret)
    const body = {
      categoryId: fixture.catWriting,
      name: 'X',
      price: 1,
      availability: 'AVAILABLE',
    }

    expect((await member.post(`${base}/products`, body)).status).toBe(403)
    expect(
      (await member.patch(`${base}/settings`, { businessName: 'X' })).status,
    ).toBe(403)
    expect(
      (await request(createOrderTestApp()).get(`${base}/settings`)).status,
    ).toBe(401)

    const { client } = await admin()
    const noCsrf = await client.agent.post(`${base}/products`).send(body)
    expect(noCsrf.status).toBe(403)
    expect(await testDb.adminAuditLog.count()).toBe(0)
  })

  it('offers no DELETE for catalog records', async () => {
    const { client } = await admin()
    const token = await client.csrf()
    const response = await client.agent
      .delete(`${base}/products/${fixture.prodPen}`)
      .set('X-CSRF-Token', token)
    expect(response.status).toBe(404)
    expect(await testDb.product.count({ where: { id: fixture.prodPen } })).toBe(
      1,
    )
  })
})
