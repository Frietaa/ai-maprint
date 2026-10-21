import { ORDER_API_PATHS } from '@maba-printing/shared'
import { type RequestHandler, Router } from 'express'
import {
  createOrderHandler,
  type OrderControllerDeps,
} from '../controllers/order.controller.js'
import {
  type PrincipalDeps,
  resolvePrincipal,
} from '../middleware/authenticate.js'
import type { OrderRateLimiters } from '../middleware/rate-limit.js'

export interface OrderRouterDeps extends OrderControllerDeps, PrincipalDeps {
  rateLimiters: OrderRateLimiters
  // multipart/form-data reader for PRINTING orders with files; passes
  // other content types through untouched.
  multipart: RequestHandler
}

// Order submission (mounted under /api/v1 behind the session and CSRF
// middleware). Order of work: (CSRF, app level) → rate limit → principal →
// multipart files → validation and service. The session is optional: guests
// submit with the anonymous session that carries their CSRF token.
export function createOrderRouter(deps: OrderRouterDeps): Router {
  const router = Router()
  router.post(
    ORDER_API_PATHS.orders,
    deps.rateLimiters.submit,
    resolvePrincipal(deps),
    deps.multipart,
    createOrderHandler(deps),
  )
  return router
}
