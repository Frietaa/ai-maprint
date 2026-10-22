import { CSRF_HEADER, IDEMPOTENCY_KEY_HEADER } from '@maba-printing/shared'
import type { RequestHandler } from 'express'
import { REQUEST_ID_HEADER } from './request-id.js'

// Explicit credentialed CORS allowlist (Architecture §20, §42). Only listed
// origins get Access-Control-Allow-Origin — the exact origin, never "*" and
// never an unlisted, reflected one — together with
// Access-Control-Allow-Credentials so the session cookie can be sent.
// Requests from other origins are served without CORS headers, so browsers
// block cross-origin reads. Same-origin use (Vite dev proxy) needs no list.
// State-changing requests are additionally protected by the CSRF token.
export function corsAllowlist(
  allowedOrigins: readonly string[],
): RequestHandler {
  const allowed = new Set(allowedOrigins)

  return (req, res, next) => {
    const origin = req.get('origin')
    if (origin === undefined) {
      next()
      return
    }

    res.vary('Origin')
    if (!allowed.has(origin)) {
      next()
      return
    }

    res.set('Access-Control-Allow-Origin', origin)
    res.set('Access-Control-Allow-Credentials', 'true')
    res.set('Access-Control-Expose-Headers', REQUEST_ID_HEADER)
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, OPTIONS')
      res.set(
        'Access-Control-Allow-Headers',
        `Content-Type, ${CSRF_HEADER}, ${IDEMPOTENCY_KEY_HEADER}`,
      )
      res.set('Access-Control-Max-Age', '600')
      res.status(204).end()
      return
    }
    next()
  }
}
