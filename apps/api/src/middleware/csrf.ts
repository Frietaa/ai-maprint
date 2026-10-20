// CSRF protection for cookie-authenticated requests (Architecture §20).
//
// Synchronizer token bound to the server session: GET /auth/csrf stores a
// random token in the session and returns it; every unsafe request must echo
// it in the X-CSRF-Token header. A cross-site page can make the browser send
// the cookie but cannot read the token. Sign-in endpoints are not exempt, so
// login CSRF is blocked too. The token rotates whenever the session ID does.
import { timingSafeEqual } from 'node:crypto'
import { CSRF_HEADER } from '@maba-printing/shared'
import type { RequestHandler } from 'express'
import { ForbiddenError } from '../errors/app-error.js'

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export const csrfProtection: RequestHandler = (req, _res, next) => {
  if (!UNSAFE_METHODS.has(req.method)) {
    next()
    return
  }
  const expected = req.session?.csrfToken
  const provided = req.get(CSRF_HEADER)
  if (!expected || !provided || !constantTimeEqual(expected, provided)) {
    next(new ForbiddenError('Invalid CSRF token'))
    return
  }
  next()
}

function constantTimeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}
