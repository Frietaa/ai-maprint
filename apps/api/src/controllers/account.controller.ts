import type {
  ApiPageResponse,
  MemberOrderSummaryDto,
} from '@maba-printing/shared'
import type { Request, RequestHandler } from 'express'
import type { DbClient } from '../db/prisma.js'
import { AuthenticationError } from '../errors/app-error.js'
import { itemResponse } from '../http/response.js'
import { toProfileDto } from '../mappers/auth-dto.mapper.js'
import {
  toMemberOrderDetailDto,
  toMemberOrderSummaryDto,
} from '../mappers/order-dto.mapper.js'
import type { AuthPrincipal } from '../middleware/authenticate.js'
import { getOwnOrder, listOwnOrders } from '../services/order-query.service.js'
import { updateProfile } from '../services/profile.service.js'
import { updateProfileSchema } from '../validators/auth.validator.js'
import { parseBody } from '../validators/body.js'
import { noQuerySchema } from '../validators/public-query.validator.js'
import {
  memberOrderListQuerySchema,
  publicOrderIdParamSchema,
} from '../validators/order.validator.js'
import { parseParams, parseQuery } from '../validators/query.js'

// Routes using these handlers run requireRole first; this only narrows the
// type (and fails closed if that guard were ever missing).
function principalOf(req: Request): AuthPrincipal {
  if (!req.principal) throw new AuthenticationError()
  return req.principal
}

// GET /api/v1/account/profile
export const getProfileHandler: RequestHandler = (req, res) => {
  parseQuery(noQuerySchema, req.query)
  res.status(200).json(itemResponse(toProfileDto(principalOf(req).account)))
}

// PATCH /api/v1/account/profile — name and/or WhatsApp only.
export function updateProfileHandler(getDb: () => DbClient): RequestHandler {
  return async (req, res) => {
    const principal = principalOf(req)
    const input = parseBody(updateProfileSchema, req.body)
    const account = await updateProfile(getDb(), principal.id, input)
    res.status(200).json(itemResponse(toProfileDto(account)))
  }
}

// GET /api/v1/account/orders?page=&pageSize= — own orders, newest first.
export function listOwnOrdersHandler(getDb: () => DbClient): RequestHandler {
  return async (req, res) => {
    const principal = principalOf(req)
    const query = parseQuery(memberOrderListQuerySchema, req.query)
    const page = await listOwnOrders(getDb(), principal.id, query)
    const body: ApiPageResponse<MemberOrderSummaryDto> = {
      data: page.orders.map(toMemberOrderSummaryDto),
      meta: {
        page: page.page,
        pageSize: page.pageSize,
        total: page.total,
        totalPages: page.totalPages,
      },
    }
    res.status(200).json(body)
  }
}

// GET /api/v1/account/orders/:publicId — own order only (else 404).
export function getOwnOrderHandler(getDb: () => DbClient): RequestHandler {
  return async (req, res) => {
    const principal = principalOf(req)
    parseQuery(noQuerySchema, req.query)
    const { publicId } = parseParams(publicOrderIdParamSchema, req.params)
    const order = await getOwnOrder(getDb(), principal.id, publicId)
    res.status(200).json(itemResponse(toMemberOrderDetailDto(order)))
  }
}
