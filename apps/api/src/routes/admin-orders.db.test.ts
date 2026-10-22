// Admin order management (TASK-05.02 – 05.06 download) against
// maba_printing_test with isolated test storage.
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  type AdminDashboardDto,
  type AdminOrderDetailDto,
  type AdminOrderSummaryDto,
  type ApiItemResponse,
  type ApiPageResponse,
  ORDER_STATUSES,
  type OrderStatus,
} from '@maba-printing/shared'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { generatePublicOrderId } from '../utils/public-order-id.js'
import {
  bodyOf,
  browser,
  countQueries,
  createOrderTestApp,
  fixture,
  insertUser,
  storageDir,
  testDb,
  testEmail,
  testStorage,
} from '../test/order-db.js'
import { samples } from '../test/sample-files.js'

const secret = 'admin password 1'
const base = '/api/v1/admin'

async function signedIn(local: string, role: 'ADMIN' | 'MEMBER' = 'ADMIN') {
  const user = await insertUser({
    email: testEmail(local),
    name: `Nama ${local}`,
    password: secret,
    role,
  })
  const client = browser(createOrderTestApp())
  await client.signIn(testEmail(local), secret)
  return { client, user }
}

interface OrderOptions {
  type?: 'PRINTING' | 'ATK' | 'LAPTOP_SERVICE' | 'SOFTWARE_INSTALLATION'
  status?: OrderStatus
  createdAt?: Date
  locationId?: string | null
  pickup?: boolean
  userId?: string | null
}

// Orders are inserted directly (the public submission flow is covered by the
// Phase-04 tests). Returns the public ID.
async function makeOrder({
  type = 'PRINTING',
  status = 'SUBMITTED',
  createdAt,
  locationId = null,
  pickup = false,
  userId = null,
}: OrderOptions = {}): Promise<string> {
  const publicId = generatePublicOrderId(new Date())
  await testDb.order.create({
    data: {
      publicId,
      type,
      status,
      userId,
      locationId,
      customerName: 'Pelanggan Uji',
      customerWhatsapp: '0812-0000-0000',
      customerEmail: 'pelanggan@example.test',
      description: 'Permintaan asli',
      ...(createdAt && { createdAt }),
      ...(type === 'LAPTOP_SERVICE' && {
        laptopServiceRequest: {
          create: {
            complaint: 'Mati',
            handoverMethod: pickup ? 'PICKUP' : 'DROP_OFF',
            pickupAddress: pickup ? 'Jl. Jemput 1' : null,
          },
        },
      }),
      statusHistory: { create: { fromStatus: null, toStatus: 'SUBMITTED' } },
    },
  })
  return publicId
}

function detailOf(response: { body: unknown }): AdminOrderDetailDto {
  return bodyOf<ApiItemResponse<AdminOrderDetailDto>>(response).data
}

describe('GET /admin/dashboard', () => {
  it('counts orders per status in the database and lists recent orders', async () => {
    const { client } = await signedIn('admin')
    const statuses: OrderStatus[] = [
      'SUBMITTED',
      'SUBMITTED',
      'CONFIRMED',
      'READY',
      'CANCELLED',
    ]
    const ids: string[] = []
    for (const [index, status] of statuses.entries()) {
      ids.push(
        await makeOrder({
          status,
          createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)),
        }),
      )
    }
    const order = await testDb.order.findUniqueOrThrow({
      where: { publicId: ids[0] },
    })
    await testDb.payment.create({
      data: {
        orderId: order.id,
        method: 'QRIS_STATIC',
        status: 'PENDING_CONFIRMATION',
      },
    })

    const response = await client.agent.get(`${base}/dashboard`)
    expect(response.status).toBe(200)
    const data = bodyOf<ApiItemResponse<AdminDashboardDto>>(response).data
    expect(data.statusCounts).toStrictEqual({
      SUBMITTED: 2,
      CONFIRMED: 1,
      IN_PROGRESS: 0,
      READY: 1,
      COMPLETED: 0,
      CANCELLED: 1,
    })
    expect(data.pendingPaymentConfirmations).toBe(1)
    expect(data.recentOrders.map((o) => o.publicId)).toStrictEqual(
      [...ids].reverse(),
    )
  })

  it('uses a bounded number of queries', async () => {
    const { client } = await signedIn('admin')
    for (let i = 0; i < 6; i += 1) await makeOrder()
    // Session lookup, principal lookup and the dashboard queries — not one
    // query per order.
    const count = await countQueries(() =>
      client.agent.get(`${base}/dashboard`),
    )
    expect(count).toBeLessThanOrEqual(8)
  })
})

