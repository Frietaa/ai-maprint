// Auth rate limiting (TASK-03.09) against maba_printing_test, with small
// injected limits.
import { describe, expect, it } from 'vitest'
import type { GoogleIdentityVerifier } from '../services/google-identity.js'
import { GoogleCredentialError } from '../services/google-identity.js'
import {
  browser,
  createTestApp,
  insertUser,
  testDb,
  testEmail,
} from '../test/auth-db.js'

const secret = 'member password 1'
const limits = { windowMs: 60_000, signInFailures: 2, registrations: 2 }
const tooMany = { message: 'Too many requests' }

const rejectingVerifier: GoogleIdentityVerifier = {
  verify: () => Promise.reject(new GoogleCredentialError()),
}

function limitedClient() {
  return browser(
    createTestApp({
      auth: { rateLimits: limits, googleVerifier: rejectingVerifier },
    }),
  )
}

describe('sign-in rate limit', () => {
  it('blocks after repeated failures, even with the right password', async () => {
    await insertUser({ email: testEmail('ana'), password: secret })
    const client = limitedClient()
    const attempt = (password: string) =>
      client.post('/api/v1/auth/login', { email: testEmail('ana'), password })

    expect((await attempt('wrong 1')).status).toBe(401)
    expect((await attempt('wrong 2')).status).toBe(401)

    const blocked = await attempt('wrong 3')
    expect(blocked.status).toBe(429)
    expect(blocked.body).toStrictEqual(tooMany)
    expect(blocked.headers['ratelimit-policy']).toBeDefined()

    // The correct password gets the same 429: no credential oracle.
    const correct = await attempt(secret)
    expect(correct.status).toBe(429)
    expect(correct.body).toStrictEqual(tooMany)
  })

  it('does not count successful sign-ins', async () => {
    await insertUser({ email: testEmail('ana'), password: secret })
    const client = limitedClient()
    for (let i = 0; i < 4; i += 1) {
      const response = await client.post('/api/v1/auth/login', {
        email: testEmail('ana'),
        password: secret,
      })
      expect(response.status).toBe(200)
      client.resetCsrf()
    }
  })

  it('shares the failure budget with Google sign-in', async () => {
    const client = limitedClient()
    expect(
      (await client.post('/api/v1/auth/google', { credential: 'bad' })).status,
    ).toBe(401)
    expect(
      (
        await client.post('/api/v1/auth/login', {
          email: testEmail('nobody'),
          password: secret,
        })
      ).status,
    ).toBe(401)
    expect(
      (await client.post('/api/v1/auth/google', { credential: 'bad' })).status,
    ).toBe(429)
  })
})

describe('registration rate limit', () => {
  it('limits sign-up attempts per window', async () => {
    const client = limitedClient()
    const register = (local: string) =>
      client.post('/api/v1/auth/register', {
        name: 'Rate Test',
        email: testEmail(local),
        password: secret,
      })

    expect((await register('r1')).status).toBe(201)
    client.resetCsrf()
    expect((await register('r2')).status).toBe(201)
    client.resetCsrf()
    const blocked = await register('r3')

    expect(blocked.status).toBe(429)
    expect(blocked.body).toStrictEqual(tooMany)
    expect(await testDb.user.count()).toBe(2)
  })
})
