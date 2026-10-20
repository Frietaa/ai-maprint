// GET/PATCH /api/v1/account/profile (TASK-03.07) against
// maba_printing_test with the PostgreSQL session store.
import type { ApiErrorResponse } from '@maba-printing/shared'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import {
  bodyOf,
  browser,
  createTestApp,
  insertUser,
  testDb,
  testEmail,
} from '../test/auth-db.js'

const path = '/api/v1/account/profile'
const secret = 'member password 1'

async function member(
  overrides: Parameters<typeof insertUser>[0] = {
    email: testEmail('ana'),
  },
) {
  const user = await insertUser({
    name: 'Ana',
    password: secret,
    whatsapp: '+62 812-0000-0000',
    ...overrides,
  })
  const client = browser()
  await client.signIn(overrides.email, secret)
  return { client, user }
}

describe('GET /api/v1/account/profile', () => {
  it('returns only the member-owned safe fields', async () => {
    const { client } = await member()
    const response = await client.agent.get(path)

    expect(response.status).toBe(200)
    expect(response.body).toStrictEqual({
      data: {
        name: 'Ana',
        email: testEmail('ana'),
        whatsapp: '+62 812-0000-0000',
        signInMethods: { password: true, google: false },
      },
    })
    expect(response.text).not.toMatch(
      /"id"|passwordHash|argon2|googleId|isActive|role|createdAt/,
    )
    expect(response.headers['cache-control']).toBe('no-store')
  })

  it('reports Google as a sign-in method without exposing the subject', async () => {
    const { client } = await member({
      email: testEmail('both'),
      googleId: 'google-sub-both',
    })
    const response = await client.agent.get(path)
    expect(response.body).toMatchObject({
      data: { signInMethods: { password: true, google: true } },
    })
    expect(response.text).not.toContain('google-sub-both')
  })

  it('requires a signed-in session (401)', async () => {
    const response = await request(createTestApp()).get(path)
    expect(response.status).toBe(401)
    expect(response.body).toStrictEqual({ message: 'Authentication required' })
  })

  it('is for MEMBERs only (ADMIN → 403)', async () => {
    const { client } = await member({
      email: testEmail('admin'),
      role: 'ADMIN',
    })
    const response = await client.agent.get(path)
    expect(response.status).toBe(403)
    expect(response.body).toStrictEqual({ message: 'Forbidden' })
  })

  it('stops working as soon as the account is deactivated', async () => {
    const { client, user } = await member()
    await testDb.user.update({
      where: { id: user.id },
      data: { isActive: false },
    })
    expect((await client.agent.get(path)).status).toBe(401)
  })
})

describe('PATCH /api/v1/account/profile', () => {
  it('updates name and WhatsApp of the caller only', async () => {
    const { client, user } = await member()
    const other = await insertUser({
      email: testEmail('other'),
      name: 'Other',
      whatsapp: '0811111111',
    })

    const response = await client.patch(path, {
      name: '  Ana Baru  ',
      whatsapp: ' 0812 3456 789 ',
    })

    expect(response.status).toBe(200)
    expect(response.body).toStrictEqual({
      data: {
        name: 'Ana Baru',
        email: testEmail('ana'),
        whatsapp: '0812 3456 789',
        signInMethods: { password: true, google: false },
      },
    })
    const stored = await testDb.user.findUniqueOrThrow({
      where: { id: user.id },
    })
    expect(stored).toMatchObject({
      name: 'Ana Baru',
      whatsapp: '0812 3456 789',
    })
    const untouched = await testDb.user.findUniqueOrThrow({
      where: { id: other.id },
    })
    expect(untouched).toMatchObject({ name: 'Other', whatsapp: '0811111111' })
  })

  it('updates a single field and can clear WhatsApp', async () => {
    const { client } = await member()

    const nameOnly = await client.patch(path, { name: 'Ana B' })
    expect(nameOnly.body).toMatchObject({
      data: { name: 'Ana B', whatsapp: '+62 812-0000-0000' },
    })

    for (const whatsapp of [null, '']) {
      const cleared = await client.patch(path, { whatsapp })
      expect(cleared.body).toMatchObject({
        data: { name: 'Ana B', whatsapp: null },
      })
    }
  })

  it.each([
    ['role', { role: 'ADMIN' }],
    ['email', { email: testEmail('new') }],
    ['isActive', { isActive: false }],
    ['passwordHash', { passwordHash: 'x' }],
    ['googleId', { googleId: 'g' }],
    ['id', { id: '00000000-0000-4000-8000-000000000000' }],
  ])('rejects changing %s', async (field, body) => {
    const { client, user } = await member()
    const response = await client.patch(path, { name: 'Ana', ...body })

    expect(response.status).toBe(400)
    expect(bodyOf<ApiErrorResponse>(response).errors?.[field]).toStrictEqual([
      'Unknown field',
    ])
    const stored = await testDb.user.findUniqueOrThrow({
      where: { id: user.id },
    })
    expect(stored).toMatchObject({
      role: 'MEMBER',
      email: testEmail('ana'),
      isActive: true,
    })
  })

  it.each([
    ['body', {}],
    ['name', { name: '' }],
    ['name', { name: 'x'.repeat(101) }],
    ['name', { name: 'line\nbreak' }],
    ['whatsapp', { whatsapp: 'call me' }],
    ['whatsapp', { whatsapp: '+62 812 3456 7890 1234' }],
    ['name', { name: 42 }],
  ])('validates %s', async (field, body) => {
    const { client } = await member()
    const response = await client.patch(path, body)

    expect(response.status).toBe(400)
    expect(bodyOf<ApiErrorResponse>(response).errors).toHaveProperty(field)
  })

  it('requires the CSRF token', async () => {
    const { client, user } = await member()
    const response = await client.agent.patch(path).send({ name: 'Hacked' })

    expect(response.status).toBe(403)
    const stored = await testDb.user.findUniqueOrThrow({
      where: { id: user.id },
    })
    expect(stored.name).toBe('Ana')
  })

  it('requires a signed-in MEMBER', async () => {
    const anonymous = await browser().patch(path, { name: 'X' })
    expect(anonymous.status).toBe(401)

    const { client } = await member({
      email: testEmail('admin'),
      role: 'ADMIN',
    })
    expect((await client.patch(path, { name: 'X' })).status).toBe(403)
  })
})