describe('GET /admin/orders', () => {
  it('pages newest first and filters by status, type, location, payment and exact ID', async () => {
    const { client } = await signedIn('admin')
    const oldest = await makeOrder({
      createdAt: new Date('2026-01-01T00:00:00Z'),
    })
    const laptop = await makeOrder({
      type: 'LAPTOP_SERVICE',
      status: 'CONFIRMED',
      locationId: fixture.locOpen,
      createdAt: new Date('2026-01-02T00:00:00Z'),
    })
    const newest = await makeOrder({
      createdAt: new Date('2026-01-03T00:00:00Z'),
    })
    const laptopRow = await testDb.order.findUniqueOrThrow({
      where: { publicId: laptop },
    })
    await testDb.payment.create({
      data: { orderId: laptopRow.id, method: 'CASH', status: 'PAID' },
    })

    const ids = async (query: string) => {
      const response = await client.agent.get(`${base}/orders${query}`)
      expect(response.status).toBe(200)
      return bodyOf<ApiPageResponse<AdminOrderSummaryDto>>(response).data.map(
        (o) => o.publicId,
      )
    }

    expect(await ids('')).toStrictEqual([newest, laptop, oldest])
    const paged = await client.agent.get(`${base}/orders?page=2&pageSize=2`)
    expect(
      bodyOf<ApiPageResponse<AdminOrderSummaryDto>>(paged).meta,
    ).toStrictEqual({
      page: 2,
      pageSize: 2,
      total: 3,
      totalPages: 2,
    })
    expect(await ids('?status=CONFIRMED')).toStrictEqual([laptop])
    expect(await ids('?type=PRINTING')).toStrictEqual([newest, oldest])
    expect(await ids(`?locationId=${fixture.locOpen}`)).toStrictEqual([laptop])
    expect(await ids('?paymentStatus=PAID')).toStrictEqual([laptop])
    expect(await ids('?paymentStatus=UNPAID')).toStrictEqual([newest, oldest])
    expect(await ids(`?publicId=${newest.toLowerCase()}`)).toStrictEqual([
      newest,
    ])

    const list = await client.agent.get(`${base}/orders`)
    const row = bodyOf<ApiPageResponse<AdminOrderSummaryDto>>(list).data[1]
    expect(row).toMatchObject({
      publicId: laptop,
      customerName: 'Pelanggan Uji',
      location: { id: fixture.locOpen, name: 'Order Test Open' },
      paymentStatus: 'PAID',
    })
    // Heavy data belongs to the detail view.
    expect(list.text).not.toMatch(/Permintaan asli|0812|pelanggan@/)
  })

  it('validates filters', async () => {
    const { client } = await signedIn('admin')
    for (const query of [
      'status=DONE',
      'type=OTHER',
      'locationId=1',
      'paymentStatus=X',
      'publicId=MP-2026-%25',
      'pageSize=51',
      'all=true',
    ]) {
      expect((await client.agent.get(`${base}/orders?${query}`)).status).toBe(
        400,
      )
    }
  })

  it('is for ADMINs only', async () => {
    const { client } = await signedIn('member', 'MEMBER')
    expect((await client.agent.get(`${base}/orders`)).status).toBe(403)
    expect(
      (await request(createOrderTestApp()).get(`${base}/orders`)).status,
    ).toBe(401)
  })
})

