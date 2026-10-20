import type { RequestHandler } from 'express'
import type { DbClient } from '../db/prisma.js'
import { listResponse } from '../http/response.js'
import { listPublicLocations } from '../services/public-locations.service.js'
import { noQuerySchema } from '../validators/public-query.validator.js'
import { parseQuery } from '../validators/query.js'

// GET /api/v1/locations
export function listLocationsHandler(getDb: () => DbClient): RequestHandler {
  return async (req, res) => {
    parseQuery(noQuerySchema, req.query)
    const locations = await listPublicLocations(getDb())
    res.status(200).json(listResponse(locations))
  }
}
