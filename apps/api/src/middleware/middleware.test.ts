import express from 'express'
import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app.js'
import { testAuthOptions } from '../test/app-options.js'
import { ValidationError } from '../errors/app-error.js'
import { errorHandler, notFoundHandler } from './error-handler.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('error handling', () => {
  it('answers unknown API routes with a JSON 404', async () => {
    const response = await request(createApp({ auth: testAuthOptions() })).get(
      '/api/v1/does-not-exist',
    )

    expect(response.status).toBe(404)
    expect(response.headers['content-type']).toMatch(/application\/json/)
    expect(response.body).toStrictEqual({ message: 'Not found' })
  })

  it('returns validation errors with field details', async () => {
    const app = express()
    app.get('/x', () => {
      throw new ValidationError({ categoryId: ['Must be a valid UUID'] })
    })
    app.use(errorHandler)

    const response = await request(app).get('/x')

    expect(response.status).toBe(400)
    expect(response.body).toStrictEqual({
      message: 'Validation failed',
      errors: { categoryId: ['Must be a valid UUID'] },
    })
  })

  it('hides internals of unexpected errors behind a generic 500', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = express()
    app.get('/x', () => {
      throw new Error(
        'PrismaClientKnownRequestError: SELECT * FROM users; postgresql://u:secret@db/x',
      )
    })
    app.use(notFoundHandler)
    app.use(errorHandler)

    const response = await request(app).get('/x')

    expect(response.status).toBe(500)
    expect(response.body).toStrictEqual({ message: 'Internal server error' })
    expect(response.text).not.toMatch(/Prisma|SELECT|secret|postgresql|at /)
    expect(log).toHaveBeenCalledOnce()
  })

  it('answers malformed request URLs with 400, not 500', async () => {
    const response = await request(createApp({ auth: testAuthOptions() })).get(
      '/api/v1/%E0%A4%A',
    )
    expect([400, 404]).toContain(response.status)
    expect(response.status).not.toBe(500)
  })
})

describe('security headers', () => {
  it('sets nosniff and hides x-powered-by', async () => {
    const response = await request(createApp({ auth: testAuthOptions() })).get(
      '/api/v1/health',
    )

    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-powered-by']).toBeUndefined()
  })
})

describe('CORS allowlist', () => {
  const allowed = 'http://localhost:5173'
  const app = createApp({ allowedOrigins: [allowed], auth: testAuthOptions() })

  it('echoes an allowed origin with credentials, never a wildcard', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .set('Origin', allowed)

    expect(response.headers['access-control-allow-origin']).toBe(allowed)
    expect(response.headers['access-control-allow-credentials']).toBe('true')
    expect(response.headers.vary).toMatch(/Origin/)
  })

  it('sends no CORS headers to other origins', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://evil.example.test')

    expect(response.status).toBe(200)
    expect(response.headers['access-control-allow-origin']).toBeUndefined()
    expect(response.headers['access-control-allow-credentials']).toBeUndefined()
  })

  it('answers preflight only for allowed origins, with the CSRF header', async () => {
    const ok = await request(app)
      .options('/api/v1/auth/login')
      .set('Origin', allowed)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type, x-csrf-token')
    expect(ok.status).toBe(204)
    expect(ok.headers['access-control-allow-methods']).toBe(
      'GET, POST, PATCH, PUT, OPTIONS',
    )
    expect(ok.headers['access-control-allow-headers']).toBe(
      'Content-Type, X-CSRF-Token',
    )
    expect(ok.headers['access-control-allow-credentials']).toBe('true')

    const denied = await request(app)
      .options('/api/v1/locations')
      .set('Origin', 'https://evil.example.test')
      .set('Access-Control-Request-Method', 'GET')
    expect(denied.headers['access-control-allow-origin']).toBeUndefined()
  })
})
