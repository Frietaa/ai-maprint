// POST /api/v1/auth/logout and session lifecycle (TASK-03.05) against
// maba_printing_test with the PostgreSQL session store.
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import {
  browser,
  createTestApp,
  insertUser,
  sessionRows,
  setCookieOf,
  testEmail,
} from '../test/auth-db.js'

const secret = 'member password 1'

async function signedIn() {
  await insertUser({ email: testEmail('ana'), password: secret })
  const client = browser()
  const login = await client.signIn(testEmail('ana'), secret)
  const cookie = setCookieOf(login)
    .find((c) => c.startsWith('maba.sid='))
    ?.split(';')[0]
  if (!cookie) throw new Error('no session cookie')
  return { client, cookie }
}

describe('POST /api/v1/auth/logout', () => {
  it('destroys the stored session and clears the cookie', async () => {
    const { client } = await signedIn()
    expect(await sessionRows()).toHaveLength(1)

    const response = await client.post('/api/v1/auth/logout')

    expect(response.status).toBe(200)
    expect(response.body).toStrictEqual({ data: null })
    expect(await sessionRows()).toHaveLength(0)
    const cleared = setCookieOf(response).find((c) => c.startsWith('maba.sid='))
    // Same attributes as when set, expired.
    expect(cleared).toMatch(/^maba\.sid=;/)
    expect(cleared).toMatch(/; Path=\//)
    expect(cleared).toMatch(/; Expires=Thu, 01 Jan 1970 00:00:00 GMT/)
    expect(cleared).toMatch(/; HttpOnly/)
    expect(cleared).toMatch(/; SameSite=Lax/)
  })

  it('leaves the browser signed out', async () => {
    const { client } = await signedIn()
    await client.post('/api/v1/auth/logout')

    const me = await client.agent.get('/api/v1/auth/me')
    expect(me.body).toStrictEqual({ data: null })
  })

  it('does not let the old cookie authenticate again', async () => {
    const { client, cookie } = await signedIn()
    await client.post('/api/v1/auth/logout')

    const replay = await request(createTestApp())
      .get('/api/v1/auth/me')
      .set('Cookie', cookie)
    expect(replay.body).toStrictEqual({ data: null })
  })

  it('requires the CSRF token', async () => {
    const { client } = await signedIn()
    const response = await client.agent.post('/api/v1/auth/logout')

    expect(response.status).toBe(403)
    expect(await sessionRows()).toHaveLength(1)
  })

  it('is harmless when already signed out', async () => {
    const client = browser()
    const response = await client.post('/api/v1/auth/logout')

    expect(response.status).toBe(200)
    expect(await sessionRows()).toHaveLength(0)
  })
})
