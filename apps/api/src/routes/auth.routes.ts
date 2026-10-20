import { AUTH_API_PATHS } from '@maba-printing/shared'
import { Router } from 'express'
import {
  type AuthControllerDeps,
  csrfTokenHandler,
  currentUserHandler,
  googleLoginHandler,
  loginHandler,
  logoutHandler,
  registerHandler,
} from '../controllers/auth.controller.js'
import { resolvePrincipal } from '../middleware/authenticate.js'
import type { AuthRateLimiters } from '../middleware/rate-limit.js'

export interface AuthRouterDeps extends AuthControllerDeps {
  rateLimiters: AuthRateLimiters
}

// Authentication endpoints (mounted under /api/v1 behind the session and
// CSRF middleware). The principal is resolved only where it is used: sign-in
// routes replace the session anyway.
export function createAuthRouter(deps: AuthRouterDeps): Router {
  const router = Router()
  router.get(AUTH_API_PATHS.csrf, csrfTokenHandler)
  const { signIn, register } = deps.rateLimiters
  router.post(AUTH_API_PATHS.register, register, registerHandler(deps))
  router.post(AUTH_API_PATHS.login, signIn, loginHandler(deps))
  router.post(AUTH_API_PATHS.google, signIn, googleLoginHandler(deps))
  router.post(AUTH_API_PATHS.logout, logoutHandler(deps))
  router.get(AUTH_API_PATHS.me, resolvePrincipal(deps), currentUserHandler)
  return router
}
