import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from './app.js'

describe('GET /api/v1/health', () => {
  it('returns 200 with { status: "ok" }', async () => {
    // Supertest binds an ephemeral port itself; server.ts is never started.
    const response = await request(createApp()).get('/api/v1/health')

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toMatch(/application\/json/)
    expect(response.body).toStrictEqual({ status: 'ok' })
  })
})
