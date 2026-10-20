import type { RequestHandler } from 'express'
import type { DbClient } from '../db/prisma.js'
import { itemResponse } from '../http/response.js'
import { getPublicSettings } from '../services/public-settings.service.js'
import { noQuerySchema } from '../validators/public-query.validator.js'
import { parseQuery } from '../validators/query.js'

// GET /api/v1/public/settings
export function getPublicSettingsHandler(
  getDb: () => DbClient,
): RequestHandler {
  return async (req, res) => {
    parseQuery(noQuerySchema, req.query)
    const settings = await getPublicSettings(getDb())
    res.status(200).json(itemResponse(settings))
  }
}
