// POST /api/v1/auth/login (TASK-03.03) against maba_printing_test.
import { CSRF_HEADER } from '@maba-printing/shared'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { verifyAgainstDummy } from '../utils/password.js'
import {
  browser,
  createTestApp,
  csrfTokenOf,
  insertUser,
  sessionCookie,
  sessionRows,
  setCookieOf,
  testEmail,
} from '../test/auth-db.js'

// Call-through spy on the dummy Argon2id verification.
vi.mock('../utils/password.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../utils/password.js')>()
  return { ...original, verifyAgainstDummy: vi.fn(original.verifyAgainstDummy) }
})

const path = '/api/v1/auth/login'
const secret = 'member password 1'
const failure = { message: 'Invalid email or password' }

describe('POST /api/v1/auth/login', () => {
  it('signs in an active password account', async () => {
    const { id } = await insertUser({
      email: testEmail('ana'),
      name: 'Ana',
      password: secret,
    })

    const response = await browser().post(path, {
      email: testEmail('ana'),
      password: secret,
    })

    expect(response.status).toBe(200)
    expect(response.body).toStrictEqual({
      data: { name: 'Ana', email: testEmail('ana'), role: 'MEMBER' },
    })
    expect(response.text).not.toMatch(/argon2|passwordHash|googleId|"id"/)
    const rows = await sessionRows()
    expect(rows.map((row) => row.sess.userId)).toStrictEqual([id])
  })

  it('normalizes the email like registration', async () => {
    await insertUser({ email: testEmail('ana'), password: secret })
    const response = await browser().post(path, {
      email: '  ANA@Auth.Test.Invalid ',
      password: secret,
    })
    expect(response.status).toBe(200)
  })

  it('answers every failure with the same 401 and message', async () => {
    await insertUser({ email: testEmail('ana'), password: secret })
    await insertUser({ email: testEmail('google-only'), googleId: 'g-sub-1' })
    await insertUser({
      email: testEmail('inactive'),
      password: secret,
      isActive: false,
    })

    const attempts = [
      { email: testEmail('ana'), password: 'wrong password' },
      { email: testEmail('nobody'), password: secret },
      { email: testEmail('google-only'), password: secret },
      // Correct password, but deactivated: still the generic failure.
      { email: testEmail('inactive'), password: secret },
      // Case variants of the password are not accepted.
      { email: testEmail('ana'), password: secret.toUpperCase() },
    ]
    for (const attempt of attempts) {
      const response = await browser().post(path, attempt)
      expect(response.status).toBe(401)
      expect(response.body).toStrictEqual(failure)
    }
    // No session was authenticated.
    const rows = await sessionRows()
    expect(rows.every((row) => row.sess.userId === undefined)).toBe(true)
  })

  it('spends Argon2id work even when there is no password hash', async () => {
    await insertUser({ email: testEmail('google-only'), googleId: 'g-sub-1' })
    const dummy = vi.mocked(verifyAgainstDummy)
    dummy.mockClear()

    await browser().post(path, { email: testEmail('nobody'), password: secret })
    await browser().post(path, {
      email: testEmail('google-only'),
      password: secret,
    })

    expect(dummy).toHaveBeenCalledTimes(2)
  })

  it('lets ADMIN accounts hold a session (role from the database)', async () => {
    await insertUser({
      email: testEmail('admin'),
      password: secret,
      role: 'ADMIN',
    })
    const response = await browser().post(path, {
      email: testEmail('admin'),
      password: secret,
    })
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ data: { role: 'ADMIN' } })
  })

  it('regenerates the session ID and the CSRF token', async () => {
    await insertUser({ email: testEmail('ana'), password: secret })
    const agent = request.agent(createTestApp())
    const anonymous = await agent.get('/api/v1/auth/csrf')
    const token = csrfTokenOf(anonymous)

    const response = await agent
      .post(path)
      .set(CSRF_HEADER, token)
      .send({ email: testEmail('ana'), password: secret })

    expect(response.status).toBe(200)
    expect(sessionCookie(setCookieOf(response))).not.toBe(
      sessionCookie(setCookieOf(anonymous)),
    )
    const rows = await sessionRows()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.sess.csrfToken).not.toBe(token)
  })

  it('keeps failed attempts on the anonymous session', async () => {
    const agent = request.agent(createTestApp())
    const anonymous = await agent.get('/api/v1/auth/csrf')
    const response = await agent
      .post(path)
      .set(CSRF_HEADER, csrfTokenOf(anonymous))
      .send({ email: testEmail('nobody'), password: secret })

    expect(response.status).toBe(401)
    expect(setCookieOf(response)).toStrictEqual([])
  })

  it.each([
    ['email', { email: 'nope', password: secret }],
    ['password', { email: testEmail('ana'), password: '' }],
    ['password', { email: testEmail('ana'), password: 'p'.repeat(129) }],
    ['role', { email: testEmail('ana'), password: secret, role: 'ADMIN' }],
  ])('validates %s before any lookup', async (field, body) => {
    const response = await browser().post(path, body)
    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty(['errors', field])
  })

  it('requires the CSRF token (login CSRF)', async () => {
    await insertUser({ email: testEmail('ana'), password: secret })
    const response = await request(createTestApp())
      .post(path)
      .send({ email: testEmail('ana'), password: secret })
    expect(response.status).toBe(403)
  })
})
