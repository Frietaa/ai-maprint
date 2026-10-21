// ATK (TASK-04.04), Laptop Service (TASK-04.05) and Software Installation
// (TASK-04.06) submissions against maba_printing_test.
import type {
  ApiErrorResponse,
  ApiItemResponse,
  OrderReceiptDto,
} from '@maba-printing/shared'
import { describe, expect, it } from 'vitest'
import { SOFTWARE_LICENSE_NOTE } from '../services/order.service.js'
import {
  bodyOf,
  browser,
  createOrderTestApp,
  customer,
  fixture,
  inDays,
  testDb,
} from '../test/order-db.js'

const path = '/api/v1/orders'

function client() {
  return browser(createOrderTestApp())
}

function receiptOf(response: { body: unknown }): OrderReceiptDto {
  return bodyOf<ApiItemResponse<OrderReceiptDto>>(response).data
}

describe('ATK orders', () => {
  const atk = (items: unknown, extra: Record<string, unknown> = {}) => ({
    type: 'ATK',
    ...customer,
    items,
    ...extra,
  })

  it('snapshots products server-side and totals in whole Rupiah', async () => {
    const response = await client().post(
      path,
      atk([
        { productId: fixture.prodPen, quantity: 3 },
        { productId: fixture.prodPaper, quantity: 2 },
      ]),
    )

    expect(response.status).toBe(201)
    const receipt = receiptOf(response)
    expect(receipt.estimatedTotal).toBe(3 * 3000 + 2 * 55000)
    // ATK may leave the time open.
    expect(receipt.requestedCompletionAt).toBeNull()

    const order = await testDb.order.findUniqueOrThrow({
      where: { publicId: receipt.publicId },
      include: { items: { orderBy: { nameSnapshot: 'asc' } } },
    })
    expect(order.finalTotal).toBeNull()
    expect(
      order.items.map((item) => ({
        productId: item.productId,
        name: item.nameSnapshot,
        description: item.descriptionSnapshot,
        quantity: item.quantity,
        unitPrice: item.unitPriceSnapshot,
        subtotal: item.subtotal,
      })),
    ).toStrictEqual([
      {
        productId: fixture.prodPaper,
        name: 'Kertas Uji',
        description: null,
        quantity: 2,
        unitPrice: 55000,
        subtotal: 110000,
      },
      {
        productId: fixture.prodPen,
        name: 'Pulpen Uji',
        description: 'Tinta biru',
        quantity: 3,
        unitPrice: 3000,
        subtotal: 9000,
      },
    ])
  })

  it('keeps the snapshot when the catalog changes later', async () => {
    const response = await client().post(
      path,
      atk([{ productId: fixture.prodPen, quantity: 1 }]),
    )
    await testDb.product.update({
      where: { id: fixture.prodPen },
      data: { name: 'Pulpen Baru', price: 9999 },
    })
    const item = await testDb.orderItem.findFirstOrThrow({
      where: { order: { publicId: receiptOf(response).publicId } },
    })
    expect(item).toMatchObject({
      nameSnapshot: 'Pulpen Uji',
      unitPriceSnapshot: 3000,
      subtotal: 3000,
    })
  })

  it.each([
    ['UNAVAILABLE', fixture.prodSoldOut],
    ['inactive', fixture.prodRetired],
    ['in an inactive category', fixture.prodInHidden],
    ['unknown', 'a7d00000-0000-4000-8000-000000000399'],
  ])('refuses a product that is %s with 409', async (_label, productId) => {
    const response = await client().post(
      path,
      atk([
        { productId: fixture.prodPen, quantity: 1 },
        { productId, quantity: 1 },
      ]),
    )
    expect(response.status).toBe(409)
    expect(response.body).toStrictEqual({
      message: 'Some products are unavailable',
      errors: { 'items.1.productId': ['This product is not available'] },
    })
    expect(await testDb.order.count()).toBe(0)
    expect(await testDb.orderItem.count()).toBe(0)
  })

  it('rejects client prices, names and subtotals', async () => {
    for (const extra of [{ price: 1 }, { name: 'x' }, { subtotal: 1 }]) {
      const response = await client().post(
        path,
        atk([{ productId: fixture.prodPen, quantity: 1, ...extra }]),
      )
      expect(response.status).toBe(400)
    }
  })

  it('guards the INTEGER range of the total', async () => {
    const response = await client().post(
      path,
      atk([{ productId: fixture.prodExpensive, quantity: 2 }]),
    )
    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      errors: { items: ['Order total is too large'] },
    })
    expect(await testDb.order.count()).toBe(0)
  })

  it('validates quantities and duplicates before touching the database', async () => {
    for (const items of [
      [{ productId: fixture.prodPen, quantity: 0 }],
      [{ productId: fixture.prodPen, quantity: 100 }],
      [
        { productId: fixture.prodPen, quantity: 1 },
        { productId: fixture.prodPen, quantity: 2 },
      ],
      [],
    ]) {
      const response = await client().post(path, atk(items))
      expect(response.status).toBe(400)
    }
  })
})

