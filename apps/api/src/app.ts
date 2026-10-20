import { API_PREFIX } from '@maba-printing/shared'
import express, { type RequestHandler } from 'express'
import type { Store } from 'express-session'
import { type DbClient, getPrisma } from './db/prisma.js'
import { corsAllowlist } from './middleware/cors.js'
import { csrfProtection } from './middleware/csrf.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import {
  type AuthRateLimits,
  createAuthRateLimiters,
} from './middleware/rate-limit.js'
import { requestId } from './middleware/request-id.js'
import { securityHeaders } from './middleware/security-headers.js'
import { createSessionManager } from './middleware/session.js'
import { createAccountRouter } from './routes/account.routes.js'
import { createAuthRouter } from './routes/auth.routes.js'
import { createPublicRouter } from './routes/public.routes.js'
import type { GoogleIdentityVerifier } from './services/google-identity.js'

export interface AuthOptions {
  // SESSION_SECRET. Tests inject a random value; there is no default.
  sessionSecret: string
  // PostgreSQL store in the running API (server.ts); tests inject the test
  // database store or an in-memory store.
  sessionStore: Store
  // Secure cookies (HTTPS only) — true in production.
  secureCookies: boolean
  // Google ID-token verifier (from GOOGLE_CLIENT_ID); null/absent disables
  // Google Sign-In. Tests inject a fake verifier.
  googleVerifier?: GoogleIdentityVerifier | null
  // Auth rate limits; defaults in rate-limit.ts. Tests inject small ones.
  rateLimits?: AuthRateLimits
}

export interface AppOptions {
  // Database accessor for request handlers. Defaults to the shared Prisma
  // client, created lazily on first use — /api/v1/health never touches it.
  // Tests pass the test database or a transaction client.
  getDb?: () => DbClient
  // CORS allowlist (from FRONTEND_URL in production use).
  allowedOrigins?: readonly string[]
  // Express "trust proxy" hop count (TRUST_PROXY); false = direct.
  trustProxy?: number | false
  auth: AuthOptions
}

// Responses that depend on the session must never be cached.
const noStore: RequestHandler = (_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
}

// Builds the Express app without opening a port, so tests can import it.
export function createApp({
  getDb = getPrisma,
  allowedOrigins = [],
  trustProxy = false,
  auth,
}: AppOptions) {
  const app = express()

  // Do not advertise the framework in response headers.
  app.disable('x-powered-by')
  app.set('trust proxy', trustProxy)

  app.use(requestId)
  // Includes X-Content-Type-Options: nosniff. HTTPS-only headers follow the
  // secure-cookie setting (production).
  app.use(securityHeaders({ https: auth.secureCookies }))
  app.use('/api', corsAllowlist(allowedOrigins))

  app.get(`${API_PREFIX}/health`, (_req, res) => {
    res.status(200).json({ status: 'ok' })
  })

  // Public read endpoints: no session lookup, no cookies set.
  app.use(API_PREFIX, createPublicRouter(getDb))

  // Everything below is session-backed: server session, CSRF check for
  // unsafe methods, bounded JSON bodies, no caching.
  const sessions = createSessionManager({
    secret: auth.sessionSecret,
    store: auth.sessionStore,
    secureCookies: auth.secureCookies,
  })
  app.use(
    API_PREFIX,
    noStore,
    sessions.middleware,
    csrfProtection,
    express.json({ limit: '10kb' }),
  )
  app.use(
    API_PREFIX,
    createAuthRouter({
      getDb,
      sessions,
      googleVerifier: auth.googleVerifier ?? null,
      rateLimiters: createAuthRateLimiters(auth.rateLimits),
    }),
  )
  app.use(API_PREFIX, createAccountRouter({ getDb, sessions }))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
