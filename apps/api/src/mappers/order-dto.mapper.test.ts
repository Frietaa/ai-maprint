import { describe, expect, it } from 'vitest'
import { Prisma } from '../generated/prisma/client.js'
import type {
  MemberOrderDetailRecord,
  TrackedOrderRecord,
} from '../repositories/order.repository.js'
import {
  toMemberOrderDetailDto,
  toTrackedOrderDto,
} from './order-dto.mapper.js'

const created = new Date('2026-10-21T01:00:00Z')

describe('toTrackedOrderDto', () => {
  it('returns only the public minimum', () => {
    const record = {
      publicId: 'MP-2026-7K92D4QX8M7RA',
      type: 'PRINTING',
      status: 'SUBMITTED',
      createdAt: created,
      requestedCompletionAt: null,
      location: { name: 'Kampus' },
      statusHistory: [{ toStatus: 'SUBMITTED', createdAt: created }],
      // Extra fields a careless select might add must not pass through.
      customerName: 'Rina',
      id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    } as TrackedOrderRecord

    expect(toTrackedOrderDto(record)).toStrictEqual({
      publicId: 'MP-2026-7K92D4QX8M7RA',
      type: 'PRINTING',
      status: 'SUBMITTED',
      createdAt: '2026-10-21T01:00:00.000Z',
      requestedCompletionAt: null,
      location: { name: 'Kampus' },
      timeline: [{ status: 'SUBMITTED', at: '2026-10-21T01:00:00.000Z' }],
    })
  })
})

describe('toMemberOrderDetailDto', () => {
  it('maps snapshots and never includes keys, notes or actors', () => {
    const record = {
      publicId: 'MP-2026-7K92D4QX8M7RA',
      type: 'LAPTOP_SERVICE',
      status: 'SUBMITTED',
      createdAt: created,
      requestedCompletionAt: created,
      estimatedTotal: null,
      finalTotal: null,
      customerName: 'Rina',
      customerWhatsapp: '0812',
      customerEmail: null,
      description: null,
      location: null,
      items: [],
      laptopServiceRequest: {
        complaint: 'Mati',
        handoverMethod: 'PICKUP',
        handoverAt: null,
        pickupAddress: 'Jl. Uji',
        distanceKm: new Prisma.Decimal('6.50'),
        pickupFee: 3000,
      },
      softwareInstallationRequest: null,
      files: [
        { originalName: 'a.pdf', mimeType: 'application/pdf', sizeBytes: 5 },
      ],
      payment: {
        method: 'QRIS_STATIC',
        status: 'PAID',
        amount: 3000,
        id: 'payment-id',
        confirmedById: 'admin-id',
        confirmedAt: created,
      },
      statusHistory: [],
      adminNotes: 'internal',
      storageKey: 'orders/x',
    } as MemberOrderDetailRecord

    const dto = toMemberOrderDetailDto(record)
    expect(dto.laptopService).toStrictEqual({
      complaint: 'Mati',
      handoverMethod: 'PICKUP',
      handoverAt: null,
      pickupAddress: 'Jl. Uji',
      distanceKm: 6.5,
      pickupFee: 3000,
    })
    expect(dto.files).toStrictEqual([
      { name: 'a.pdf', mimeType: 'application/pdf', sizeBytes: 5 },
    ])
    // Customer-safe payment state only (allow-list).
    expect(dto.payment).toStrictEqual({
      method: 'QRIS_STATIC',
      status: 'PAID',
      amount: 3000,
    })
    expect(JSON.stringify(dto)).not.toMatch(
      /adminNotes|storageKey|internal|payment-id|admin-id|confirmed/,
    )
  })

  it('maps a missing payment record to null', () => {
    const dto = toMemberOrderDetailDto({
      publicId: 'MP-2026-7K92D4QX8M7RA',
      type: 'PRINTING',
      status: 'SUBMITTED',
      createdAt: created,
      requestedCompletionAt: null,
      estimatedTotal: null,
      finalTotal: null,
      customerName: 'Rina',
      customerWhatsapp: '0812',
      customerEmail: null,
      description: 'x',
      location: null,
      items: [],
      laptopServiceRequest: null,
      softwareInstallationRequest: null,
      files: [],
      payment: null,
      statusHistory: [],
    })
    expect(dto.payment).toBeNull()
  })
})
