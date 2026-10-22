import { describe, expect, it } from 'vitest'
import { ApiError } from './api-client.ts'
import { describeLoadError } from './error-message.ts'

describe('describeLoadError', () => {
  it('explains network failures', () => {
    expect(describeLoadError(new ApiError('network', 'x')).title).toBe(
      'Tidak dapat terhubung',
    )
  })

  it('explains invalid requests (4xx)', () => {
    expect(
      describeLoadError(new ApiError('http', 'Validation failed', 400)).title,
    ).toBe('Permintaan tidak dapat diproses')
  })

  it.each([
    [401, 'Sesi Anda telah berakhir'],
    [403, 'Akses ditolak'],
    [404, 'Data tidak ditemukan'],
    [429, 'Terlalu banyak permintaan'],
  ])('explains %i responses', (status, title) => {
    expect(describeLoadError(new ApiError('http', 'x', status)).title).toBe(
      title,
    )
  })

  it.each([
    new ApiError('http', 'Internal server error', 500),
    new ApiError('invalid-response', 'Unexpected response format', 200),
    new Error('TypeError: x is undefined'),
    'boom',
  ])('uses generic copy without technical details for %s', (error) => {
    const copy = describeLoadError(error)
    expect(copy.title).toBe('Data belum dapat dimuat')
    expect(`${copy.title} ${copy.description}`).not.toMatch(
      /500|Internal|TypeError|undefined|format/,
    )
  })
})
