// Session + CSRF foundation (TASK-03.01) against maba_printing_test with the
// real PostgreSQL session store.
import { CSRF_HEADER } from '@maba-printing/shared'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import {
  createTestApp,
  csrfTokenOf,
  sessionCookie,
  sessionRows,
} from '../test/auth-db.js'

function setCookies(response: request.Response): string[] {
  const value = response.headers['set-cookie'] as unknown
  return Array.isArray(value) ? (value as string[]) : []
}

describe('session cookie', () => {
  it('is HttpOnly, SameSite=Lax, path / and carries only an opaque ID', async () => {
    const response = await request(createTestApp()).get('/api/v1/auth/csrf')

    expect(response.status).toBe(200)
    const cookie = setCookies(response).find((c) => c.startsWith('maba.sid='))
    expect(cookie).toBeDefined()
    expect(cookie).toMatch(/; HttpOnly/)
    expect(cookie).toMatch(/; SameSite=Lax/)
    expect(cookie).toMatch(/; Path=\//)
    expect(cookie).toMatch(/; Expires=/)
    expect(cookie).not.toMatch(/; Secure/)
    // Signed session ID only (s:<id>.<signature>), no readable payload.
    expect(decodeURIComponent(sessionCookie(cookie) ?? '')).toMatch(
      /^s:[\w-]+\.[\w+/]+$/,
    )
    expect(response.headers['cache-control']).toBe('no-store')
  })

  it('uses SameSite=None with Secure only for an explicit cross-site setup (KI-022)', async () => {
    const app = createTestApp({
      trustProxy: 1,
      auth: { secureCookies: true, sameSite: 'none' },
    })
    const response = await request(app)
      .get('/api/v1/auth/csrf')
      .set('X-Forwarded-Proto', 'https')
    const cookie = setCookies(response).find((c) => c.startsWith('maba.sid='))
    expect(cookie).toMatch(/; SameSite=None/)
    expect(cookie).toMatch(/; Secure/)
    expect(() =>
      createTestApp({ auth: { secureCookies: false, sameSite: 'none' } }),
    ).toThrow('SameSite=None session cookies require Secure cookies')
  })

  it('is Secure when secure cookies are enabled (production)', async () => {
    const app = createTestApp({
      trustProxy: 1,
      auth: { secureCookies: true },
    })
    const response = await request(app)
      .get('/api/v1/auth/csrf')
      .set('X-Forwarded-Proto', 'https')

    const cookie = setCookies(response).find((c) => c.startsWith('maba.sid='))
    expect(cookie).toMatch(/; Secure/)
  })

  it('stores a minimal anonymous session holding only the CSRF token', async () => {
    const response = await request(createTestApp()).get('/api/v1/auth/csrf')
    const rows = await sessionRows()

    expect(rows).toHaveLength(1)
    expect(Object.keys(rows[0]?.sess ?? {}).sort()).toStrictEqual([
      'cookie',
      'csrfToken',
    ])
    expect(rows[0]?.sess.csrfToken).toBe(csrfTokenOf(response))
  })

  it('is never created by browsing public endpoints or /health', async () => {
    const app = createTestApp()
    for (const path of [
      '/api/v1/health',
      '/api/v1/public/settings',
      '/api/v1/locations',
      '/api/v1/services',
      '/api/v1/products',
    ]) {
      const response = await request(app).get(path)
      expect(response.status).toBe(200)
      expect(setCookies(response)).toStrictEqual([])
    }
    expect(await sessionRows()).toHaveLength(0)
  })
})

describe('GET /api/v1/auth/csrf', () => {
  it('returns a random 32-byte token that is stable within the session', async () => {
    const agent = request.agent(createTestApp())
    const first = await agent.get('/api/v1/auth/csrf')
    const second = await agent.get('/api/v1/auth/csrf')
    const other = await request(createTestApp()).get('/api/v1/auth/csrf')

    expect(first.body).toStrictEqual({
      data: { csrfToken: expect.stringMatching(/^[\w-]{43}$/) as string },
    })
    expect(csrfTokenOf(second)).toBe(csrfTokenOf(first))
    expect(csrfTokenOf(other)).not.toBe(csrfTokenOf(first))
  })

  it('rejects unknown query parameters', async () => {
    const response = await request(createTestApp()).get(
      '/api/v1/auth/csrf?token=x',
    )
    expect(response.status).toBe(400)
  })
})

describe('CSRF protection', () => {
  // Unknown session-backed route: the CSRF check runs before routing, so a
  // valid token yields 404 and a missing/wrong one 403.
  const target = '/api/v1/auth/csrf-probe'

  it('rejects unsafe requests without a session or token', async () => {
    const response = await request(createTestApp()).post(target).send({})
    expect(response.status).toBe(403)
    expect(response.body).toStrictEqual({ message: 'Invalid CSRF token' })
  })

  it('rejects a missing or wrong token on an existing session', async () => {
    const agent = request.agent(createTestApp())
    const token = csrfTokenOf(await agent.get('/api/v1/auth/csrf'))

    const missing = await agent.post(target).send({})
    const wrong = await agent
      .post(target)
      .set(CSRF_HEADER, `${token.slice(0, -1)}x`)
      .send({})
    const short = await agent.patch(target).set(CSRF_HEADER, 'x').send({})

    expect([missing.status, wrong.status, short.status]).toStrictEqual([
      403, 403, 403,
    ])
  })

  it('rejects a token from another session', async () => {
    const app = createTestApp()
    const victim = request.agent(app)
    await victim.get('/api/v1/auth/csrf')
    const attacker = await request(app).get('/api/v1/auth/csrf')

    const response = await victim
      .post(target)
      .set(CSRF_HEADER, csrfTokenOf(attacker))
      .send({})
    expect(response.status).toBe(403)
  })

  it('accepts the session token', async () => {
    const agent = request.agent(createTestApp())
    const token = csrfTokenOf(await agent.get('/api/v1/auth/csrf'))

    const response = await agent.post(target).set(CSRF_HEADER, token).send({})
    expect(response.status).toBe(404)
  })

  it('does not apply to safe methods', async () => {
    const response = await request(createTestApp()).get(target)
    expect(response.status).toBe(404)
  })
})
