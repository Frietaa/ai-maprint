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
  safeMethodsExempt = false,
): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    ...(safeMethodsExempt && {
      skip: (req) => req.method === 'GET' || req.method === 'HEAD',
    }),
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

// Order endpoints have their own budgets (never shared with sign-in).
export interface OrderRateLimits {
  windowMs: number
  // Order submissions per window.
  submissions: number
  // Public tracking lookups per window. IDs carry 65 random bits, so this
  // is defense in depth, not the main protection against guessing.
  trackingLookups: number
}

export const DEFAULT_ORDER_RATE_LIMITS: OrderRateLimits = {
  windowMs: 15 * 60 * 1000,
  submissions: 10,
  trackingLookups: 60,
}

export interface OrderRateLimiters {
  submit: RequestHandler
  track: RequestHandler
}

export function createOrderRateLimiters(
  limits: OrderRateLimits = DEFAULT_ORDER_RATE_LIMITS,
): OrderRateLimiters {
  return {
    submit: limiter(limits.windowMs, limits.submissions, false),
    track: limiter(limits.windowMs, limits.trackingLookups, false),
  }
}

// Authenticated Admin work: generous anti-abuse budgets (session, role and
// CSRF are the real protection). Mutations only; reads are not limited.
export interface AdminRateLimits {
  windowMs: number
  mutations: number
  downloads: number
}

export const DEFAULT_ADMIN_RATE_LIMITS: AdminRateLimits = {
  windowMs: 15 * 60 * 1000,
  mutations: 300,
  downloads: 200,
}

export function createAdminRateLimiters(
  limits: AdminRateLimits = DEFAULT_ADMIN_RATE_LIMITS,
): { mutations: RequestHandler; downloads: RequestHandler } {
  return {
    mutations: limiter(limits.windowMs, limits.mutations, false, true),
    downloads: limiter(limits.windowMs, limits.downloads, false),
  }
}
