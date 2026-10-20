// POST /api/v1/auth/google (TASK-03.06) against maba_printing_test with a
// controlled verifier injected into createApp (no live Google calls).
import { describe, expect, it } from 'vitest'
import {
  GoogleCredentialError,
  type GoogleIdentity,
  type GoogleIdentityVerifier,
} from '../services/google-identity.js'
import {
  browser,
  createTestApp,
  insertUser,
  sessionRows,
  testDb,
  testEmail,
} from '../test/auth-db.js'

const path = '/api/v1/auth/google'
const conflict = {
  message: 'Email already registered with another sign-in method',
}
const failed = { message: 'Google sign-in failed' }

// Credential string → verified identity; anything else fails verification.
const identities: Record<string, GoogleIdentity> = {
  'cred-new': {
    subject: 'google-sub-new',
    email: ' New.Person@AUTH.test.invalid ',
    emailVerified: true,
    name: 'New Person',
  },
  'cred-linked': {
    subject: 'google-sub-linked',
    email: testEmail('linked'),
    emailVerified: true,
    name: 'Linked',
  },
  'cred-unverified': {
    subject: 'google-sub-unverified',
    email: testEmail('unverified'),
    emailVerified: false,
    name: 'Unverified',
  },
  'cred-existing-email': {
    subject: 'google-sub-other',
    email: testEmail('existing'),
    emailVerified: true,
    name: 'Existing',
  },
  'cred-no-name': {
    subject: 'google-sub-noname',
    email: testEmail('noname'),
    emailVerified: true,
    name: null,
  },
}

const fakeVerifier: GoogleIdentityVerifier = {
  verify(credential) {
    const identity = identities[credential]
    return identity
      ? Promise.resolve(identity)
      : Promise.reject(new GoogleCredentialError())
  },
}

function googleClient() {
  return browser(createTestApp({ auth: { googleVerifier: fakeVerifier } }))
}

describe('POST /api/v1/auth/google', () => {
  it('creates a MEMBER for a new verified Google identity and signs it in', async () => {
    const client = googleClient()
    const response = await client.post(path, { credential: 'cred-new' })

    expect(response.status).toBe(200)
    expect(response.body).toStrictEqual({
      data: {
        name: 'New Person',
        email: testEmail('new.person'),
        role: 'MEMBER',
      },
    })
    expect(response.text).not.toMatch(/google-sub|googleId|"id"/)

    const user = await testDb.user.findUniqueOrThrow({
      where: { email: testEmail('new.person') },
    })
    expect(user).toMatchObject({
      role: 'MEMBER',
      googleId: 'google-sub-new',
      passwordHash: null,
    })
    const rows = await sessionRows()
    expect(rows.map((row) => row.sess.userId)).toStrictEqual([user.id])
    // No Google credential or profile in the session payload.
    expect(JSON.stringify(rows)).not.toMatch(/cred-new|google-sub/)

    const me = await client.agent.get('/api/v1/auth/me')
    expect(me.body).toMatchObject({ data: { email: testEmail('new.person') } })
  })

  it('signs in the account already linked to the Google subject', async () => {
    const { id } = await insertUser({
      email: testEmail('linked'),
      googleId: 'google-sub-linked',
    })
    const response = await googleClient().post(path, {
      credential: 'cred-linked',
    })

    expect(response.status).toBe(200)
    expect(await testDb.user.count()).toBe(1)
    const rows = await sessionRows()
    expect(rows.map((row) => row.sess.userId)).toStrictEqual([id])
  })

  it('never creates an ADMIN; an existing linked ADMIN keeps its role', async () => {
    await insertUser({
      email: testEmail('linked'),
      googleId: 'google-sub-linked',
      role: 'ADMIN',
    })
    const linked = await googleClient().post(path, {
      credential: 'cred-linked',
    })
    expect(linked.body).toMatchObject({ data: { role: 'ADMIN' } })

    await googleClient().post(path, { credential: 'cred-new' })
    expect(await testDb.user.count({ where: { role: 'ADMIN' } })).toBe(1)
  })

  it('does not auto-link an existing account with the same email (409)', async () => {
    for (const role of ['MEMBER', 'ADMIN'] as const) {
      await insertUser({
        email: testEmail('existing'),
        password: 'existing password',
        role,
      })
      const response = await googleClient().post(path, {
        credential: 'cred-existing-email',
      })

      expect(response.status).toBe(409)
      expect(response.body).toStrictEqual(conflict)
      const user = await testDb.user.findUniqueOrThrow({
        where: { email: testEmail('existing') },
      })
      expect(user.googleId).toBeNull()
      expect(user.role).toBe(role)
      await testDb.user.delete({ where: { id: user.id } })
    }
    const rows = await sessionRows()
    expect(rows.every((row) => row.sess.userId === undefined)).toBe(true)
  })

  it('rejects an unverified Google email', async () => {
    const response = await googleClient().post(path, {
      credential: 'cred-unverified',
    })
    expect(response.status).toBe(401)
    expect(response.body).toStrictEqual(failed)
    expect(await testDb.user.count()).toBe(0)
  })

  it('rejects a credential that fails verification', async () => {
    const response = await googleClient().post(path, {
      credential: 'forged.jwt.value',
    })
    expect(response.status).toBe(401)
    expect(response.body).toStrictEqual(failed)
    expect(await testDb.user.count()).toBe(0)
  })

  it('does not sign in a deactivated linked account', async () => {
    await insertUser({
      email: testEmail('linked'),
      googleId: 'google-sub-linked',
      isActive: false,
    })
    const response = await googleClient().post(path, {
      credential: 'cred-linked',
    })
    expect(response.status).toBe(401)
    expect(response.body).toStrictEqual(failed)
  })

  it('falls back to the email local part as the name', async () => {
    const response = await googleClient().post(path, {
      credential: 'cred-no-name',
    })
    expect(response.body).toMatchObject({ data: { name: 'noname' } })
  })

  it('accepts only the bounded credential field', async () => {
    for (const body of [
      { credential: 'cred-new', role: 'ADMIN' },
      { credential: 'cred-new', email_verified: true },
      { credential: '' },
      { credential: 'x'.repeat(4097) },
      {},
    ]) {
      const response = await googleClient().post(path, body)
      expect(response.status).toBe(400)
    }
    expect(await testDb.user.count()).toBe(0)
  })

  it('answers 503 when Google Sign-In is not configured', async () => {
    const response = await browser().post(path, { credential: 'cred-new' })
    expect(response.status).toBe(503)
    expect(response.body).toStrictEqual({
      message: 'Google Sign-In is not available',
    })
  })

  it('requires the CSRF token', async () => {
    const client = googleClient()
    const response = await client.agent
      .post(path)
      .send({ credential: 'cred-new' })
    expect(response.status).toBe(403)
    expect(await testDb.user.count()).toBe(0)
  })
})
