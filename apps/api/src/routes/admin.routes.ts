import { ADMIN_API_PATHS } from '@maba-printing/shared'
import { type RequestHandler, Router } from 'express'
import * as catalog from '../admin/admin-catalog.controller.js'
import {
  dashboardHandler,
  downloadHandler,
  getOrderHandler,
  listOrdersHandler,
  notesHandler,
  paymentHandler,
  pricingHandler,
  statusHandler,
} from '../admin/admin-order.controller.js'
import {
  type PrincipalDeps,
  requireRole,
  resolvePrincipal,
} from '../middleware/authenticate.js'
import type { StorageService } from '../storage/storage-service.js'

export interface AdminRouterDeps extends PrincipalDeps {
  // null when order storage is not configured (downloads unavailable).
  storage: StorageService | null
  // Generous anti-abuse limits for authenticated Admin work.
  mutationLimiter: RequestHandler
  downloadLimiter: RequestHandler
  now: () => Date
}

// Admin API, mounted at /api/v1/admin behind the session and CSRF
// middleware. Every route — including unknown ones — first resolves the
// principal from the database and requires an active ADMIN: 401 signed
// out, 403 for MEMBERs.
export function createAdminRouter(deps: AdminRouterDeps): Router {
  const router = Router()
  router.use(resolvePrincipal(deps), requireRole('ADMIN'), deps.mutationLimiter)

  // Paths below are relative to /api/v1/admin.
  const rel = (path: string) => path.replace(/^\/admin/, '')
  const orders = rel(ADMIN_API_PATHS.orders)
  router.get(rel(ADMIN_API_PATHS.dashboard), dashboardHandler(deps.getDb))
  router.get(orders, listOrdersHandler(deps.getDb))
  router.get(`${orders}/:publicId`, getOrderHandler(deps.getDb))
  router.patch(`${orders}/:publicId/status`, statusHandler(deps))
  router.patch(`${orders}/:publicId/pricing`, pricingHandler(deps))
  router.patch(`${orders}/:publicId/notes`, notesHandler(deps))
  router.patch(`${orders}/:publicId/payment`, paymentHandler(deps))
  router.get(
    `${orders}/:publicId/files/:fileId/download`,
    deps.downloadLimiter,
    downloadHandler(deps),
  )

  // Catalog, locations and settings (no DELETE routes: lifecycle is isActive).
  const { getDb } = deps
  const productCategories = rel(ADMIN_API_PATHS.productCategories)
  router.get(productCategories, catalog.listProductCategoriesHandler(getDb))
  router.post(
    productCategories,
    catalog.createCategoryHandler(getDb, 'product'),
  )
  router.patch(
    `${productCategories}/:id`,
    catalog.updateCategoryHandler(getDb, 'product'),
  )
  const serviceCategories = rel(ADMIN_API_PATHS.serviceCategories)
  router.get(serviceCategories, catalog.listServiceCategoriesHandler(getDb))
  router.post(
    serviceCategories,
    catalog.createCategoryHandler(getDb, 'service'),
  )
  router.patch(
    `${serviceCategories}/:id`,
    catalog.updateCategoryHandler(getDb, 'service'),
  )
  const products = rel(ADMIN_API_PATHS.products)
  router.get(products, catalog.listProductsHandler(getDb))
  router.post(products, catalog.createProductHandler(getDb))
  router.patch(`${products}/:id`, catalog.updateProductHandler(getDb))
  const services = rel(ADMIN_API_PATHS.services)
  router.get(services, catalog.listServicesHandler(getDb))
  router.post(services, catalog.createServiceHandler(getDb))
  router.patch(`${services}/:id`, catalog.updateServiceHandler(getDb))
  const locations = rel(ADMIN_API_PATHS.locations)
  router.get(locations, catalog.listLocationsHandler(getDb))
  router.post(locations, catalog.createLocationHandler(getDb))
  router.patch(`${locations}/:id`, catalog.updateLocationHandler(getDb))
  router.put(
    `${locations}/:id/services/:serviceId`,
    catalog.locationServiceHandler(getDb),
  )
  const settings = rel(ADMIN_API_PATHS.settings)
  router.get(settings, catalog.getSettingsHandler(getDb))
  router.patch(settings, catalog.updateSettingsHandler(getDb))
  return router
}
