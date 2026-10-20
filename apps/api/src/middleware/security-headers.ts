// Security response headers via helmet (Architecture §42), configured for a
// JSON-only API: nothing it serves is meant to be rendered, framed or
// embedded. The website's own headers (CSP for the SPA and Google Identity
// Services) belong to the frontend hosting and are set at deployment.
import type { RequestHandler } from 'express'
import helmet from 'helmet'

export function securityHeaders({ https }: { https: boolean }): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
    xFrameOptions: { action: 'deny' },
    // HSTS only when the API is served over HTTPS (production).
    strictTransportSecurity: https
      ? { maxAge: 365 * 24 * 60 * 60, includeSubDomains: true }
      : false,
  })
}
