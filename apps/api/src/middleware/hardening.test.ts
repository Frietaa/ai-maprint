// Security hardening (TASK-03.09): headers, request IDs, body limits and
// safe error logging. Database-free (in-memory session store).
import express from 'express'
import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app.js'
import { testAuthOptions } from '../test/app-options.js'
import { errorHandler } from './error-handler.js'
import { requestId } from './request-id.js'

afterEach(() => {
  vi.restoreAllMocks()
})

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('security headers', () => {
  it('sets API-appropriate headers on every response', async () => {
    const app = createApp({ auth: testAuthOptions() })
    for (const path of ['/api/v1/health', '/api/v1/auth/me', '/api/v1/nope']) {
      const response = await request(app).get(path)

      expect(response.headers['content-security-policy']).toBe(
        "default-src 'none';base-uri 'none';form-action 'none';frame-ancestors 'none'",
      )
      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['x-frame-options']).toBe('DENY')
      expect(response.headers['referrer-policy']).toBe('no-referrer')
      expect(response.headers['cross-origin-resource-policy']).toBe('same-site')
      expect(response.headers['x-powered-by']).toBeUndefined()
      // No HSTS over plain HTTP (development).
      expect(response.headers['strict-transport-security']).toBeUndefined()
    }
  })

  it('adds HSTS when served over HTTPS (production)', async () => {
    const app = createApp({ auth: testAuthOptions({ secureCookies: true }) })
    const response = await request(app).get('/api/v1/health')
    expect(response.headers['strict-transport-security']).toBe(
      'max-age=31536000; includeSubDomains',
    )
  })
})

describe('X-Request-ID', () => {
  it('is a fresh server-generated UUID per response', async () => {
    const app = createApp({ auth: testAuthOptions() })
    const first = await request(app).get('/api/v1/health')
    const second = await request(app)
      .get('/api/v1/health')
      .set('X-Request-ID', 'client-chosen-id')

    const a = first.headers['x-request-id']
    const b = second.headers['x-request-id']
    expect(a).toMatch(UUID)
    expect(b).toMatch(UUID)
    expect(a).not.toBe(b)
    // Incoming IDs are not trusted.
    expect(b).not.toBe('client-chosen-id')
  })

  it('is readable by allowed cross-origin callers', async () => {
    const origin = 'http://localhost:5173'
    const app = createApp({ allowedOrigins: [origin], auth: testAuthOptions() })
    const response = await request(app)
      .get('/api/v1/health')
      .set('Origin', origin)
    expect(response.headers['access-control-expose-headers']).toBe(
      'X-Request-ID',
    )
  })
})

describe('request body limits', () => {
  it('rejects an oversized body after a valid CSRF check with 413', async () => {
    const agent = request.agent(createApp({ auth: testAuthOptions() }))
    const csrf = await agent.get('/api/v1/auth/csrf')
    const token = (csrf.body as { data: { csrfToken: string } }).data.csrfToken

    const response = await agent
      .post('/api/v1/auth/login')
      .set('X-CSRF-Token', token)
      .set('Content-Type', 'application/json')
      .send(
        JSON.stringify({
          email: 'a@example.test',
          password: 'x'.repeat(11_000),
        }),
      )

    expect(response.status).toBe(413)
    expect(response.body).toStrictEqual({ message: 'Payload too large' })
  })

  it('answers malformed JSON with 400 Bad request', async () => {
    const agent = request.agent(createApp({ auth: testAuthOptions() }))
    const csrf = await agent.get('/api/v1/auth/csrf')
    const token = (csrf.body as { data: { csrfToken: string } }).data.csrfToken

    const response = await agent
      .post('/api/v1/auth/login')
      .set('X-CSRF-Token', token)
      .set('Content-Type', 'application/json')
      .send('{"email": ')
    expect(response.status).toBe(400)
    expect(response.body).toStrictEqual({ message: 'Bad request' })
  })
})

describe('unexpected error logging', () => {
  it('logs request ID, route and error category only', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = express()
    app.use(requestId)
    app.post('/x', () => {
      const error = new Error(
        'insert failed: password=hunter2 cookie=maba.sid=s:abc postgresql://u:secret@db/x',
      )
      Object.assign(error, { code: 'P2010' })
      throw error
    })
    app.use(errorHandler)

    const response = await request(app).post('/x').send({ password: 'hunter2' })

    expect(response.status).toBe(500)
    expect(response.body).toStrictEqual({ message: 'Internal server error' })
    expect(log).toHaveBeenCalledOnce()
    const line = log.mock.calls[0]?.join(' ') ?? ''
    expect(line).toMatch(
      /^Unhandled error \[[0-9a-f-]{36}\] POST \/x: Error P2010$/,
    )
    expect(line).not.toMatch(/hunter2|secret|maba\.sid|postgresql/)
    expect(line).toContain(String(response.headers['x-request-id']))
  })
})