describe('GET /admin/orders/:publicId', () => {
  it('returns the operational detail without auth internals', async () => {
    const { client } = await signedIn('admin')
    const member = await insertUser({
      email: testEmail('pemesan'),
      name: 'Member Pemesan',
      password: 'member password',
      googleId: 'google-sub-x',
    })
    const publicId = await makeOrder({
      type: 'LAPTOP_SERVICE',
      pickup: true,
      userId: member.id,
    })
    const response = await client.agent.get(`${base}/orders/${publicId}`)
    expect(response.status).toBe(200)
    const data = detailOf(response)
    expect(data).toMatchObject({
      publicId,
      status: 'SUBMITTED',
      customer: {
        name: 'Pelanggan Uji',
        whatsapp: '0812-0000-0000',
        email: 'pelanggan@example.test',
      },
      member: { name: 'Member Pemesan', email: testEmail('pemesan') },
      description: 'Permintaan asli',
      laptopService: {
        handoverMethod: 'PICKUP',
        pickupAddress: 'Jl. Jemput 1',
      },
      adminNotes: null,
      payment: null,
      allowedTransitions: ['CONFIRMED', 'CANCELLED'],
    })
    expect(response.text).not.toMatch(
      /passwordHash|argon2|google-sub|googleId|storageKey|"id":"[0-9a-f-]{36}","publicId"/,
    )
  })

  it('answers 404 for unknown orders and 400 for malformed IDs', async () => {
    const { client } = await signedIn('admin')
    expect(
      (await client.agent.get(`${base}/orders/MP-2026-0000000000000`)).status,
    ).toBe(404)
    expect((await client.agent.get(`${base}/orders/abc`)).status).toBe(400)
  })
})

