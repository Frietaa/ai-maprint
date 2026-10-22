import { describe, expect, it } from 'vitest'
import { ApiError } from '../../lib/api-client.ts'
import { orderErrorMessage } from './order-error-message.ts'

describe('orderErrorMessage', () => {
  it.each([
    [413, 'Ukuran file terlalu besar'],
    [415, 'Jenis file tidak didukung'],
    [422, 'tidak lolos pemeriksaan keamanan'],
    [429, 'Terlalu banyak permintaan'],
    [503, 'sedang tidak tersedia'],
  ])('explains %i without technical details', (status, text) => {
    const message = orderErrorMessage(
      new ApiError('http', 'File rejected', status),
    )
    expect(message).toContain(text)
    expect(message).not.toMatch(/File rejected|HTTP|\d{3}/)
  })

  it('explains an idempotency conflict', () => {
    expect(
      orderErrorMessage(
        new ApiError('http', 'x', 409, { idempotencyKey: ['used'] }),
      ),
    ).toContain('sudah pernah dikirim')
  })
})
