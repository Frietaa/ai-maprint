// Rate limits for the authentication endpoints (PRD §26, Architecture §42),
// per client IP (IPv6 grouped by /56, the library default).
//
// The in-process memory store is the library's documented default and fits
// the current single-instance deployment. Several API instances would need a
// shared store (e.g. PostgreSQL/Redis) — a deployment-phase concern.
// Behind a reverse proxy, TRUST_PROXY must be set so the client IP is right.
import type { RequestHandler } from 'express'
import { rateLimit } from 'express-rate-limit'
import { AppError } from '../errors/app-error.js'

export interface AuthRateLimits {
  windowMs: number
  // Failed password/Google sign-in attempts per window (successful ones do
  // not count), shared by both endpoints.
  signInFailures: number
  // Registration attempts per window.
  registrations: number
}

// Generous enough for shared campus networks, tight enough to make online
// password guessing slow (Argon2id makes every guess costly as well).
export const DEFAULT_AUTH_RATE_LIMITS: AuthRateLimits = {
  windowMs: 15 * 60 * 1000,
  signInFailures: 20,
  registrations: 10,
}

export interface AuthRateLimiters {
  signIn: RequestHandler
  register: RequestHandler
}

function limiter(
  windowMs: number,
  limit: number,
  skipSuccessfulRequests: boolean,
): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // Same error shape as every other API error; nothing about whether the
    // credentials would have been valid.
    handler: (_req, _res, next) => {
      next(new AppError(429, 'Too many requests'))
    },
  })
}

export function createAuthRateLimiters(
  limits: AuthRateLimits = DEFAULT_AUTH_RATE_LIMITS,
): AuthRateLimiters {
  return {
    signIn: limiter(limits.windowMs, limits.signInFailures, true),
    register: limiter(limits.windowMs, limits.registrations, false),
  }
}
