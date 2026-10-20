// Authentication and authorization middleware (Architecture §19).
//
// The session only says *which* user signed in and *when*. Role and active
// state are re-read from the database on every request that needs them, so
// a role change or deactivation takes effect immediately and no client-side
// claim is ever trusted.
import type { RequestHandler } from 'express'
import type { DbClient } from '../db/prisma.js'
import { AuthenticationError, ForbiddenError } from '../errors/app-error.js'
import type { UserRole } from '../generated/prisma/client.js'
import {
  findUserById,
  type UserAccount,
} from '../repositories/user.repository.js'
import { SESSION_MAX_AGE_MS, type SessionManager } from './session.js'

// The signed-in account for this request (no password hash, no Google ID).
export interface AuthPrincipal {
  id: string
  role: UserRole
  account: UserAccount
}

declare module 'express-serve-static-core' {
  interface Request {
    // Set by resolvePrincipal: the active account, or null when signed out.
    principal?: AuthPrincipal | null
  }
}

export interface PrincipalDeps {
  getDb: () => DbClient
  sessions: SessionManager
}

// Loads the principal from the session. A session pointing to a missing or
// deactivated user, or older than the absolute lifetime, is destroyed and
// its cookie cleared — the request continues as signed out.
export function resolvePrincipal({
  getDb,
  sessions,
}: PrincipalDeps): RequestHandler {
  return async (req, res, next) => {
    req.principal = null
    const { userId, authenticatedAt } = req.session
    if (userId === undefined) {
      next()
      return
    }

    const withinLifetime =
      authenticatedAt !== undefined &&
      Date.now() - authenticatedAt <= SESSION_MAX_AGE_MS
    const account = withinLifetime ? await findUserById(getDb(), userId) : null
    if (!account?.isActive) {
      await sessions.end(req, res)
      next()
      return
    }

    req.principal = { id: account.id, role: account.role, account }
    next()
  }
}

// 401 unless a principal was resolved.
export const requireAuthenticated: RequestHandler = (req, _res, next) => {
  next(req.principal ? undefined : new AuthenticationError())
}

// 401 when signed out, 403 when signed in with another role.
export function requireRole(role: UserRole): RequestHandler {
  return (req, _res, next) => {
    if (!req.principal) {
      next(new AuthenticationError())
      return
    }
    next(req.principal.role === role ? undefined : new ForbiddenError())
  }
}
