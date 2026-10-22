// One structured log line per request (Architecture §46): request ID,
// method, route TEMPLATE (e.g. "/api/v1/orders/track/:publicId" — never the
// concrete path, which can carry a Public Order ID), status and duration.
// No query strings, bodies, cookies or headers.
import type { Request, RequestHandler } from 'express'
import { logger } from '../observability/logger.js'

// Probe endpoints are logged at debug level to keep logs readable.
const PROBES = new Set(['/api/v1/health', '/api/v1/readiness'])

export function routeTemplate(req: Request): string {
  const path = (req.route as { path?: unknown } | undefined)?.path
  if (typeof path !== 'string') return 'unmatched'
  if (req.baseUrl) return `${req.baseUrl}${path}`
  // After an error left a router, Express has restored baseUrl: rebuild the
  // mount prefix from the leading segments of the original URL. Only the
  // static prefix is taken from the URL; every parameter (e.g. a Public
  // Order ID) lies in the part the template replaces.
  const template = path.split('/').filter(Boolean)
  const actual = (req.originalUrl.split('?')[0] ?? '')
    .split('/')
    .filter(Boolean)
  const prefix = actual.slice(0, Math.max(0, actual.length - template.length))
  return `/${[...prefix, ...template].join('/')}`
}

export const requestLog: RequestHandler = (req, res, next) => {
  const started = process.hrtime.bigint()
  res.on('finish', () => {
    const route = routeTemplate(req)
    const fields = {
      requestId: req.requestId,
      method: req.method,
      route,
      status: res.statusCode,
      durationMs:
        Math.round(Number(process.hrtime.bigint() - started) / 100_000) / 10,
    }
    if (res.statusCode >= 500) logger().error('http.request', fields)
    else if (PROBES.has(route)) logger().debug('http.request', fields)
    else logger().info('http.request', fields)
  })
  next()
}
