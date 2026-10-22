import type { RequestHandler } from 'express'
import type { DbClient } from '../db/prisma.js'
import { listPublicServices } from '../services/public-services.service.js'
import { serviceListQuerySchema } from '../validators/public-query.validator.js'
import { parseQuery } from '../validators/query.js'

// GET /api/v1/services?categoryId=&locationId=&page=&pageSize=
export function listServicesHandler(getDb: () => DbClient): RequestHandler {
  return async (req, res) => {
    const query = parseQuery(serviceListQuerySchema, req.query)
    res.status(200).json(await listPublicServices(getDb(), query))
  }
}
