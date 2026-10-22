import { describe, expect, it } from 'vitest'
import {
  categoryMatchesLine,
  serviceLinesForCategory,
} from './service-lines.js'

describe('service business lines (KI-013)', () => {
  it.each([
    ['Cetak Dokumen', ['printing']],
    ['PRINTING & Jilid', ['printing']],
    ['Service Laptop', ['laptop-service']],
    ['Instalasi Software', ['software-installation']],
    ['Instal aplikasi laptop', ['laptop-service', 'software-installation']],
    ['Dokumen', []],
  ])('maps %s', (name, lines) => {
    expect(serviceLinesForCategory(name)).toStrictEqual(lines)
  })

  it('matches case-insensitively', () => {
    expect(categoryMatchesLine('KOMPUTER', 'laptop-service')).toBe(true)
  })
})
