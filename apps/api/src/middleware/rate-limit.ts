// Rate limits (PRD §16, §26, Architecture §42), per client IP (IPv6 grouped
// by /56, the library default).
//
// Counter storage (KI-015): RATE_LIMIT_STORE=postgres shares the counters
// between all API instances and across restarts (rate-limit-store.ts);
// `memory` (development/tests) keeps them in this process only. Behind a
// reverse proxy, TRUST_PROXY must be set so the client IP is right.
import type { RequestHandler } from 'express'
import { rateLimit } from 'express-rate-limit'
import { AppError } from '../errors/app-error.js'
import type { RateLimitStoreFactory } from './rate-limit-store.js'

// No factory = the library's in-process memory store.
const memoryStores: RateLimitStoreFactory = () => undefined

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

interface LimiterOptions {
  windowMs: number
  limit: number
  skipSuccessfulRequests?: boolean
  safeMethodsExempt?: boolean
  // Shared store for this limiter, or undefined for the memory store.
  store?: ReturnType<RateLimitStoreFactory>
}

function limiter({
  windowMs,
  limit,
  skipSuccessfulRequests = false,
  safeMethodsExempt = false,
  store,
}: LimiterOptions): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    ...(store && { store }),
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
  stores: RateLimitStoreFactory = memoryStores,
): AuthRateLimiters {
  return {
    signIn: limiter({
      windowMs: limits.windowMs,
      limit: limits.signInFailures,
      skipSuccessfulRequests: true,
      store: stores('auth-sign-in'),
    }),
    register: limiter({
      windowMs: limits.windowMs,
      limit: limits.registrations,
      store: stores('auth-register'),
    }),
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
  stores: RateLimitStoreFactory = memoryStores,
): OrderRateLimiters {
  return {
    submit: limiter({
      windowMs: limits.windowMs,
      limit: limits.submissions,
      store: stores('order-submit'),
    }),
    track: limiter({
      windowMs: limits.windowMs,
      limit: limits.trackingLookups,
      store: stores('order-track'),
    }),
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
  stores: RateLimitStoreFactory = memoryStores,
): { mutations: RequestHandler; downloads: RequestHandler } {
  return {
    mutations: limiter({
      windowMs: limits.windowMs,
      limit: limits.mutations,
      safeMethodsExempt: true,
      store: stores('admin-mutation'),
    }),
    downloads: limiter({
      windowMs: limits.windowMs,
      limit: limits.downloads,
      store: stores('admin-download'),
    }),
  }
}
