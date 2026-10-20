import type { RequestHandler } from 'express'

// Explicit CORS allowlist for the public read API (Architecture §20, §42).
// Only listed origins get Access-Control-Allow-Origin (never "*"); no
// credentials are allowed because Phase-02 endpoints are unauthenticated.
// Requests from other origins are served without CORS headers, so browsers
// block cross-origin reads. Same-origin use (Vite dev proxy) needs no list.
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
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
      res.set('Access-Control-Allow-Headers', 'Content-Type')
      res.set('Access-Control-Max-Age', '600')
      res.status(204).end()
      return
    }
    next()
  }
}
