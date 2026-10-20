// Database-free API behavior: a failing database must surface as a generic
// 500 without internals, and /health must never need the database.
import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app.js'
import type { DbClient } from '../db/prisma.js'

afterEach(() => {
  vi.restoreAllMocks()
})

function unreachableDb(): DbClient {
  throw new Error("Can't reach database server at db.internal:5432")
}

describe('public API without a database', () => {
  it('keeps /health independent of the database', async () => {
    const response = await request(createApp({ getDb: unreachableDb })).get(
      '/api/v1/health',
    )
    expect(response.status).toBe(200)
    expect(response.body).toStrictEqual({ status: 'ok' })
  })

  it('answers a database failure with a generic 500', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = await request(createApp({ getDb: unreachableDb })).get(
      '/api/v1/public/settings',
    )

    expect(response.status).toBe(500)
    expect(response.body).toStrictEqual({ message: 'Internal server error' })
    expect(response.text).not.toMatch(/db\.internal|5432/)
  })
})
