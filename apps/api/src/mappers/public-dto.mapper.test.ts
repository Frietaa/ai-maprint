import { describe, expect, it } from 'vitest'
import {
  toLocationDto,
  toProductDto,
  toPublicSettingsDto,
  toServiceDto,
  toSocialLinks,
} from './public-dto.mapper.js'

const category = {
  id: 'c1',
  name: 'Printing',
  description: '  ',
  isActive: true,
}

describe('toPublicSettingsDto', () => {
  it('copies only public fields and normalizes blank text to null', () => {
    const dto = toPublicSettingsDto({
      businessName: ' MABA PRINTING ',
      whatsappNumber: '',
      logoRef: null,
      qrisImageRef: 'private/qris.png',
      socialLinks: { instagram: 'https://example.test/maba' },
      publicInfo: 'Info',
      updatedAt: new Date(),
    })

    expect(dto).toStrictEqual({
      businessName: 'MABA PRINTING',
      whatsappNumber: null,
      logoRef: null,
      // A bare storage key is not browser-loadable: never published.
      qrisImageRef: null,
      socialLinks: [
        { platform: 'instagram', url: 'https://example.test/maba' },
      ],
      publicInfo: 'Info',
    })
  })

  it.each([
    ['/brand/qris.png', '/brand/qris.png'],
    ['https://cdn.example.test/qris.png', 'https://cdn.example.test/qris.png'],
    ['http://cdn.example.test/qris.png', null],
    ['javascript:alert(1)', null],
    ['//evil.example.test/qris.png', null],
  ])('publishes the QRIS reference %s only when browser-safe', (ref, out) => {
    const dto = toPublicSettingsDto({
      businessName: null,
      whatsappNumber: null,
      logoRef: null,
      qrisImageRef: ref,
      socialLinks: null,
      publicInfo: null,
      updatedAt: new Date(),
    })
    expect(dto.qrisImageRef).toBe(out)
  })
})

describe('toSocialLinks', () => {
  it('keeps only absolute http(s) URLs with a platform name', () => {
    expect(
      toSocialLinks({
        instagram: 'https://example.test/a',
        tiktok: 'javascript:alert(1)',
        facebook: 'not a url',
        x: 42,
        '': 'https://example.test/b',
        web: 'http://example.test/',
      }),
    ).toStrictEqual([
      { platform: 'instagram', url: 'https://example.test/a' },
      { platform: 'web', url: 'http://example.test/' },
    ])
  })

  it.each([null, [], 'x', 1])('returns [] for non-object %j', (value) => {
    expect(toSocialLinks(value)).toStrictEqual([])
  })
})

describe('toLocationDto', () => {
  it('maps public fields and normalizes opening hours', () => {
    const dto = toLocationDto({
      id: 'l1',
      name: 'A',
      address: 'Jl. A',
      isActive: true,
      openingHours: { weekly: { mon: [{ open: '08:00', close: '17:00' }] } },
    })

    expect(Object.keys(dto)).toStrictEqual([
      'id',
      'name',
      'address',
      'openingHours',
    ])
    expect(dto.openingHours?.weekly.mon).toStrictEqual([
      { open: '08:00', close: '17:00' },
    ])
  })

  it('maps malformed opening hours to null', () => {
    const dto = toLocationDto({
      id: 'l1',
      name: 'A',
      address: 'Jl. A',
      isActive: true,
      openingHours: 'Senin-Jumat',
    })
    expect(dto.openingHours).toBeNull()
  })
})

describe('toServiceDto', () => {
  it('maps the service, its category and available location ids', () => {
    const dto = toServiceDto({
      id: 's1',
      name: 'Print',
      description: null,
      priceType: 'REQUIRES_CONFIRMATION',
      price: null,
      isActive: true,
      category,
      locations: [{ locationId: 'l1' }, { locationId: 'l2' }],
    })

    expect(dto).toStrictEqual({
      id: 's1',
      name: 'Print',
      description: null,
      priceType: 'REQUIRES_CONFIRMATION',
      price: null,
      category: { id: 'c1', name: 'Printing', description: null },
      availableLocationIds: ['l1', 'l2'],
    })
  })
})

describe('toProductDto', () => {
  it('maps the product without internal fields', () => {
    const dto = toProductDto({
      id: 'p1',
      name: 'Pen',
      description: 'Black',
      price: 3000,
      imageRef: null,
      availability: 'UNAVAILABLE',
      isActive: true,
      category,
    })

    expect(dto).toStrictEqual({
      id: 'p1',
      name: 'Pen',
      description: 'Black',
      price: 3000,
      availability: 'UNAVAILABLE',
      imageRef: null,
      category: { id: 'c1', name: 'Printing', description: null },
    })
  })
})
