import { ACCOUNT_API_PATHS, ORDER_API_PATHS } from '@maba-printing/shared'
import { Router } from 'express'
import {
  getOwnOrderHandler,
  getProfileHandler,
  listOwnOrdersHandler,
  updateProfileHandler,
} from '../controllers/account.controller.js'
import {
  type PrincipalDeps,
  requireRole,
  resolvePrincipal,
} from '../middleware/authenticate.js'

// Member account endpoints (mounted under /api/v1 behind the session and
// CSRF middleware): signed-in MEMBERs only (401 signed out, 403 other
// roles). Orders are always looked up for the signed-in member.
export function createAccountRouter(deps: PrincipalDeps): Router {
  const router = Router()
  const memberOnly = [resolvePrincipal(deps), requireRole('MEMBER')]
  router.get(ACCOUNT_API_PATHS.profile, ...memberOnly, getProfileHandler)
  router.patch(
    ACCOUNT_API_PATHS.profile,
    ...memberOnly,
    updateProfileHandler(deps.getDb),
  )
  router.get(
    ORDER_API_PATHS.accountOrders,
    ...memberOnly,
    listOwnOrdersHandler(deps.getDb),
  )
  router.get(
    `${ORDER_API_PATHS.accountOrders}/:publicId`,
    ...memberOnly,
    getOwnOrderHandler(deps.getDb),
  )
  return router
}
