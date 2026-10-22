import type { Request, RequestHandler } from 'express'
import type { DbClient } from '../db/prisma.js'
import { AuthenticationError } from '../errors/app-error.js'
import { itemResponse, listResponse } from '../http/response.js'
import { parseBody } from '../validators/body.js'
import { noQuerySchema } from '../validators/public-query.validator.js'
import { parseParams, parseQuery } from '../validators/query.js'
import {
  type AdminContext,
  createCategory,
  createLocation,
  createProduct,
  createService,
  getSettings,
  listCategories,
  listLocations,
  listProducts,
  listServices,
  setLocationServiceAvailability,
  updateCategory,
  updateLocation,
  updateProduct,
  updateService,
  updateSettings,
} from './admin-catalog.service.js'
import {
  availabilitySchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  idParamSchema,
  locationCreateSchema,
  locationServiceParamSchema,
  locationUpdateSchema,
  productCreateSchema,
  productUpdateSchema,
  serviceCreateSchema,
  serviceUpdateSchema,
  settingsUpdateSchema,
} from './admin-catalog.validator.js'

type GetDb = () => DbClient

function context(req: Request, getDb: GetDb): AdminContext {
  if (req.principal?.role !== 'ADMIN') throw new AuthenticationError()
  return { db: getDb(), adminId: req.principal.id }
}

function idOf(req: Request): string {
  return parseParams(idParamSchema, { id: req.params.id }).id
}

function list<T>(
  load: (db: DbClient) => Promise<T[]>,
  getDb: GetDb,
): RequestHandler {
  return async (req, res) => {
    parseQuery(noQuerySchema, req.query)
    res.status(200).json(listResponse(await load(getDb())))
  }
}

export const listProductCategoriesHandler = (getDb: GetDb) =>
  list((db) => listCategories(db, 'product'), getDb)
export const listServiceCategoriesHandler = (getDb: GetDb) =>
  list((db) => listCategories(db, 'service'), getDb)
export const listProductsHandler = (getDb: GetDb) => list(listProducts, getDb)
export const listServicesHandler = (getDb: GetDb) => list(listServices, getDb)
export const listLocationsHandler = (getDb: GetDb) => list(listLocations, getDb)

export function createCategoryHandler(
  getDb: GetDb,
  kind: 'product' | 'service',
): RequestHandler {
  return async (req, res) => {
    const input = parseBody(categoryCreateSchema, req.body)
    res
      .status(201)
      .json(
        itemResponse(await createCategory(context(req, getDb), kind, input)),
      )
  }
}

export function updateCategoryHandler(
  getDb: GetDb,
  kind: 'product' | 'service',
): RequestHandler {
  return async (req, res) => {
    const id = idOf(req)
    const input = parseBody(categoryUpdateSchema, req.body)
    res
      .status(200)
      .json(
        itemResponse(
          await updateCategory(context(req, getDb), kind, id, input),
        ),
      )
  }
}

export function createProductHandler(getDb: GetDb): RequestHandler {
  return async (req, res) => {
    const input = parseBody(productCreateSchema, req.body)
    res
      .status(201)
      .json(itemResponse(await createProduct(context(req, getDb), input)))
  }
}

export function updateProductHandler(getDb: GetDb): RequestHandler {
  return async (req, res) => {
    const id = idOf(req)
    const input = parseBody(productUpdateSchema, req.body)
    res
      .status(200)
      .json(itemResponse(await updateProduct(context(req, getDb), id, input)))
  }
}

export function createServiceHandler(getDb: GetDb): RequestHandler {
  return async (req, res) => {
    const input = parseBody(serviceCreateSchema, req.body)
    res
      .status(201)
      .json(itemResponse(await createService(context(req, getDb), input)))
  }
}

export function updateServiceHandler(getDb: GetDb): RequestHandler {
  return async (req, res) => {
    const id = idOf(req)
    const input = parseBody(serviceUpdateSchema, req.body)
    res
      .status(200)
      .json(itemResponse(await updateService(context(req, getDb), id, input)))
  }
}

export function createLocationHandler(getDb: GetDb): RequestHandler {
  return async (req, res) => {
    const input = parseBody(locationCreateSchema, req.body)
    res
      .status(201)
      .json(itemResponse(await createLocation(context(req, getDb), input)))
  }
}

export function updateLocationHandler(getDb: GetDb): RequestHandler {
  return async (req, res) => {
    const id = idOf(req)
    const input = parseBody(locationUpdateSchema, req.body)
    res
      .status(200)
      .json(itemResponse(await updateLocation(context(req, getDb), id, input)))
  }
}

export function locationServiceHandler(getDb: GetDb): RequestHandler {
  return async (req, res) => {
    const { id, serviceId } = parseParams(locationServiceParamSchema, {
      id: req.params.id,
      serviceId: req.params.serviceId,
    })
    const { isAvailable } = parseBody(availabilitySchema, req.body)
    res
      .status(200)
      .json(
        itemResponse(
          await setLocationServiceAvailability(
            context(req, getDb),
            id,
            serviceId,
            isAvailable,
          ),
        ),
      )
  }
}

export function getSettingsHandler(getDb: GetDb): RequestHandler {
  return async (req, res) => {
    parseQuery(noQuerySchema, req.query)
    res.status(200).json(itemResponse(await getSettings(getDb())))
  }
}

export function updateSettingsHandler(getDb: GetDb): RequestHandler {
  return async (req, res) => {
    const input = parseBody(settingsUpdateSchema, req.body)
    res
      .status(200)
      .json(itemResponse(await updateSettings(context(req, getDb), input)))
  }
}
