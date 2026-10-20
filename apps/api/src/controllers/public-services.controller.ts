import type { RequestHandler } from 'express'
import type { DbClient } from '../db/prisma.js'
import { listResponse } from '../http/response.js'
import { listPublicServices } from '../services/public-services.service.js'
import { serviceListQuerySchema } from '../validators/public-query.validator.js'
import { parseQuery } from '../validators/query.js'

// GET /api/v1/services?categoryId=&locationId=
export function listServicesHandler(getDb: () => DbClient): RequestHandler {
  return async (req, res) => {
    const query = parseQuery(serviceListQuerySchema, req.query)
    const services = await listPublicServices(getDb(), query)
    res.status(200).json(listResponse(services))
  }
}
