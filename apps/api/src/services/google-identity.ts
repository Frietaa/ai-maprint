// Server-side Google ID-token verification (Architecture §18). The browser
// only relays the Google Identity Services credential; it is trusted after
// google-auth-library has verified its signature (Google's public keys),
// issuer, expiry and audience (= GOOGLE_CLIENT_ID). The ID-token flow needs
// no client secret, and no Google access/refresh token is ever stored.
//
// The verifier is injected into createApp so tests can use a fake one. There
// is no request-controlled switch and no magic credential: the running API
// always builds the real verifier from configuration.
import { type LoginTicket, OAuth2Client } from 'google-auth-library'

export interface GoogleIdentity {
  // OIDC subject: the stable Google account ID (stored as users.google_id).
  subject: string
  email: string
  // Google's `email_verified` claim; only verified emails create accounts.
  emailVerified: boolean
  name: string | null
}

export interface GoogleIdentityVerifier {
  // Rejects with GoogleCredentialError for any credential that does not
  // verify.
  verify(credential: string): Promise<GoogleIdentity>
}

// Deliberately detail-free: verification internals are never exposed.
export class GoogleCredentialError extends Error {
  constructor() {
    super('Google credential could not be verified')
    this.name = 'GoogleCredentialError'
  }
}

// The part of OAuth2Client used here (lets tests check the mapping).
export interface IdTokenClient {
  verifyIdToken(options: {
    idToken: string
    audience: string
  }): Promise<Pick<LoginTicket, 'getPayload'>>
}

export function createGoogleVerifier(
  clientId: string,
  client: IdTokenClient = new OAuth2Client({ clientId }),
): GoogleIdentityVerifier {
  return {
    async verify(credential) {
      let payload: ReturnType<LoginTicket['getPayload']>
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: clientId,
        })
        payload = ticket.getPayload()
      } catch {
        throw new GoogleCredentialError()
      }
      if (!payload?.sub || !payload.email) {
        throw new GoogleCredentialError()
      }
      return {
        subject: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified === true,
        name: payload.name?.trim() || null,
      }
    },
  }
}