describe('PATCH /admin/orders/:publicId/status', () => {
  const allowed: [OrderStatus, OrderStatus][] = [
    ['SUBMITTED', 'CONFIRMED'],
    ['SUBMITTED', 'CANCELLED'],
    ['CONFIRMED', 'IN_PROGRESS'],
    ['CONFIRMED', 'CANCELLED'],
    ['IN_PROGRESS', 'READY'],
    ['IN_PROGRESS', 'CANCELLED'],
    ['READY', 'COMPLETED'],
  ]

  it.each(allowed)(
    'allows %s → %s with history and audit',
    async (from, to) => {
      const { client, user } = await signedIn('admin')
      const publicId = await makeOrder({ status: from })
      const response = await client.patch(`${base}/orders/${publicId}/status`, {
        fromStatus: from,
        toStatus: to,
      })
      expect(response.status).toBe(200)
      const data = detailOf(response)
      expect(data.status).toBe(to)
      expect(data.timeline.at(-1)).toMatchObject({
        fromStatus: from,
        status: to,
        changedBy: { name: 'Nama admin' },
      })
      const order = await testDb.order.findUniqueOrThrow({
        where: { publicId },
        include: { statusHistory: { orderBy: { createdAt: 'asc' } } },
      })
      expect(order.statusHistory.at(-1)).toMatchObject({
        fromStatus: from,
        toStatus: to,
        changedByUserId: user.id,
      })
      expect(order.completedAt !== null).toBe(to === 'COMPLETED')
      const audit = await testDb.adminAuditLog.findMany()
      expect(audit).toHaveLength(1)
      expect(audit[0]).toMatchObject({
        actorId: user.id,
        action: 'ORDER_STATUS_UPDATED',
        entityType: 'ORDER',
        entityId: publicId,
        metadata: { from, to },
      })
      // The customer's original request is untouched.
      expect(order).toMatchObject({
        customerName: 'Pelanggan Uji',
        description: 'Permintaan asli',
      })
    },
  )

  const forbidden: [OrderStatus, OrderStatus][] = [
    ['SUBMITTED', 'IN_PROGRESS'],
    ['SUBMITTED', 'READY'],
    ['SUBMITTED', 'COMPLETED'],
    ['CONFIRMED', 'READY'],
    ['READY', 'CANCELLED'],
    ['READY', 'IN_PROGRESS'],
    ...ORDER_STATUSES.map((to): [OrderStatus, OrderStatus] => [
      'COMPLETED',
      to,
    ]),
    ...ORDER_STATUSES.map((to): [OrderStatus, OrderStatus] => [
      'CANCELLED',
      to,
    ]),
  ]

  it.each(forbidden)(
    'refuses %s → %s with 409 and changes nothing',
    async (from, to) => {
      const { client } = await signedIn('admin')
      const publicId = await makeOrder({ status: from })
      const response = await client.patch(`${base}/orders/${publicId}/status`, {
        fromStatus: from,
        toStatus: to,
      })
      expect(response.status).toBe(409)
      expect(response.body).toStrictEqual({
        message: 'Status change not allowed',
      })
      const order = await testDb.order.findUniqueOrThrow({
        where: { publicId },
      })
      expect(order.status).toBe(from)
      expect(await testDb.adminAuditLog.count()).toBe(0)
    },
  )

  it('refuses a stale fromStatus (another Admin was faster)', async () => {
    const first = await signedIn('admin')
    const second = await signedIn('admin2')
    const publicId = await makeOrder()

    const ok = await first.client.patch(`${base}/orders/${publicId}/status`, {
      fromStatus: 'SUBMITTED',
      toStatus: 'CONFIRMED',
    })
    expect(ok.status).toBe(200)
    const stale = await second.client.patch(
      `${base}/orders/${publicId}/status`,
      {
        fromStatus: 'SUBMITTED',
        toStatus: 'CANCELLED',
      },
    )
    expect(stale.status).toBe(409)
    expect(stale.body).toStrictEqual({ message: 'Order status has changed' })
    const order = await testDb.order.findUniqueOrThrow({ where: { publicId } })
    expect(order.status).toBe('CONFIRMED')
  })

  it('lets exactly one of two simultaneous changes win', async () => {
    const first = await signedIn('admin')
    const second = await signedIn('admin2')
    const publicId = await makeOrder()
    await first.client.csrf()
    await second.client.csrf()

    const results = await Promise.all([
      first.client.patch(`${base}/orders/${publicId}/status`, {
        fromStatus: 'SUBMITTED',
        toStatus: 'CONFIRMED',
      }),
      second.client.patch(`${base}/orders/${publicId}/status`, {
        fromStatus: 'SUBMITTED',
        toStatus: 'CANCELLED',
      }),
    ])
    expect(results.map((r) => r.status).sort()).toStrictEqual([200, 409])
    const history = await testDb.orderStatusHistory.count({
      where: { order: { publicId } },
    })
    expect(history).toBe(2)
    expect(await testDb.adminAuditLog.count()).toBe(1)
  })

  it('rolls everything back when the audit row cannot be written', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { client, user } = await signedIn('admin')
    const publicId = await makeOrder()
    // Make the audit insert fail (temporary CHECK in the TEST database only)
    // and prove the status change and history row are rolled back with it.
    await testDb.$executeRaw`ALTER TABLE admin_audit_logs ADD CONSTRAINT test_block_audit CHECK (action <> 'ORDER_STATUS_UPDATED') NOT VALID`
    try {
      const response = await client.patch(`${base}/orders/${publicId}/status`, {
        fromStatus: 'SUBMITTED',
        toStatus: 'CONFIRMED',
      })
      expect(response.status).toBe(500)
    } finally {
      await testDb.$executeRaw`ALTER TABLE admin_audit_logs DROP CONSTRAINT test_block_audit`
    }
    const order = await testDb.order.findUniqueOrThrow({
      where: { publicId },
      include: { statusHistory: true },
    })
    expect(order.status).toBe('SUBMITTED')
    expect(order.statusHistory).toHaveLength(1)
    expect(
      await testDb.adminAuditLog.count({ where: { actorId: user.id } }),
    ).toBe(0)
    vi.restoreAllMocks()
  })

  it('validates the body and requires CSRF', async () => {
    const { client } = await signedIn('admin')
    const publicId = await makeOrder()
    for (const body of [
      { toStatus: 'CONFIRMED' },
      { fromStatus: 'SUBMITTED', toStatus: 'DONE' },
      {
        fromStatus: 'SUBMITTED',
        toStatus: 'CONFIRMED',
        completedAt: '2026-01-01',
      },
    ]) {
      expect(
        (await client.patch(`${base}/orders/${publicId}/status`, body)).status,
      ).toBe(400)
    }
    const noCsrf = await client.agent
      .patch(`${base}/orders/${publicId}/status`)
      .send({ fromStatus: 'SUBMITTED', toStatus: 'CONFIRMED' })
    expect(noCsrf.status).toBe(403)
  })

  it('is refused to MEMBERs', async () => {
    const { client } = await signedIn('member', 'MEMBER')
    const publicId = await makeOrder()
    const response = await client.patch(`${base}/orders/${publicId}/status`, {
      fromStatus: 'SUBMITTED',
      toStatus: 'CONFIRMED',
    })
    expect(response.status).toBe(403)
  })
})

