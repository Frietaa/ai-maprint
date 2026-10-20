import { API_PREFIX } from '@maba-printing/shared'
import express from 'express'
import { type DbClient, getPrisma } from './db/prisma.js'
import { corsAllowlist } from './middleware/cors.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import { createPublicRouter } from './routes/public.routes.js'

export interface AppOptions {
  // Database accessor for request handlers. Defaults to the shared Prisma
  // client, created lazily on first use — /api/v1/health never touches it.
  // Tests pass the test database or a transaction client.
  getDb?: () => DbClient
  // CORS allowlist (from FRONTEND_URL in production use).
  allowedOrigins?: readonly string[]
}

// Builds the Express app without opening a port, so tests can import it.
export function createApp({
  getDb = getPrisma,
  allowedOrigins = [],
}: AppOptions = {}) {
  const app = express()

  // Do not advertise the framework in response headers.
  app.disable('x-powered-by')

  app.use((_req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff')
    next()
  })
  app.use('/api', corsAllowlist(allowedOrigins))

  app.get(`${API_PREFIX}/health`, (_req, res) => {
    res.status(200).json({ status: 'ok' })
  })

  app.use(API_PREFIX, createPublicRouter(getDb))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
