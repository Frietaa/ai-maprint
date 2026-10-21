// Guest tracking and member order history (TASK-04.07) against
// maba_printing_test.
import { CSRF_HEADER } from '@maba-printing/shared'
import type {
  ApiItemResponse,
  ApiPageResponse,
  MemberOrderDetailDto,
  MemberOrderSummaryDto,
  OrderReceiptDto,
  TrackedOrderDto,
} from '@maba-printing/shared'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import {
  bodyOf,
  browser,
  createOrderTestApp,
  csrfTokenOf,
  customer,
  fixture,
  inDays,
  insertUser,
  sessionRows,
  testDb,
} from '../test/order-db.js'
import { samples } from '../test/sample-files.js'

const secret = 'member password 1'

function printing(extra: Record<string, unknown> = {}) {
  return {
    type: 'PRINTING',
    ...customer,
    customerEmail: 'rina@example.test',
    requestedCompletionAt: inDays(2),
    description: 'Rahasia: nilai ujian',
    locationId: fixture.locOpen,
    ...extra,
  }
}

async function placeOrder(
  client: ReturnType<typeof browser>,
  body: Record<string, unknown> = printing(),
): Promise<string> {
  const response = await client.post('/api/v1/orders', body)
  expect(response.status).toBe(201)
  return bodyOf<ApiItemResponse<OrderReceiptDto>>(response).data.publicId
}

async function signedInMember(email: string) {
  const user = await insertUser({ email, name: 'Profil', password: secret })
  const client = browser(createOrderTestApp())
  await client.signIn(email, secret)
  return { client, user }
}