describe('PATCH /admin/orders/:publicId/pricing', () => {
  it('sets order-level totals without touching item snapshots or payment', async () => {
    const { client, user } = await signedIn('admin')
    const publicId = await makeOrder({ type: 'ATK' })
    const order = await testDb.order.findUniqueOrThrow({ where: { publicId } })
    await testDb.orderItem.create({
      data: {
        orderId: order.id,
        productId: fixture.prodPen,
        nameSnapshot: 'Pulpen Uji',
        quantity: 2,
        unitPriceSnapshot: 3000,
        subtotal: 6000,
      },
    })

    const response = await client.patch(`${base}/orders/${publicId}/pricing`, {
      estimatedTotal: 7000,
      finalTotal: 6500,
    })
    expect(response.status).toBe(200)
    expect(detailOf(response)).toMatchObject({
      estimatedTotal: 7000,
      finalTotal: 6500,
      payment: null,
      items: [{ unitPrice: 3000, subtotal: 6000 }],
    })
    const audit = await testDb.adminAuditLog.findFirstOrThrow()
    expect(audit).toMatchObject({
      actorId: user.id,
      action: 'ORDER_PRICING_UPDATED',
      metadata: {
        estimatedTotal: { from: null, to: 7000 },
        finalTotal: { from: null, to: 6500 },
      },
    })

    const cleared = await client.patch(`${base}/orders/${publicId}/pricing`, {
      finalTotal: null,
    })
    expect(detailOf(cleared)).toMatchObject({
      estimatedTotal: 7000,
      finalTotal: null,
    })
  })

  it('computes the pickup fee from the distance for laptop pickups', async () => {
    const { client } = await signedIn('admin')
    const publicId = await makeOrder({ type: 'LAPTOP_SERVICE', pickup: true })
    for (const [distanceKm, fee] of [
      [5, 0],
      [5.01, 2000],
      [6, 2000],
      [7.5, 6000],
      [0, 0],
    ] as const) {
      const response = await client.patch(
        `${base}/orders/${publicId}/pricing`,
        {
          distanceKm,
        },
      )
      expect(detailOf(response).laptopService).toMatchObject({
        distanceKm,
        pickupFee: fee,
      })
    }
    const reset = await client.patch(`${base}/orders/${publicId}/pricing`, {
      distanceKm: null,
    })
    expect(detailOf(reset).laptopService).toMatchObject({
      distanceKm: null,
      pickupFee: null,
    })
  })

  it('refuses a distance on orders without a pickup', async () => {
    const { client } = await signedIn('admin')
    for (const options of [
      { type: 'PRINTING' as const },
      { type: 'LAPTOP_SERVICE' as const, pickup: false },
    ]) {
      const publicId = await makeOrder(options)
      const response = await client.patch(
        `${base}/orders/${publicId}/pricing`,
        {
          distanceKm: 3,
        },
      )
      expect(response.status).toBe(400)
    }
  })

  it.each([
    [{ finalTotal: -1 }],
    [{ finalTotal: 1.5 }],
    [{ finalTotal: 2_147_483_648 }],
    [{ estimatedTotal: '1000' }],
    [{ distanceKm: -1 }],
    [{ distanceKm: 1.234 }],
    [{}],
    [{ finalTotal: 1, status: 'COMPLETED' }],
    [{ finalTotal: 1, customerName: 'x' }],
    [{ finalTotal: 1, pickupFee: 0 }],
  ])('rejects %j', async (body) => {
    const { client } = await signedIn('admin')
    const publicId = await makeOrder({ type: 'LAPTOP_SERVICE', pickup: true })
    const response = await client.patch(
      `${base}/orders/${publicId}/pricing`,
      body,
    )
    expect(response.status).toBe(400)
    expect(await testDb.adminAuditLog.count()).toBe(0)
  })
})

