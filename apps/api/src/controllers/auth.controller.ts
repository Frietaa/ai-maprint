import type { AuthUserDto, CsrfTokenDto } from '@maba-printing/shared'
import type { RequestHandler } from 'express'
import type { DbClient } from '../db/prisma.js'
import { AppError } from '../errors/app-error.js'
import { itemResponse } from '../http/response.js'
import { toAuthUserDto } from '../mappers/auth-dto.mapper.js'
import { newCsrfToken, type SessionManager } from '../middleware/session.js'
import {
  authenticateWithGoogle,
  authenticateWithPassword,
  registerMember,
} from '../services/auth.service.js'
import type { GoogleIdentityVerifier } from '../services/google-identity.js'
import {
  googleLoginSchema,
  loginSchema,
  registerSchema,
} from '../validators/auth.validator.js'
import { parseBody } from '../validators/body.js'
import { noQuerySchema } from '../validators/public-query.validator.js'
import { parseQuery } from '../validators/query.js'

export interface AuthControllerDeps {
  getDb: () => DbClient
  sessions: SessionManager
  // null when GOOGLE_CLIENT_ID is not configured.
  googleVerifier: GoogleIdentityVerifier | null
}

// GET /api/v1/auth/csrf — returns the session's CSRF token, creating the
// (anonymous) session on first use. The web app calls this only right before
// an unsafe request, so plain browsing never creates a session.
export const csrfTokenHandler: RequestHandler = (req, res) => {
  parseQuery(noQuerySchema, req.query)
  req.session.csrfToken ??= newCsrfToken()
  const body: CsrfTokenDto = { csrfToken: req.session.csrfToken }
  res.status(200).json(itemResponse(body))
}

// POST /api/v1/auth/register — creates a MEMBER and signs it in under a new
// session ID.
export function registerHandler({
  getDb,
  sessions,
}: AuthControllerDeps): RequestHandler {
  return async (req, res) => {
    const input = parseBody(registerSchema, req.body)
    const account = await registerMember(getDb(), input)
    await sessions.signIn(req, account.id)
    res.status(201).json(itemResponse(toAuthUserDto(account)))
  }
}

// POST /api/v1/auth/login — email + password; new session ID on success.
export function loginHandler({
  getDb,
  sessions,
}: AuthControllerDeps): RequestHandler {
  return async (req, res) => {
    const input = parseBody(loginSchema, req.body)
    const account = await authenticateWithPassword(getDb(), input)
    await sessions.signIn(req, account.id)
    res.status(200).json(itemResponse(toAuthUserDto(account)))
  }
}

// GET /api/v1/auth/me — the signed-in account, or `data: null` (200) when no
// valid session exists. Runs after resolvePrincipal.
export const currentUserHandler: RequestHandler = (req, res) => {
  parseQuery(noQuerySchema, req.query)
  const user: AuthUserDto | null = req.principal
    ? toAuthUserDto(req.principal.account)
    : null
  res.status(200).json(itemResponse(user))
}

// POST /api/v1/auth/logout — destroys the server-side session (store row)
// and clears the cookie. CSRF-protected; safe to repeat.
export function logoutHandler({
  sessions,
}: AuthControllerDeps): RequestHandler {
  return async (req, res) => {
    await sessions.end(req, res)
    res.status(200).json(itemResponse(null))
  }
}

// POST /api/v1/auth/google — Google Identity Services ID token, verified
// server-side; new session ID on success. 503 when Google Sign-In is not
// configured (email/password sign-in is unaffected).
export function googleLoginHandler({
  getDb,
  sessions,
  googleVerifier,
}: AuthControllerDeps): RequestHandler {
  return async (req, res) => {
    if (!googleVerifier) {
      throw new AppError(503, 'Google Sign-In is not available')
    }
    const { credential } = parseBody(googleLoginSchema, req.body)
    const account = await authenticateWithGoogle(
      getDb(),
      googleVerifier,
      credential,
    )
    await sessions.signIn(req, account.id)
    res.status(200).json(itemResponse(toAuthUserDto(account)))
  }
}