describe('GET /api/v1/orders/track/:publicId', () => {
  it('returns only the safe public minimum', async () => {
    const publicId = await placeOrder(browser(createOrderTestApp()))

    const response = await request(createOrderTestApp()).get(
      `/api/v1/orders/track/${publicId}`,
    )
    expect(response.status).toBe(200)
    const data = bodyOf<ApiItemResponse<TrackedOrderDto>>(response).data
    expect(Object.keys(data).sort()).toStrictEqual([
      'createdAt',
      'location',
      'publicId',
      'requestedCompletionAt',
      'status',
      'timeline',
      'type',
    ])
    expect(data).toMatchObject({
      publicId,
      type: 'PRINTING',
      status: 'SUBMITTED',
      location: { name: 'Order Test Open' },
    })
    expect(data.timeline).toStrictEqual([
      { status: 'SUBMITTED', at: expect.any(String) as unknown },
    ])
    expect(response.text).not.toMatch(
      /Rina|0812|rina@|Rahasia|Jl\. Uji|"id"|userId|changedBy|estimatedTotal|storage/,
    )
    expect(response.headers['cache-control']).toBe('no-store')
  })

  it('never exposes file names of a printing order', async () => {
    const agent = request.agent(createOrderTestApp())
    const token = csrfTokenOf(await agent.get('/api/v1/auth/csrf'))
    const created = await agent
      .post('/api/v1/orders')
      .set(CSRF_HEADER, token)
      .field('payload', JSON.stringify(printing()))
      .attach('files', samples.pdf, { filename: 'Skripsi Rina.pdf' })
    const { publicId } = bodyOf<ApiItemResponse<OrderReceiptDto>>(created).data

    const response = await request(createOrderTestApp()).get(
      `/api/v1/orders/track/${publicId}`,
    )
    expect(response.text).not.toMatch(/Skripsi|\.pdf|orders\//)
  })

  it('normalizes case and whitespace of the ID', async () => {
    const publicId = await placeOrder(browser(createOrderTestApp()))
    const response = await request(createOrderTestApp()).get(
      `/api/v1/orders/track/${encodeURIComponent(` ${publicId.toLowerCase()} `)}`,
    )
    expect(response.status).toBe(200)
  })

  it('answers 404 for an unknown valid ID and 400 for malformed ones', async () => {
    const app = createOrderTestApp()
    const unknown = await request(app).get(
      '/api/v1/orders/track/MP-2026-0000000000000',
    )
    expect(unknown.status).toBe(404)
    expect(unknown.body).toStrictEqual({ message: 'Order not found' })

    for (const id of ['MP-2026-%25', 'MP-2026', '*', 'x'.repeat(40)]) {
      const response = await request(app).get(`/api/v1/orders/track/${id}`)
      expect(response.status).toBe(400)
    }
  })

  it('creates no session and is rate-limited separately', async () => {
    const app = createOrderTestApp({
      orders: {
        rateLimits: { windowMs: 60_000, submissions: 100, trackingLookups: 2 },
      },
    })
    const id = '/api/v1/orders/track/MP-2026-0000000000000'
    const first = await request(app).get(id)
    expect(first.headers['set-cookie']).toBeUndefined()
    await request(app).get(id)
    const limited = await request(app).get(id)
    expect(limited.status).toBe(429)
    expect(await sessionRows()).toHaveLength(0)
  })
})

describe('GET /api/v1/account/orders', () => {
  it('lists only the member’s own orders, newest first, paginated', async () => {
    const { client } = await signedInMember('ana@auth.test.invalid')
    const other = await signedInMember('budi@auth.test.invalid')
    const guest = browser(createOrderTestApp())

    const mine: string[] = []
    for (let i = 0; i < 3; i += 1) {
      mine.push(await placeOrder(client))
    }
    await placeOrder(other.client)
    await placeOrder(guest)

    const page1 = await client.agent.get('/api/v1/account/orders?pageSize=2')
    expect(page1.status).toBe(200)
    const body1 = bodyOf<ApiPageResponse<MemberOrderSummaryDto>>(page1)
    expect(body1.meta).toStrictEqual({
      page: 1,
      pageSize: 2,
      total: 3,
      totalPages: 2,
    })
    expect(body1.data.map((order) => order.publicId)).toStrictEqual([
      mine[2],
      mine[1],
    ])
    expect(Object.keys(body1.data[0] ?? {}).sort()).toStrictEqual([
      'createdAt',
      'estimatedTotal',
      'finalTotal',
      'publicId',
      'requestedCompletionAt',
      'status',
      'type',
    ])

    const page2 = await client.agent.get(
      '/api/v1/account/orders?page=2&pageSize=2',
    )
    expect(
      bodyOf<ApiPageResponse<MemberOrderSummaryDto>>(page2).data.map(
        (order) => order.publicId,
      ),
    ).toStrictEqual([mine[0]])
  })

  it('validates the query and never accepts a userId', async () => {
    const { client, user } = await signedInMember('ana@auth.test.invalid')
    for (const query of ['pageSize=51', 'page=0', `userId=${user.id}`]) {
      const response = await client.agent.get(`/api/v1/account/orders?${query}`)
      expect(response.status).toBe(400)
    }
  })

  it('requires a MEMBER session', async () => {
    const anonymous = await request(createOrderTestApp()).get(
      '/api/v1/account/orders',
    )
    expect(anonymous.status).toBe(401)

    await insertUser({
      email: 'admin@auth.test.invalid',
      password: secret,
      role: 'ADMIN',
    })
    const admin = browser(createOrderTestApp())
    await admin.signIn('admin@auth.test.invalid', secret)
    expect((await admin.agent.get('/api/v1/account/orders')).status).toBe(403)
  })
})

describe('GET /api/v1/account/orders/:publicId', () => {
  it('returns the member’s own order as submitted, without private internals', async () => {
    const { client, user } = await signedInMember('ana@auth.test.invalid')
    const publicId = await placeOrder(client, {
      type: 'ATK',
      ...customer,
      customerName: 'Nama Di Pesanan',
      items: [{ productId: fixture.prodPen, quantity: 2 }],
    })

    // Later changes to the profile and the catalog do not alter history.
    await testDb.user.update({
      where: { id: user.id },
      data: { name: 'Nama Baru' },
    })
    await testDb.product.update({
      where: { id: fixture.prodPen },
      data: { name: 'Pulpen Baru', price: 1 },
    })

    const response = await client.agent.get(
      `/api/v1/account/orders/${publicId}`,
    )
    expect(response.status).toBe(200)
    const data = bodyOf<ApiItemResponse<MemberOrderDetailDto>>(response).data
    expect(data).toMatchObject({
      publicId,
      type: 'ATK',
      status: 'SUBMITTED',
      estimatedTotal: 6000,
      finalTotal: null,
      customer: {
        name: 'Nama Di Pesanan',
        whatsapp: '0812-3456-7890',
        email: null,
      },
      items: [
        {
          name: 'Pulpen Uji',
          description: 'Tinta biru',
          quantity: 2,
          unitPrice: 3000,
          subtotal: 6000,
        },
      ],
      laptopService: null,
      softwareInstallation: null,
      files: [],
    })
    expect(data.timeline).toHaveLength(1)
    expect(response.text).not.toMatch(
      /"id"|userId|adminNotes|storageKey|changedBy|productId/,
    )
  })

  it('includes file display metadata but never storage keys', async () => {
    const { client } = await signedInMember('ana@auth.test.invalid')
    const token = await client.csrf()
    const created = await client.agent
      .post('/api/v1/orders')
      .set(CSRF_HEADER, token)
      .field('payload', JSON.stringify(printing()))
      .attach('files', samples.png, { filename: 'scan.png' })
    const { publicId } = bodyOf<ApiItemResponse<OrderReceiptDto>>(created).data

    const response = await client.agent.get(
      `/api/v1/account/orders/${publicId}`,
    )
    const data = bodyOf<ApiItemResponse<MemberOrderDetailDto>>(response).data
    expect(data.files).toStrictEqual([
      {
        name: 'scan.png',
        mimeType: 'image/png',
        sizeBytes: samples.png.length,
      },
    ])
    expect(data.location).toStrictEqual({
      name: 'Order Test Open',
      address: 'Jl. Uji 1',
    })
    expect(response.text).not.toMatch(/orders\/[0-9a-f]{32}/)
  })

  it('answers 404 for another member’s order and for guest orders', async () => {
    const ana = await signedInMember('ana@auth.test.invalid')
    const budi = await signedInMember('budi@auth.test.invalid')
    const anasOrder = await placeOrder(ana.client)
    const guestOrder = await placeOrder(browser(createOrderTestApp()))

    for (const publicId of [anasOrder, guestOrder]) {
      const response = await budi.client.agent.get(
        `/api/v1/account/orders/${publicId}`,
      )
      expect(response.status).toBe(404)
      expect(response.body).toStrictEqual({ message: 'Order not found' })
    }
    const malformed = await budi.client.agent.get('/api/v1/account/orders/abc')
    expect(malformed.status).toBe(400)
  })
})
