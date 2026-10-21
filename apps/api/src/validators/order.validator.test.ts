import { describe, expect, it } from 'vitest'
import {
  createOrderSchema,
  memberOrderListQuerySchema,
  publicOrderIdParamSchema,
} from './order.validator.js'

const customer = {
  customerName: ' Rina ',
  customerWhatsapp: '0812-3456-7890',
  requestedCompletionAt: '2030-01-01T10:00:00+07:00',
}

function issues(value: unknown): string[] {
  const result = createOrderSchema.safeParse(value)
  return result.success
    ? []
    : result.error.issues.flatMap((issue) =>
        issue.code === 'unrecognized_keys'
          ? issue.keys
          : [issue.path.join('.') || issue.code],
      )
}

describe('createOrderSchema', () => {
  it('parses a printing request and normalizes the snapshot', () => {
    const parsed = createOrderSchema.parse({
      type: 'PRINTING',
      ...customer,
      customerEmail: ' Rina@Example.TEST ',
      description: '  Cetak 2 rangkap  ',
    })
    expect(parsed).toMatchObject({
      type: 'PRINTING',
      customerName: 'Rina',
      customerEmail: 'rina@example.test',
      description: 'Cetak 2 rangkap',
      locationId: null,
    })
    expect(parsed.requestedCompletionAt).toEqual(
      new Date('2030-01-01T03:00:00Z'),
    )
  })

  it.each([
    ['userId', { userId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' }],
    ['status', { status: 'COMPLETED' }],
    ['publicId', { publicId: 'MP-2026-0000000000000' }],
    ['estimatedTotal', { estimatedTotal: 1 }],
    ['finalTotal', { finalTotal: 1 }],
    ['adminNotes', { adminNotes: 'x' }],
    ['role', { role: 'ADMIN' }],
  ])('rejects the server-owned field %s', (field, extra) => {
    expect(issues({ type: 'PRINTING', ...customer, ...extra })).toContain(field)
  })

  it('rejects unknown order types', () => {
    expect(issues({ type: 'OTHER', ...customer })).toContain('type')
  })

  it.each([
    ['customerName', { customerName: '' }],
    ['customerName', { customerName: 'x'.repeat(121) }],
    ['customerName', { customerName: 'a\nb' }],
    ['customerWhatsapp', { customerWhatsapp: '' }],
    ['customerWhatsapp', { customerWhatsapp: 'call me' }],
    ['customerEmail', { customerEmail: 'nope' }],
    ['locationId', { locationId: '12' }],
    ['requestedCompletionAt', { requestedCompletionAt: 'tomorrow' }],
    ['requestedCompletionAt', { requestedCompletionAt: '2030-01-01T10:00' }],
    ['description', { description: 'x'.repeat(5001) }],
  ])('validates %s', (field, extra) => {
    expect(issues({ type: 'PRINTING', ...customer, ...extra })).toContain(field)
  })

  it('validates ATK items', () => {
    const product = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
    const atk = (items: unknown) => issues({ type: 'ATK', ...customer, items })

    expect(atk([{ productId: product, quantity: 2 }])).toStrictEqual([])
    expect(atk([])).toContain('items')
    expect(atk([{ productId: product, quantity: 0 }])).toContain(
      'items.0.quantity',
    )
    expect(atk([{ productId: product, quantity: 100 }])).toContain(
      'items.0.quantity',
    )
    expect(atk([{ productId: product, quantity: 1.5 }])).toContain(
      'items.0.quantity',
    )
    expect(
      atk([
        { productId: product, quantity: 1 },
        { productId: product, quantity: 1 },
      ]),
    ).toContain('items')
    expect(atk([{ productId: product, quantity: 1, price: 1 }])).toContain(
      'price',
    )
    expect(
      atk(
        Array.from({ length: 21 }, (_, i) => ({
          productId: `9b1deb4d-3b7d-4bad-9bdd-${String(i).padStart(12, '0')}`,
          quantity: 1,
        })),
      ),
    ).toContain('items')
  })

  it('requires a pickup address for PICKUP only', () => {
    const laptop = (extra: object) =>
      issues({
        type: 'LAPTOP_SERVICE',
        ...customer,
        complaint: 'Mati total',
        ...extra,
      })
    expect(laptop({ handoverMethod: 'DROP_OFF' })).toStrictEqual([])
    expect(laptop({ handoverMethod: 'PICKUP' })).toContain('pickupAddress')
    expect(
      laptop({ handoverMethod: 'PICKUP', pickupAddress: 'Jl. Uji 1' }),
    ).toStrictEqual([])
    expect(
      laptop({ handoverMethod: 'DROP_OFF', pickupAddress: 'Jl. Uji 1' }),
    ).toContain('pickupAddress')
    expect(laptop({ handoverMethod: 'DROP_OFF', distanceKm: 3 })).toContain(
      'distanceKm',
    )
    expect(laptop({ handoverMethod: 'DROP_OFF', pickupFee: 0 })).toContain(
      'pickupFee',
    )
    expect(laptop({ handoverMethod: 'TELEPORT' })).toContain('handoverMethod')
  })

  it('requires the legal-license acknowledgement for software', () => {
    const software = (extra: object) =>
      issues({
        type: 'SOFTWARE_INSTALLATION',
        ...customer,
        softwareName: 'LibreOffice',
        ...extra,
      })
    expect(software({ licenseAcknowledged: true })).toStrictEqual([])
    expect(software({ licenseAcknowledged: false })).toContain(
      'licenseAcknowledged',
    )
    expect(software({})).toContain('licenseAcknowledged')
    expect(
      software({ licenseAcknowledged: true, licenseNote: 'cracked' }),
    ).toContain('licenseNote')
  })
})

describe('publicOrderIdParamSchema', () => {
  it('normalizes and rejects malformed IDs', () => {
    expect(
      publicOrderIdParamSchema.parse({ publicId: 'mp-2026-7k92d4qx8m7ra' }),
    ).toStrictEqual({ publicId: 'MP-2026-7K92D4QX8M7RA' })
    expect(
      publicOrderIdParamSchema.safeParse({ publicId: 'MP-2026-%' }).success,
    ).toBe(false)
  })
})

describe('memberOrderListQuerySchema', () => {
  it('defaults and bounds pagination', () => {
    expect(memberOrderListQuerySchema.parse({})).toStrictEqual({
      page: 1,
      pageSize: 10,
    })
    expect(
      memberOrderListQuerySchema.parse({ page: '2', pageSize: '50' }),
    ).toStrictEqual({ page: 2, pageSize: 50 })
    for (const query of [
      { page: '0' },
      { pageSize: '51' },
      { page: 'x' },
      { userId: 'x' },
    ]) {
      expect(memberOrderListQuerySchema.safeParse(query).success).toBe(false)
    }
  })
})
