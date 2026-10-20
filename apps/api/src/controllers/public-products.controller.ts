import type { RequestHandler } from 'express'
import type { DbClient } from '../db/prisma.js'
import { listResponse } from '../http/response.js'
import { listPublicProducts } from '../services/public-products.service.js'
import { productListQuerySchema } from '../validators/public-query.validator.js'
import { parseQuery } from '../validators/query.js'

// GET /api/v1/products?categoryId=&availability=
export function listProductsHandler(getDb: () => DbClient): RequestHandler {
  return async (req, res) => {
    const query = parseQuery(productListQuerySchema, req.query)
    const products = await listPublicProducts(getDb(), query)
    res.status(200).json(listResponse(products))
  }
}
