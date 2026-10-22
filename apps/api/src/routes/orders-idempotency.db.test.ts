// Duplicate-submission protection (TASK-06.05, KI-020) against
// maba_printing_test with an isolated temporary storage root.
import {
  type ApiItemResponse,
  CSRF_HEADER,
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENT_REPLAY_HEADER,
  type OrderReceiptDto,
} from '@maba-printing/shared'
import { describe, expect, it } from 'vitest'
import {
  bodyOf,
  browser,
  createOrderTestApp,
  customer,
  fixture,
  inDays,
  insertUser,
  storedFiles,
  testDb,
} from '../test/order-db.js'
import { samples } from '../test/sample-files.js'

const KEY = 'a3f0c2d4-5b6e-4f70-8a91-b2c3d4e5f607'
const secret = 'member password 1'

function atk(extra: Record<string, unknown> = {}) {
  return {
    type: 'ATK',
    ...customer,
    items: [{ productId: fixture.prodPen, quantity: 2 }],
    ...extra,
  }
}

async function postKeyed(
  client: ReturnType<typeof browser>,
  body: object,
  key: string = KEY,
) {
  const csrf = await client.csrf()
  return client.agent
    .post('/api/v1/orders')
    .set(CSRF_HEADER, csrf)
    .set(IDEMPOTENCY_KEY_HEADER, key)
    .send(body)
}

// Built once: a retry repeats exactly the same request.
const printingPayload = JSON.stringify({
  type: 'PRINTING',
  ...customer,
  requestedCompletionAt: inDays(2),
})

function receiptOf(response: { body: unknown }): OrderReceiptDto {
  return bodyOf<ApiItemResponse<OrderReceiptDto>>(response).data
}

