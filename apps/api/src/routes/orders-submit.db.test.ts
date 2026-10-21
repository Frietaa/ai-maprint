// POST /api/v1/orders core submission (TASK-04.02) against
// maba_printing_test (JSON requests; files in orders-files.db.test.ts).
import {
  type ApiErrorResponse,
  type ApiItemResponse,
  type OrderReceiptDto,
  PUBLIC_ORDER_ID_PATTERN,
} from '@maba-printing/shared'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import {
  bodyOf,
  browser,
  createOrderTestApp,
  createTestApp,
  customer,
  fixture,
  inDays,
  insertUser,
  sessionRows,
  testDb,
} from '../test/order-db.js'

const path = '/api/v1/orders'
const secret = 'member password 1'

function printing(extra: Record<string, unknown> = {}) {
  return {
    type: 'PRINTING',
    ...customer,
    requestedCompletionAt: inDays(2),
    description: 'Cetak 10 halaman, hitam putih.',
    ...extra,
  }
}

function receiptOf(response: { body: unknown }): OrderReceiptDto {
  return bodyOf<ApiItemResponse<OrderReceiptDto>>(response).data
}

async function counts() {
  return {
    orders: await testDb.order.count(),
    items: await testDb.orderItem.count(),
    history: await testDb.orderStatusHistory.count(),
    files: await testDb.orderFile.count(),
    laptop: await testDb.laptopServiceRequest.count(),
    software: await testDb.softwareInstallationRequest.count(),
  }
}

const empty = {
  orders: 0,
  items: 0,
  history: 0,
  files: 0,
  laptop: 0,
  software: 0,
}

