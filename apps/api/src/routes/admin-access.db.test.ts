// Admin access foundation (TASK-05.01) against maba_printing_test.
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import {
  provisionAdmin,
  ProvisioningError,
} from '../admin/admin-provisioning.js'
import {
  browser,
  createOrderTestApp,
  insertUser,
  testDb,
  testEmail,
} from '../test/order-db.js'

const secret = 'admin password 1'
// Any path under /api/v1/admin passes the guard first; an unknown one then
// answers 404 — proving the guard admitted the request.
const probe = '/api/v1/admin/probe'

async function signedIn(role: 'ADMIN' | 'MEMBER', local = role.toLowerCase()) {
  const user = await insertUser({
    email: testEmail(local),
    password: secret,
    role,
  })
  const client = browser(createOrderTestApp())
  await client.signIn(testEmail(local), secret)
  return { client, user }
}

describe('/api/v1/admin guard', () => {
  it('answers 401 without a session', async () => {
    const response = await request(createOrderTestApp()).get(probe)
    expect(response.status).toBe(401)
    expect(response.body).toStrictEqual({ message: 'Authentication required' })
  })

  it('answers 403 to a MEMBER, also for unsafe methods', async () => {
    const { client } = await signedIn('MEMBER')
    expect((await client.agent.get(probe)).status).toBe(403)
    expect((await client.patch(probe, {})).status).toBe(403)
  })

  it('admits an active ADMIN', async () => {
    const { client } = await signedIn('ADMIN')
    expect((await client.agent.get(probe)).status).toBe(404)
  })

  it('stops admitting an ADMIN as soon as the account is deactivated or demoted', async () => {
    const { client, user } = await signedIn('ADMIN')
    await testDb.user.update({
      where: { id: user.id },
      data: { isActive: false },
    })
    expect((await client.agent.get(probe)).status).toBe(401)

    const second = await signedIn('ADMIN', 'admin2')
    await testDb.user.update({
      where: { id: second.user.id },
      data: { role: 'MEMBER' },
    })
    expect((await second.client.agent.get(probe)).status).toBe(403)
  })

  it('still requires the CSRF token for an ADMIN', async () => {
    const { client } = await signedIn('ADMIN')
    const response = await client.agent.patch(probe).send({})
    expect(response.status).toBe(403)
    expect(response.body).toStrictEqual({ message: 'Invalid CSRF token' })
  })

  it('never lets public registration create an ADMIN', async () => {
    const response = await browser(createOrderTestApp()).post(
      '/api/v1/auth/register',
      {
        name: 'Sneaky',
        email: testEmail('sneaky'),
        password: secret,
        role: 'ADMIN',
      },
    )
    expect(response.status).toBe(400)
    expect(await testDb.user.count({ where: { role: 'ADMIN' } })).toBe(0)
  })
})

describe('provisionAdmin (operator command)', () => {
  const input = {
    email: '  New.Admin@AUTH.TEST.INVALID ',
    name: 'Admin Baru',
    password: 'operator password',
    promote: false,
  }

  it('creates an ADMIN with a normalized email and an Argon2id hash', async () => {
    expect(await provisionAdmin(testDb, input)).toBe('created')
    const user = await testDb.user.findUniqueOrThrow({
      where: { email: testEmail('new.admin') },
    })
    expect(user.role).toBe('ADMIN')
    expect(user.passwordHash).toMatch(/^\$argon2id\$/)
    expect(user.passwordHash).not.toContain('operator password')

    // The new Admin signs in through the normal login.
    const client = browser(createOrderTestApp())
    const login = await client.signIn(
      testEmail('new.admin'),
      'operator password',
    )
    expect(login.body).toMatchObject({ data: { role: 'ADMIN' } })
  })

  it('does not promote an existing MEMBER without explicit intent', async () => {
    await insertUser({
      email: testEmail('new.admin'),
      password: 'member password',
    })
    await expect(provisionAdmin(testDb, input)).rejects.toBeInstanceOf(
      ProvisioningError,
    )
    const user = await testDb.user.findUniqueOrThrow({
      where: { email: testEmail('new.admin') },
    })
    expect(user.role).toBe('MEMBER')

    expect(await provisionAdmin(testDb, { ...input, promote: true })).toBe(
      'promoted',
    )
    const promoted = await testDb.user.findUniqueOrThrow({
      where: { email: testEmail('new.admin') },
    })
    expect(promoted.role).toBe('ADMIN')
    // The member keeps their own password.
    expect(promoted.passwordHash).toBe(user.passwordHash)
  })

  it('leaves an existing ADMIN unchanged', async () => {
    await provisionAdmin(testDb, input)
    const before = await testDb.user.findUniqueOrThrow({
      where: { email: testEmail('new.admin') },
    })
    expect(
      await provisionAdmin(testDb, {
        ...input,
        password: 'different password',
      }),
    ).toBe('already-admin')
    const after = await testDb.user.findUniqueOrThrow({
      where: { email: testEmail('new.admin') },
    })
    expect(after.passwordHash).toBe(before.passwordHash)
  })

  it('validates the inputs', async () => {
    for (const bad of [
      { ...input, email: 'nope' },
      { ...input, name: '' },
      { ...input, password: 'short' },
    ]) {
      await expect(provisionAdmin(testDb, bad)).rejects.toBeInstanceOf(
        ProvisioningError,
      )
    }
    expect(await testDb.user.count()).toBe(0)
  })
})