describe('Laptop service requests', () => {
  const laptop = (extra: Record<string, unknown>) => ({
    type: 'LAPTOP_SERVICE',
    ...customer,
    requestedCompletionAt: inDays(5),
    complaint: 'Laptop tidak mau menyala.',
    ...extra,
  })

  it('stores a drop-off request without address, distance or fee', async () => {
    const response = await client().post(
      path,
      laptop({ handoverMethod: 'DROP_OFF', handoverAt: inDays(1) }),
    )
    expect(response.status).toBe(201)
    const request = await testDb.laptopServiceRequest.findFirstOrThrow({
      include: { order: true },
    })
    expect(request).toMatchObject({
      complaint: 'Laptop tidak mau menyala.',
      handoverMethod: 'DROP_OFF',
      pickupAddress: null,
      distanceKm: null,
      pickupFee: null,
    })
    expect(request.handoverAt).toBeInstanceOf(Date)
    expect(request.order).toMatchObject({
      type: 'LAPTOP_SERVICE',
      description: null,
      estimatedTotal: null,
    })
  })

  it('requires and stores the pickup address for PICKUP', async () => {
    const missing = await client().post(
      path,
      laptop({ handoverMethod: 'PICKUP' }),
    )
    expect(missing.status).toBe(400)
    expect(bodyOf<ApiErrorResponse>(missing).errors).toHaveProperty(
      'pickupAddress',
    )

    const ok = await client().post(
      path,
      laptop({ handoverMethod: 'PICKUP', pickupAddress: ' Jl. Melati 5 ' }),
    )
    expect(ok.status).toBe(201)
    const request = await testDb.laptopServiceRequest.findFirstOrThrow()
    expect(request.pickupAddress).toBe('Jl. Melati 5')
    expect(request.pickupFee).toBeNull()
  })

  it('rejects an address for drop-off, a past handover and fee fields', async () => {
    for (const extra of [
      { handoverMethod: 'DROP_OFF', pickupAddress: 'Jl. Melati 5' },
      { handoverMethod: 'DROP_OFF', handoverAt: inDays(-1) },
      { handoverMethod: 'PICKUP', pickupAddress: 'Jl. A', distanceKm: 2 },
      { handoverMethod: 'PICKUP', pickupAddress: 'Jl. A', pickupFee: 0 },
      { handoverMethod: 'DROP_OFF', complaint: '' },
    ]) {
      const response = await client().post(path, laptop(extra))
      expect(response.status).toBe(400)
    }
    expect(await testDb.order.count()).toBe(0)
  })
})

describe('Software installation requests', () => {
  const software = (extra: Record<string, unknown>) => ({
    type: 'SOFTWARE_INSTALLATION',
    ...customer,
    requestedCompletionAt: inDays(2),
    softwareName: 'LibreOffice',
    requirements: 'Bahasa Indonesia',
    ...extra,
  })

  it('stores the request with the canonical license statement', async () => {
    const response = await client().post(
      path,
      software({ licenseAcknowledged: true }),
    )
    expect(response.status).toBe(201)
    const request = await testDb.softwareInstallationRequest.findFirstOrThrow()
    expect(request).toMatchObject({
      softwareName: 'LibreOffice',
      requirements: 'Bahasa Indonesia',
      licenseNote: SOFTWARE_LICENSE_NOTE,
    })
  })

  it('requires the legal-license acknowledgement', async () => {
    for (const extra of [
      { licenseAcknowledged: false },
      {},
      { licenseAcknowledged: 'yes' },
      { licenseAcknowledged: true, licenseNote: 'kunci bajakan' },
    ]) {
      const response = await client().post(path, software(extra))
      expect(response.status).toBe(400)
    }
    expect(await testDb.order.count()).toBe(0)
  })
})