describe('POST /api/v1/orders with Idempotency-Key', () => {
  it('replays the original order for a retried submission', async () => {
    const client = browser(createOrderTestApp())
    const first = await postKeyed(client, atk())
    expect(first.status).toBe(201)
    expect(first.headers[IDEMPOTENT_REPLAY_HEADER.toLowerCase()]).toBe(
      undefined,
    )

    // The response was "lost"; the browser retries the same request.
    const retry = await postKeyed(client, atk())
    expect(retry.status).toBe(200)
    expect(retry.headers[IDEMPOTENT_REPLAY_HEADER.toLowerCase()]).toBe('true')
    expect(receiptOf(retry)).toStrictEqual(receiptOf(first))
    expect(await testDb.order.count()).toBe(1)

    // Only hashes are stored, never the raw key.
    const rows = await testDb.orderSubmissionKey.findMany()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.keyHash).toMatch(/^[0-9a-f]{64}$/)
    expect(JSON.stringify(rows)).not.toContain(KEY)
  })

  it('replays a retried guest submission from a new session (key as capability)', async () => {
    const first = await postKeyed(browser(createOrderTestApp()), atk())
    const retry = await postKeyed(browser(createOrderTestApp()), atk())
    expect(retry.status).toBe(200)
    expect(receiptOf(retry).publicId).toBe(receiptOf(first).publicId)
    expect(await testDb.order.count()).toBe(1)
  })

  it('stores files once when a multipart submission is retried', async () => {
    const client = browser(createOrderTestApp())
    const csrf = await client.csrf()
    const send = () =>
      client.agent
        .post('/api/v1/orders')
        .set(CSRF_HEADER, csrf)
        .set(IDEMPOTENCY_KEY_HEADER, KEY)
        .field('payload', printingPayload)
        .attach('files', samples.pdf, { filename: 'Tugas.pdf' })

    const first = await send()
    expect(first.status).toBe(201)
    const retry = await send()
    expect(retry.status).toBe(200)
    expect(receiptOf(retry).publicId).toBe(receiptOf(first).publicId)
    expect(await testDb.orderFile.count()).toBe(1)
    expect(await storedFiles()).toHaveLength(1)
  })

  it('refuses the same key for a different request (409) without order data', async () => {
    const client = browser(createOrderTestApp())
    await postKeyed(client, atk())
    const changed = await postKeyed(
      client,
      atk({ items: [{ productId: fixture.prodPen, quantity: 3 }] }),
    )
    expect(changed.status).toBe(409)
    expect(changed.body).toStrictEqual({
      message: 'Idempotency key already used',
      errors: {
        idempotencyKey: ['This key was already used for a different request'],
      },
    })
    expect(await testDb.order.count()).toBe(1)
  })

  it('binds a member’s key to that member', async () => {
    const ana = await insertUser({
      email: 'ana@auth.test.invalid',
      password: secret,
    })
    await insertUser({ email: 'budi@auth.test.invalid', password: secret })
    const anaClient = browser(createOrderTestApp())
    await anaClient.signIn('ana@auth.test.invalid', secret)
    const first = await postKeyed(anaClient, atk())
    expect(first.status).toBe(201)

    // The same key from another member or a guest never reveals Ana's order.
    const budiClient = browser(createOrderTestApp())
    await budiClient.signIn('budi@auth.test.invalid', secret)
    expect((await postKeyed(budiClient, atk())).status).toBe(409)
    expect((await postKeyed(browser(createOrderTestApp()), atk())).status).toBe(
      409,
    )

    const retry = await postKeyed(anaClient, atk())
    expect(retry.status).toBe(200)
    const [row] = await testDb.orderSubmissionKey.findMany()
    expect(row?.userId).toBe(ana.id)
  })

  it('creates a new order once the key is older than 24 hours', async () => {
    const start = Date.now()
    let now = new Date(start)
    const app = createOrderTestApp({ orders: { now: () => now } })
    const client = browser(app)
    const body = atk({ requestedCompletionAt: inDays(30) })
    const first = await postKeyed(client, body)
    expect(first.status).toBe(201)

    now = new Date(start + 25 * 60 * 60 * 1000)
    const later = await postKeyed(client, body)
    expect(later.status).toBe(201)
    expect(receiptOf(later).publicId).not.toBe(receiptOf(first).publicId)
    // The expired row was pruned; one key row remains.
    expect(await testDb.orderSubmissionKey.count()).toBe(1)
    expect(await testDb.order.count()).toBe(2)
  })

  it('creates exactly one order for concurrent duplicates', async () => {
    const client = browser(createOrderTestApp())
    await client.csrf()
    const results = await Promise.all(
      Array.from({ length: 4 }, () => postKeyed(client, atk())),
    )
    const statuses = results.map((response) => response.status).sort()
    expect(statuses).toStrictEqual([200, 200, 200, 201])
    const ids = new Set(results.map((response) => receiptOf(response).publicId))
    expect(ids.size).toBe(1)
    expect(await testDb.order.count()).toBe(1)
  })

  it('compensates the stored files of a losing concurrent multipart duplicate', async () => {
    const client = browser(createOrderTestApp())
    const csrf = await client.csrf()
    const send = () =>
      client.agent
        .post('/api/v1/orders')
        .set(CSRF_HEADER, csrf)
        .set(IDEMPOTENCY_KEY_HEADER, KEY)
        .field('payload', printingPayload)
        .attach('files', samples.png, { filename: 'scan.png' })
    const results = await Promise.all([send(), send(), send()])
    expect(new Set(results.map((r) => receiptOf(r).publicId)).size).toBe(1)
    expect(await testDb.orderFile.count()).toBe(1)
    expect(await storedFiles()).toHaveLength(1)
  })

  it.each(['short', 'x'.repeat(129), 'contains spaces here!!', 'ü'.repeat(20)])(
    'rejects the malformed key %s',
    async (key) => {
      const response = await postKeyed(
        browser(createOrderTestApp()),
        atk(),
        key,
      )
      expect(response.status).toBe(400)
      expect((response.body as { errors: unknown }).errors).toStrictEqual({
        idempotencyKey: ['Invalid idempotency key'],
      })
      expect(await testDb.order.count()).toBe(0)
    },
  )

  it('keeps the previous behavior without a key', async () => {
    const client = browser(createOrderTestApp())
    expect((await client.post('/api/v1/orders', atk())).status).toBe(201)
    expect((await client.post('/api/v1/orders', atk())).status).toBe(201)
    expect(await testDb.order.count()).toBe(2)
    expect(await testDb.orderSubmissionKey.count()).toBe(0)
  })
})
