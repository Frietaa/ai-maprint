import { PUBLIC_API_PATHS } from '@maba-printing/shared'
import { Router } from 'express'
import { listLocationsHandler } from '../controllers/public-locations.controller.js'
import { listProductsHandler } from '../controllers/public-products.controller.js'
import { listServicesHandler } from '../controllers/public-services.controller.js'
import { getPublicSettingsHandler } from '../controllers/public-settings.controller.js'
import type { DbClient } from '../db/prisma.js'

// Public, unauthenticated, read-only endpoints (mounted under /api/v1).
// Express 5 forwards rejected handler promises to the error handler.
export function createPublicRouter(getDb: () => DbClient): Router {
  const router = Router()
  router.get(PUBLIC_API_PATHS.settings, getPublicSettingsHandler(getDb))
  router.get(PUBLIC_API_PATHS.locations, listLocationsHandler(getDb))
  router.get(PUBLIC_API_PATHS.services, listServicesHandler(getDb))
  router.get(PUBLIC_API_PATHS.products, listProductsHandler(getDb))
  return router
}
