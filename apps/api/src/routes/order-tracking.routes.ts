import { ORDER_API_PATHS } from '@maba-printing/shared'
import { type RequestHandler, Router } from 'express'
import { trackOrderHandler } from '../controllers/order-tracking.controller.js'
import type { DbClient } from '../db/prisma.js'

export interface OrderTrackingRouterDeps {
  getDb: () => DbClient
  // Tracking-specific rate limit (separate from submission and sign-in).
  track: RequestHandler
}

// Public guest tracking by exact Public Order ID (mounted under /api/v1 in
// the session-free public section).
export function createOrderTrackingRouter({
  getDb,
  track,
}: OrderTrackingRouterDeps): Router {
  const router = Router()
  router.get(
    `${ORDER_API_PATHS.track}/:publicId`,
    track,
    trackOrderHandler(getDb),
  )
  return router
}
