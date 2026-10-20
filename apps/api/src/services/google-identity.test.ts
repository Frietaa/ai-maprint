import { describe, expect, it, vi } from 'vitest'
import {
  createGoogleVerifier,
  GoogleCredentialError,
  type IdTokenClient,
} from './google-identity.js'

const clientId = 'test-client.apps.example'

function clientReturning(payload: Record<string, unknown> | undefined) {
  const verifyIdToken = vi.fn(() =>
    Promise.resolve({ getPayload: () => payload }),
  )
  return {
    client: { verifyIdToken } as unknown as IdTokenClient,
    verifyIdToken,
  }
}

describe('createGoogleVerifier', () => {
  it('verifies with the configured client ID as audience', async () => {
    const { client, verifyIdToken } = clientReturning({
      sub: 'google-sub-1',
      email: 'User@Example.test',
      email_verified: true,
      name: '  Test User ',
    })

    const identity = await createGoogleVerifier(clientId, client).verify('tok')

    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: 'tok',
      audience: clientId,
    })
    expect(identity).toStrictEqual({
      subject: 'google-sub-1',
      email: 'User@Example.test',
      emailVerified: true,
      name: 'Test User',
    })
  })

  it('treats a missing email_verified claim as unverified', async () => {
    const { client } = clientReturning({ sub: 's', email: 'a@example.test' })
    const identity = await createGoogleVerifier(clientId, client).verify('t')
    expect(identity.emailVerified).toBe(false)
    expect(identity.name).toBeNull()
  })

  it.each([
    ['no payload', undefined],
    ['no subject', { email: 'a@example.test' }],
    ['no email', { sub: 's' }],
  ])('rejects a token with %s', async (_label, payload) => {
    const { client } = clientReturning(payload)
    await expect(
      createGoogleVerifier(clientId, client).verify('t'),
    ).rejects.toBeInstanceOf(GoogleCredentialError)
  })

  it('hides library errors (signature, audience, expiry) behind one error', async () => {
    const client = {
      verifyIdToken: () =>
        Promise.reject(new Error('Wrong recipient, payload audience != x')),
    } as unknown as IdTokenClient

    const error = await createGoogleVerifier(clientId, client)
      .verify('t')
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(GoogleCredentialError)
    expect(String(error)).not.toMatch(/audience|recipient/)
  })
})
