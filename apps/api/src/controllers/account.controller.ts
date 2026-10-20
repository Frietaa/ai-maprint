import type { Request, RequestHandler } from 'express'
import type { DbClient } from '../db/prisma.js'
import { AuthenticationError } from '../errors/app-error.js'
import { itemResponse } from '../http/response.js'
import { toProfileDto } from '../mappers/auth-dto.mapper.js'
import type { AuthPrincipal } from '../middleware/authenticate.js'
import { updateProfile } from '../services/profile.service.js'
import { updateProfileSchema } from '../validators/auth.validator.js'
import { parseBody } from '../validators/body.js'
import { noQuerySchema } from '../validators/public-query.validator.js'
import { parseQuery } from '../validators/query.js'

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
