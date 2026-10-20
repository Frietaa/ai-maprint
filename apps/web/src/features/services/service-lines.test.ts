import type { ServiceDto } from '@maba-printing/shared'
import { describe, expect, it } from 'vitest'
import {
  categoryMatchesLine,
  groupByCategory,
  selectServicesForLine,
} from './service-lines.ts'

function service(
  id: string,
  categoryId: string,
  categoryName: string,
): ServiceDto {
  return {
    id,
    name: `Service ${id}`,
    description: null,
    priceType: 'FIXED',
    price: 1000,
    category: { id: categoryId, name: categoryName, description: null },
    availableLocationIds: [],
  }
}

describe('categoryMatchesLine', () => {
  it.each([
    ['Printing', 'printing'],
    ['Cetak Dokumen', 'printing'],
    ['Fotokopi & Jilid', 'printing'],
    ['Laptop Service', 'laptop-service'],
    ['Servis Komputer', 'laptop-service'],
    ['Software Installation', 'software-installation'],
    ['Instalasi Aplikasi', 'software-installation'],
  ] as const)('%s belongs to %s', (name, line) => {
    expect(categoryMatchesLine(name, line)).toBe(true)
  })

  it('does not match unrelated lines', () => {
    expect(categoryMatchesLine('Laptop Service', 'printing')).toBe(false)
    expect(categoryMatchesLine('Printing', 'software-installation')).toBe(false)
  })
})

describe('selectServicesForLine', () => {
  const catalog = [
    service('a', 'c1', 'Laptop Service'),
    service('b', 'c2', 'Printing'),
    service('c', 'c2', 'Printing'),
  ]

  it('keeps only the categories of the line, grouped', () => {
    const selection = selectServicesForLine(catalog, 'printing')

    expect(selection.isFallback).toBe(false)
    expect(selection.groups).toHaveLength(1)
    expect(selection.groups[0]?.services.map((s) => s.id)).toEqual(['b', 'c'])
  })

  it('falls back to the whole catalog when no category matches', () => {
    const selection = selectServicesForLine(catalog, 'software-installation')

    expect(selection.isFallback).toBe(true)
    expect(selection.groups.map((g) => g.category.name)).toEqual([
      'Laptop Service',
      'Printing',
    ])
  })

  it('reports an empty catalog without fallback', () => {
    expect(selectServicesForLine([], 'printing')).toEqual({
      groups: [],
      isFallback: false,
    })
  })

  it('groups preserve API order', () => {
    expect(groupByCategory(catalog).map((g) => g.category.id)).toEqual([
      'c1',
      'c2',
    ])
  })
})
