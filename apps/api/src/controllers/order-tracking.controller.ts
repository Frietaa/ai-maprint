import type { RequestHandler } from 'express'
import type { DbClient } from '../db/prisma.js'
import { itemResponse } from '../http/response.js'
import { toTrackedOrderDto } from '../mappers/order-dto.mapper.js'
import { trackOrder } from '../services/order-query.service.js'
import { publicOrderIdParamSchema } from '../validators/order.validator.js'
import { noQuerySchema } from '../validators/public-query.validator.js'
import { parseParams, parseQuery } from '../validators/query.js'

// GET /api/v1/orders/track/:publicId — exact ID only; malformed 400,
// unknown 404, safe DTO (no customer data, files, prices or actors).
export function trackOrderHandler(getDb: () => DbClient): RequestHandler {
  return async (req, res) => {
    parseQuery(noQuerySchema, req.query)
    const { publicId } = parseParams(publicOrderIdParamSchema, req.params)
    const order = await trackOrder(getDb(), publicId)
    res.set('Cache-Control', 'no-store')
    res.status(200).json(itemResponse(toTrackedOrderDto(order)))
  }
}