describe('PATCH /admin/orders/:publicId/notes', () => {
  it('stores internal notes, audits without the text, never exposes them outside Admin', async () => {
    const { client } = await signedIn('admin')
    const member = await signedIn('pemilik', 'MEMBER')
    const publicId = await makeOrder({ userId: member.user.id })

    const response = await client.patch(`${base}/orders/${publicId}/notes`, {
      adminNotes: '  Pelanggan minta dihubungi sore. <b>x</b> ',
    })
    expect(response.status).toBe(200)
    expect(detailOf(response).adminNotes).toBe(
      'Pelanggan minta dihubungi sore. <b>x</b>',
    )

    const audit = await testDb.adminAuditLog.findFirstOrThrow()
    expect(audit.metadata).toStrictEqual({ change: 'added' })
    expect(JSON.stringify(audit)).not.toContain('Pelanggan minta')

    const tracking = await request(createOrderTestApp()).get(
      `/api/v1/orders/track/${publicId}`,
    )
    const memberDetail = await member.client.agent.get(
      `/api/v1/account/orders/${publicId}`,
    )
    expect(memberDetail.status).toBe(200)
    for (const text of [tracking.text, memberDetail.text]) {
      expect(text).not.toMatch(/adminNotes|Pelanggan minta/)
    }

    const cleared = await client.patch(`${base}/orders/${publicId}/notes`, {
      adminNotes: '',
    })
    expect(detailOf(cleared).adminNotes).toBeNull()
    const last = await testDb.adminAuditLog.findFirstOrThrow({
      orderBy: { createdAt: 'desc' },
    })
    expect(last.metadata).toStrictEqual({ change: 'cleared' })
  })

  it('bounds the notes and accepts only that field', async () => {
    const { client } = await signedIn('admin')
    const publicId = await makeOrder()
    for (const body of [
      { adminNotes: 'x'.repeat(5001) },
      { adminNotes: 'a\u0000b' },
      { adminNotes: 'x', finalTotal: 1 },
      {},
    ]) {
      expect(
        (await client.patch(`${base}/orders/${publicId}/notes`, body)).status,
      ).toBe(400)
    }
  })
})

describe('PATCH /admin/orders/:publicId/payment', () => {
  it('creates one payment lazily and confirms PAID with the current Admin', async () => {
    const first = await signedIn('admin')
    const second = await signedIn('admin2')
    const publicId = await makeOrder()

    const pending = await first.client.patch(
      `${base}/orders/${publicId}/payment`,
      {
        method: 'QRIS_STATIC',
        status: 'PENDING_CONFIRMATION',
        amount: 15000,
      },
    )
    expect(detailOf(pending).payment).toStrictEqual({
      method: 'QRIS_STATIC',
      status: 'PENDING_CONFIRMATION',
      amount: 15000,
      confirmedAt: null,
      confirmedBy: null,
    })

    const paid = await second.client.patch(
      `${base}/orders/${publicId}/payment`,
      {
        method: 'QRIS_STATIC',
        status: 'PAID',
        amount: 15000,
      },
    )
    const confirmed = detailOf(paid).payment
    expect(confirmed).toMatchObject({
      status: 'PAID',
      confirmedBy: { name: 'Nama admin2' },
    })
    expect(confirmed?.confirmedAt).toEqual(expect.any(String))

    // Saving PAID again keeps the original confirmation.
    const resaved = await first.client.patch(
      `${base}/orders/${publicId}/payment`,
      {
        method: 'CASH',
        status: 'PAID',
        amount: 15000,
      },
    )
    expect(detailOf(resaved).payment).toMatchObject({
      method: 'CASH',
      confirmedBy: { name: 'Nama admin2' },
      confirmedAt: confirmed?.confirmedAt,
    })

    // Leaving PAID clears the confirmation.
    const reverted = await first.client.patch(
      `${base}/orders/${publicId}/payment`,
      {
        method: 'CASH',
        status: 'UNPAID',
        amount: null,
      },
    )
    expect(detailOf(reverted).payment).toMatchObject({
      status: 'UNPAID',
      amount: null,
      confirmedAt: null,
      confirmedBy: null,
    })

    expect(await testDb.payment.count()).toBe(1)
    const audit = await testDb.adminAuditLog.findMany({
      orderBy: { createdAt: 'asc' },
    })
    expect(audit.map((row) => row.action)).toStrictEqual([
      'PAYMENT_UPDATED',
      'PAYMENT_UPDATED',
      'PAYMENT_UPDATED',
      'PAYMENT_UPDATED',
    ])
    expect(
      audit.map(
        (row) => (row.metadata as { confirmation: string }).confirmation,
      ),
    ).toStrictEqual(['none', 'confirmed', 'kept', 'cleared'])
    expect(audit[1]?.actorId).toBe(second.user.id)
    // Setting a final price never implied payment, and vice versa.
    const order = await testDb.order.findUniqueOrThrow({ where: { publicId } })
    expect(order.finalTotal).toBeNull()
  })

  it.each([
    [{ method: 'CARD', status: 'PAID', amount: 1 }],
    [{ method: 'CASH', status: 'DONE', amount: 1 }],
    [{ method: 'CASH', status: 'PAID', amount: -1 }],
    [{ method: 'CASH', status: 'PAID' }],
    [
      {
        method: 'CASH',
        status: 'PAID',
        amount: 1,
        confirmedById: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      },
    ],
    [
      {
        method: 'CASH',
        status: 'PAID',
        amount: 1,
        confirmedAt: '2026-01-01T00:00:00Z',
      },
    ],
  ])('rejects %j', async (body) => {
    const { client } = await signedIn('admin')
    const publicId = await makeOrder()
    expect(
      (await client.patch(`${base}/orders/${publicId}/payment`, body)).status,
    ).toBe(400)
    expect(await testDb.payment.count()).toBe(0)
  })
})

