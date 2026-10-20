// GET /api/v1/auth/me and principal resolution (TASK-03.04) against
// maba_printing_test with the PostgreSQL session store.
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { SESSION_MAX_AGE_MS } from '../middleware/session.js'
import {
  browser,
  createTestApp,
  insertUser,
  sessionPool,
  sessionRows,
  setCookieOf,
  testDb,
  testEmail,
} from '../test/auth-db.js'

const me = '/api/v1/auth/me'
const secret = 'member password 1'

async function signedIn(email = testEmail('ana')) {
  const user = await insertUser({ email, name: 'Ana', password: secret })
  const client = browser()
  await client.signIn(email, secret)
  return { client, user }
}

// Cookie header value ("maba.sid=...") the agent would send.
function cookieHeader(response: { headers: object }): string {
  const cookie = setCookieOf(response).find((c) => c.startsWith('maba.sid='))
  if (!cookie) throw new Error('no session cookie')
  return cookie.split(';')[0] ?? ''
}

describe('GET /api/v1/auth/me', () => {
  it('returns data: null without a session and creates none', async () => {
    const response = await request(createTestApp()).get(me)

    expect(response.status).toBe(200)
    expect(response.body).toStrictEqual({ data: null })
    expect(setCookieOf(response)).toStrictEqual([])
    expect(response.headers['cache-control']).toBe('no-store')
    expect(await sessionRows()).toHaveLength(0)
  })

  it('returns data: null for an anonymous (CSRF-only) session', async () => {
    const client = browser()
    await client.csrf()
    const response = await client.agent.get(me)
    expect(response.body).toStrictEqual({ data: null })
  })

  it('returns the signed-in account', async () => {
    const { client } = await signedIn()
    const response = await client.agent.get(me)

    expect(response.status).toBe(200)
    expect(response.body).toStrictEqual({
      data: { name: 'Ana', email: testEmail('ana'), role: 'MEMBER' },
    })
  })

  it('survives an API restart (session persisted in PostgreSQL)', async () => {
    await insertUser({ email: testEmail('ana'), password: secret })
    const client = browser()
    const login = await client.signIn(testEmail('ana'), secret)

    // A brand-new app instance (same store and secret), like a restart.
    const response = await request(createTestApp())
      .get(me)
      .set('Cookie', cookieHeader(login))
    expect(response.body).toMatchObject({ data: { email: testEmail('ana') } })
  })

  it('ignores forged, tampered or unknown session cookies', async () => {
    const { client } = await signedIn()
    const login = await client.signIn(testEmail('ana'), secret)
    const valid = cookieHeader(login)

    const tampered = `${valid.slice(0, -2)}xx`
    const unsigned = `maba.sid=${encodeURIComponent('s:unknown-session-id.bad')}`
    const otherSecret = createTestApp({
      auth: { sessionSecret: 'another-secret-another-secret-123' },
    })

    for (const [app, cookie] of [
      [createTestApp(), tampered],
      [createTestApp(), unsigned],
      [otherSecret, valid],
    ] as const) {
      const response = await request(app).get(me).set('Cookie', cookie)
      expect(response.body).toStrictEqual({ data: null })
    }
  })

  it('reads the role from the database, not from the session', async () => {
    const { client, user } = await signedIn()
    await testDb.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    })

    const response = await client.agent.get(me)
    expect(response.body).toMatchObject({ data: { role: 'ADMIN' } })
  })

  it('ends the session of a deactivated user', async () => {
    const { client, user } = await signedIn()
    await testDb.user.update({
      where: { id: user.id },
      data: { isActive: false },
    })

    const response = await client.agent.get(me)
    expect(response.body).toStrictEqual({ data: null })
    expect(setCookieOf(response).join()).toMatch(
      /maba\.sid=;.*Expires=Thu, 01 Jan 1970/,
    )
    expect(await sessionRows()).toHaveLength(0)

    // Reactivation does not revive the destroyed session.
    await testDb.user.update({
      where: { id: user.id },
      data: { isActive: true },
    })
    expect((await client.agent.get(me)).body).toStrictEqual({ data: null })
  })

  it('ends the session of a deleted user', async () => {
    const { client, user } = await signedIn()
    await testDb.user.delete({ where: { id: user.id } })

    expect((await client.agent.get(me)).body).toStrictEqual({ data: null })
    expect(await sessionRows()).toHaveLength(0)
  })

  it('enforces the absolute 7-day lifetime', async () => {
    const { client } = await signedIn()
    const expiredSignIn = Date.now() - SESSION_MAX_AGE_MS - 60_000
    await sessionPool.query(
      `UPDATE user_sessions
          SET sess = jsonb_set(sess::jsonb, '{authenticatedAt}', to_jsonb($1::bigint))::json`,
      [expiredSignIn],
    )

    expect((await client.agent.get(me)).body).toStrictEqual({ data: null })
    expect(await sessionRows()).toHaveLength(0)
  })

  it('never authenticates an expired store row', async () => {
    const { client } = await signedIn()
    await sessionPool.query(
      "UPDATE user_sessions SET expire = now() - interval '1 minute'",
    )

    expect((await client.agent.get(me)).body).toStrictEqual({ data: null })
  })

  it('rejects unknown query parameters', async () => {
    const response = await request(createTestApp()).get(`${me}?role=ADMIN`)
    expect(response.status).toBe(400)
  })
})