describe('POST /api/v1/orders — guests', () => {
  it('creates a SUBMITTED guest order and returns a safe receipt', async () => {
    const response = await browser(createOrderTestApp()).post(
      path,
      printing({ customerEmail: ' Rina@Example.TEST ' }),
    )

    expect(response.status).toBe(201)
    const receipt = receiptOf(response)
    expect(Object.keys(receipt).sort()).toStrictEqual([
      'createdAt',
      'estimatedTotal',
      'publicId',
      'requestedCompletionAt',
      'status',
      'type',
    ])
    expect(receipt).toMatchObject({
      type: 'PRINTING',
      status: 'SUBMITTED',
      estimatedTotal: null,
    })
    expect(receipt.publicId).toMatch(PUBLIC_ORDER_ID_PATTERN)
    expect(response.text).not.toMatch(
      /"id"|userId|adminNotes|storageKey|customer/,
    )

    const order = await testDb.order.findUniqueOrThrow({
      where: { publicId: receipt.publicId },
      include: { statusHistory: true },
    })
    expect(order).toMatchObject({
      userId: null,
      status: 'SUBMITTED',
      customerName: 'Rina Pelanggan',
      customerWhatsapp: '0812-3456-7890',
      customerEmail: 'rina@example.test',
      description: 'Cetak 10 halaman, hitam putih.',
      finalTotal: null,
      adminNotes: null,
    })
    expect(order.statusHistory).toHaveLength(1)
    expect(order.statusHistory[0]).toMatchObject({
      fromStatus: null,
      toStatus: 'SUBMITTED',
      changedByUserId: null,
    })
    // A guest gets no account; only the anonymous CSRF session exists.
    expect(await testDb.user.count()).toBe(0)
    const rows = await sessionRows()
    expect(rows.every((row) => row.sess.userId === undefined)).toBe(true)
  })

  it('stores the requested completion as an instant', async () => {
    const at = '2030-03-01T09:30:00+07:00'
    vi.useFakeTimers({
      toFake: ['Date'],
      now: new Date('2029-12-01T00:00:00Z'),
    })
    try {
      const response = await browser(createOrderTestApp()).post(
        path,
        printing({ requestedCompletionAt: at }),
      )
      expect(receiptOf(response).requestedCompletionAt).toBe(
        '2030-03-01T02:30:00.000Z',
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('accepts an active location and refuses an inactive or unknown one', async () => {
    const client = browser(createOrderTestApp())
    const ok = await client.post(
      path,
      printing({ locationId: fixture.locOpen }),
    )
    expect(ok.status).toBe(201)

    for (const locationId of [
      fixture.locClosed,
      'a7d00000-0000-4000-8000-000000000999',
    ]) {
      const refused = await client.post(path, printing({ locationId }))
      expect(refused.status).toBe(409)
      expect(refused.body).toStrictEqual({
        message: 'Location unavailable',
        errors: { locationId: ['This location is not available'] },
      })
    }
    expect(await testDb.order.count()).toBe(1)
  })

  it.each([
    ['in the past', inDays(-1)],
    ['more than a year ahead', inDays(400)],
  ])('rejects a requested completion %s', async (_label, at) => {
    const response = await browser(createOrderTestApp()).post(
      path,
      printing({ requestedCompletionAt: at }),
    )
    expect(response.status).toBe(400)
    expect(bodyOf<ApiErrorResponse>(response).errors).toHaveProperty(
      'requestedCompletionAt',
    )
  })

  it('requires a requested completion for printing', async () => {
    const response = await browser(createOrderTestApp()).post(
      path,
      printing({ requestedCompletionAt: null }),
    )
    expect(response.status).toBe(400)
  })

  it.each([
    ['userId', { userId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' }],
    ['status', { status: 'COMPLETED' }],
    ['publicId', { publicId: 'MP-2026-0000000000000' }],
    ['finalTotal', { finalTotal: 0 }],
    ['estimatedTotal', { estimatedTotal: 0 }],
    ['adminNotes', { adminNotes: 'x' }],
    ['role', { role: 'ADMIN' }],
  ])('rejects the server-owned field %s', async (field, extra) => {
    const response = await browser(createOrderTestApp()).post(
      path,
      printing(extra),
    )
    expect(response.status).toBe(400)
    expect(bodyOf<ApiErrorResponse>(response).errors?.[field]).toStrictEqual([
      'Unknown field',
    ])
    expect(await counts()).toStrictEqual(empty)
  })

  it('accepts a 5000-character description and bounds the JSON body', async () => {
    const client = browser(createOrderTestApp())
    const long = await client.post(
      path,
      printing({ description: 'x'.repeat(5000) }),
    )
    expect(long.status).toBe(201)

    const tooLong = await client.post(
      path,
      printing({ description: 'x'.repeat(5001) }),
    )
    expect(tooLong.status).toBe(400)

    const huge = await client.post(
      path,
      printing({ description: 'x'.repeat(70_000) }),
    )
    expect(huge.status).toBe(413)
  })

  it('requires the CSRF token, also for guests', async () => {
    const response = await request(createOrderTestApp())
      .post(path)
      .send(printing())
    expect(response.status).toBe(403)
    expect(await testDb.order.count()).toBe(0)
  })

  it('has its own rate limit', async () => {
    const client = browser(
      createOrderTestApp({
        orders: {
          rateLimits: { windowMs: 60_000, submissions: 2, trackingLookups: 5 },
        },
      }),
    )
    expect((await client.post(path, printing())).status).toBe(201)
    expect((await client.post(path, printing())).status).toBe(201)
    const limited = await client.post(path, printing())
    expect(limited.status).toBe(429)
    expect(limited.body).toStrictEqual({ message: 'Too many requests' })
    expect(await testDb.order.count()).toBe(2)
  })

  it('answers 503 when order submission is not configured', async () => {
    const response = await browser(createTestApp()).post(path, printing())
    expect(response.status).toBe(503)
  })
})

describe('POST /api/v1/orders — members and admins', () => {
  it('links a MEMBER order and keeps the submitted snapshot', async () => {
    const member = await insertUser({
      email: 'member@auth.test.invalid',
      name: 'Nama Profil',
      password: secret,
      whatsapp: '0811-1111-1111',
    })
    const client = browser(createOrderTestApp())
    await client.signIn('member@auth.test.invalid', secret)

    const response = await client.post(
      path,
      printing({ customerName: 'Nama Di Pesanan' }),
    )
    expect(response.status).toBe(201)
    const { publicId } = receiptOf(response)

    // Later profile changes never rewrite the order.
    await testDb.user.update({
      where: { id: member.id },
      data: { name: 'Nama Baru', whatsapp: '0899-9999-9999' },
    })
    const order = await testDb.order.findUniqueOrThrow({
      where: { publicId },
      include: { statusHistory: true },
    })
    expect(order).toMatchObject({
      userId: member.id,
      customerName: 'Nama Di Pesanan',
      customerWhatsapp: '0812-3456-7890',
    })
    expect(order.statusHistory[0]?.changedByUserId).toBe(member.id)
  })

  it('does not link orders to an ADMIN session', async () => {
    await insertUser({
      email: 'admin@auth.test.invalid',
      password: secret,
      role: 'ADMIN',
    })
    const client = browser(createOrderTestApp())
    await client.signIn('admin@auth.test.invalid', secret)

    const response = await client.post(path, printing())
    expect(response.status).toBe(201)
    const order = await testDb.order.findUniqueOrThrow({
      where: { publicId: receiptOf(response).publicId },
      include: { statusHistory: true },
    })
    expect(order.userId).toBeNull()
    expect(order.statusHistory[0]?.changedByUserId).toBeNull()
  })
})

describe('Public Order ID allocation', () => {
  it('retries a colliding ID with a new one', async () => {
    const taken = 'MP-2026-AAAAAAAAAAAAA'
    const fresh = 'MP-2026-BBBBBBBBBBBBB'
    const first = browser(
      createOrderTestApp({ orders: { generatePublicId: () => taken } }),
    )
    expect(receiptOf(await first.post(path, printing())).publicId).toBe(taken)

    const ids = [taken, taken, fresh]
    const generate = vi.fn(() => ids.shift() ?? 'MP-2026-CCCCCCCCCCCCC')
    const second = browser(
      createOrderTestApp({ orders: { generatePublicId: generate } }),
    )
    const response = await second.post(path, printing())

    expect(response.status).toBe(201)
    expect(receiptOf(response).publicId).toBe(fresh)
    expect(generate).toHaveBeenCalledTimes(3)
    expect(await testDb.order.count()).toBe(2)
  })

  it('gives up after a bounded number of collisions', async () => {
    const taken = 'MP-2026-AAAAAAAAAAAAA'
    await browser(
      createOrderTestApp({ orders: { generatePublicId: () => taken } }),
    ).post(path, printing())

    vi.spyOn(console, 'error').mockImplementation(() => {})
    const generate = vi.fn(() => taken)
    const response = await browser(
      createOrderTestApp({ orders: { generatePublicId: generate } }),
    ).post(path, printing())

    expect(response.status).toBe(500)
    expect(response.body).toStrictEqual({ message: 'Internal server error' })
    expect(generate).toHaveBeenCalledTimes(5)
    expect(await testDb.order.count()).toBe(1)
    vi.restoreAllMocks()
  })
})

describe('transaction', () => {
  it('leaves no partial rows when the database write fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    // Longer than orders.public_id varchar(32): the insert itself fails.
    const response = await browser(
      createOrderTestApp({
        orders: { generatePublicId: () => `MP-2026-${'X'.repeat(40)}` },
      }),
    ).post(path, {
      type: 'LAPTOP_SERVICE',
      ...customer,
      requestedCompletionAt: inDays(3),
      complaint: 'Tidak menyala',
      handoverMethod: 'DROP_OFF',
    })

    expect(response.status).toBe(500)
    expect(await counts()).toStrictEqual(empty)
    vi.restoreAllMocks()
  })
})