describe('GET /admin/orders/:publicId/files/:fileId/download', () => {
  async function orderWithFile(name = 'Skripsi "Final"\r\nX-Evil: 1 é.pdf') {
    const publicId = await makeOrder()
    const order = await testDb.order.findUniqueOrThrow({ where: { publicId } })
    const source = path.join(storageDir, 'upload-source.pdf')
    writeFileSync(source, samples.pdf)
    const storageKey = `orders/${'a'.repeat(31)}${Math.floor(Math.random() * 10)}`
    await testStorage.put(storageKey, source)
    const file = await testDb.orderFile.create({
      data: {
        orderId: order.id,
        storageKey,
        originalName: name,
        mimeType: 'application/pdf',
        sizeBytes: samples.pdf.length,
      },
    })
    return { publicId, file }
  }

  it('streams the document as an attachment and audits the access', async () => {
    const { client, user } = await signedIn('admin')
    const { publicId, file } = await orderWithFile()

    const response = await client.agent
      .get(`${base}/orders/${publicId}/files/${file.id}/download`)
      .buffer(true)
      .parse((res, done) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => done(null, Buffer.concat(chunks)))
      })

    expect(response.status).toBe(200)
    expect(Buffer.from(response.body as Buffer).equals(samples.pdf)).toBe(true)
    expect(response.headers['content-type']).toBe('application/pdf')
    expect(response.headers['content-disposition']).toMatch(
      /^attachment; filename="/,
    )
    expect(response.headers['content-disposition']).not.toMatch(/[\r\n]/)
    expect(response.headers['x-evil']).toBeUndefined()
    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['cache-control']).toBe('private, no-store')
    expect(JSON.stringify(response.headers)).not.toMatch(
      /orders\/|maba-test-storage/,
    )

    const audit = await testDb.adminAuditLog.findFirstOrThrow()
    expect(audit).toMatchObject({
      actorId: user.id,
      action: 'ORDER_FILE_DOWNLOADED',
      entityType: 'ORDER_FILE',
      entityId: file.id,
      metadata: { order: publicId, sizeBytes: samples.pdf.length },
    })
    expect(JSON.stringify(audit)).not.toContain('Skripsi')
  })

  it('answers 404 for a file of another order, a deleted file or a missing object', async () => {
    const { client } = await signedIn('admin')
    const one = await orderWithFile()
    const other = await orderWithFile()

    const foreign = await client.agent.get(
      `${base}/orders/${one.publicId}/files/${other.file.id}/download`,
    )
    expect(foreign.status).toBe(404)

    await testDb.orderFile.update({
      where: { id: other.file.id },
      data: { deletedAt: new Date() },
    })
    const deleted = await client.agent.get(
      `${base}/orders/${other.publicId}/files/${other.file.id}/download`,
    )
    expect(deleted.status).toBe(404)

    await testStorage.delete(one.file.storageKey)
    const missing = await client.agent.get(
      `${base}/orders/${one.publicId}/files/${one.file.id}/download`,
    )
    expect(missing.status).toBe(404)
    expect(missing.text).not.toMatch(/orders\/|storage/)
    expect(await testDb.adminAuditLog.count()).toBe(0)

    const malformed = await client.agent.get(
      `${base}/orders/${one.publicId}/files/not-a-uuid/download`,
    )
    expect(malformed.status).toBe(400)
  })

  it('is refused to MEMBERs and guests', async () => {
    const { client } = await signedIn('member', 'MEMBER')
    const { publicId, file } = await orderWithFile()
    const url = `${base}/orders/${publicId}/files/${file.id}/download`
    expect((await client.agent.get(url)).status).toBe(403)
    expect((await request(createOrderTestApp()).get(url)).status).toBe(401)
  })
})
