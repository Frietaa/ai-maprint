// POST /api/v1/auth/register (TASK-03.02) against maba_printing_test.
import {
  type ApiErrorResponse,
  type AuthUserDto,
  CSRF_HEADER,
} from '@maba-printing/shared'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import {
  bodyOf,
  browser,
  createTestApp,
  csrfTokenOf,
  insertUser,
  sessionCookie,
  sessionRows,
  setCookieOf,
  testDb,
  testEmail,
} from '../test/auth-db.js'

const path = '/api/v1/auth/register'

function valid(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Rina Member',
    email: testEmail('rina'),
    password: 'correct horse battery',
    ...overrides,
  }
}

describe('POST /api/v1/auth/register', () => {
  it('creates a MEMBER, signs it in and returns only the safe DTO', async () => {
    const client = browser()
    const response = await client.post(
      path,
      valid({ whatsapp: '0812-3456-7890' }),
    )

    expect(response.status).toBe(201)
    expect(response.body).toStrictEqual({
      data: { name: 'Rina Member', email: testEmail('rina'), role: 'MEMBER' },
    })
    expect(response.text).not.toMatch(/argon2|passwordHash|googleId|"id"/)

    const user = await testDb.user.findUniqueOrThrow({
      where: { email: testEmail('rina') },
    })
    expect(user.role).toBe('MEMBER')
    expect(user.whatsapp).toBe('0812-3456-7890')
    expect(user.googleId).toBeNull()
    // Argon2id with the documented default parameters; never plaintext.
    expect(user.passwordHash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/)
    expect(user.passwordHash).not.toContain('correct horse battery')

    // The session now belongs to the new user.
    const rows = await sessionRows()
    expect(rows.map((row) => row.sess.userId)).toStrictEqual([user.id])
  })

  it('stores the normalized email', async () => {
    const response = await browser().post(
      path,
      valid({ email: `  MiXeD.Case@${'AUTH.TEST.INVALID'}  ` }),
    )
    expect(response.status).toBe(201)
    expect(bodyOf<{ data: AuthUserDto }>(response).data.email).toBe(
      testEmail('mixed.case'),
    )
  })

  it('regenerates the session ID and rotates the CSRF token', async () => {
    const agent = request.agent(createTestApp())
    const anonymous = await agent.get('/api/v1/auth/csrf')
    const anonymousId = sessionCookie(setCookieOf(anonymous))
    const anonymousToken = csrfTokenOf(anonymous)

    const response = await agent
      .post(path)
      .set(CSRF_HEADER, anonymousToken)
      .send(valid())
    const newId = sessionCookie(setCookieOf(response))

    expect(response.status).toBe(201)
    expect(anonymousId).toBeDefined()
    expect(newId).toBeDefined()
    expect(newId).not.toBe(anonymousId)

    // Exactly one session left: the signed-in one, with a new CSRF token and
    // the minimal payload. The pre-login session was destroyed.
    const rows = await sessionRows()
    expect(rows).toHaveLength(1)
    const user = await testDb.user.findUniqueOrThrow({
      where: { email: testEmail('rina') },
      select: { id: true },
    })
    expect(rows[0]?.sess.userId).toBe(user.id)
    expect(rows[0]?.sess.csrfToken).not.toBe(anonymousToken)
    expect(Object.keys(rows[0]?.sess ?? {}).sort()).toStrictEqual([
      'authenticatedAt',
      'cookie',
      'csrfToken',
      'userId',
    ])

    // The old token no longer passes the CSRF check; the new one does.
    const stale = await agent
      .post('/api/v1/auth/csrf-probe')
      .set(CSRF_HEADER, anonymousToken)
    expect(stale.status).toBe(403)
    const freshToken = csrfTokenOf(await agent.get('/api/v1/auth/csrf'))
    const fresh = await agent
      .post('/api/v1/auth/csrf-probe')
      .set(CSRF_HEADER, freshToken)
    expect(fresh.status).toBe(404)
  })

  it('rejects a duplicate email, also in a different case', async () => {
    expect((await browser().post(path, valid())).status).toBe(201)

    for (const email of [testEmail('rina'), `RINA@AUTH.TEST.INVALID`]) {
      const response = await browser().post(path, valid({ email }))
      expect(response.status).toBe(409)
      expect(response.body).toStrictEqual({
        message: 'Email already registered',
      })
    }
    expect(
      await testDb.user.count({ where: { email: testEmail('rina') } }),
    ).toBe(1)
  })

  it('maps the case-insensitive database backstop (KI-008) to 409', async () => {
    // A legacy, non-normalized row the application lookup cannot match.
    await insertUser({ email: 'Legacy@auth.test.invalid', password: null })

    const response = await browser().post(
      path,
      valid({ email: testEmail('legacy') }),
    )
    expect(response.status).toBe(409)
  })

  it.each([
    ['role', { role: 'ADMIN' }],
    ['isActive', { isActive: false }],
    ['googleId', { googleId: 'google-sub' }],
    ['passwordHash', { passwordHash: 'x' }],
  ])(
    'rejects the unexpected field %s and creates nothing',
    async (field, extra) => {
      const response = await browser().post(path, valid(extra))

      expect(response.status).toBe(400)
      expect(bodyOf<ApiErrorResponse>(response).errors?.[field]).toStrictEqual([
        'Unknown field',
      ])
      expect(await testDb.user.count()).toBe(0)
    },
  )

  it.each([
    ['name', { name: '   ' }],
    ['name', { name: 'x'.repeat(101) }],
    ['email', { email: 'not-an-email' }],
    ['email', { email: `${'a'.repeat(250)}@auth.test.invalid` }],
    ['password', { password: 'short' }],
    ['password', { password: 'p'.repeat(129) }],
    ['whatsapp', { whatsapp: '12ab' }],
    ['whatsapp', { whatsapp: '1234567' }],
  ])('validates %s', async (field, extra) => {
    const response = await browser().post(path, valid(extra))

    expect(response.status).toBe(400)
    expect(bodyOf<ApiErrorResponse>(response).errors).toHaveProperty(field)
    expect(await testDb.user.count()).toBe(0)
  })

  it('keeps surrounding whitespace in passwords', async () => {
    const response = await browser().post(
      path,
      valid({ password: '  spaced  ' }),
    )
    expect(response.status).toBe(201)
  })

  it('treats an empty WhatsApp number as none', async () => {
    await browser().post(path, valid({ whatsapp: '' }))
    const user = await testDb.user.findUniqueOrThrow({
      where: { email: testEmail('rina') },
    })
    expect(user.whatsapp).toBeNull()
  })

  it('requires a JSON object body', async () => {
    const response = await browser().post(path)
    expect(response.status).toBe(400)
    expect(bodyOf<ApiErrorResponse>(response).message).toBe('Validation failed')
  })

  it('requires the CSRF token', async () => {
    const response = await request(createTestApp()).post(path).send(valid())
    expect(response.status).toBe(403)
    expect(await testDb.user.count()).toBe(0)
  })
})
