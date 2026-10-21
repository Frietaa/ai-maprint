import type { RequestHandler } from 'express'
import type { DbClient } from '../db/prisma.js'
import { AppError } from '../errors/app-error.js'
import { itemResponse } from '../http/response.js'
import { toOrderReceiptDto } from '../mappers/order-dto.mapper.js'
import {
  type AcceptedUpload,
  type OrderSubmitter,
  submitOrder,
} from '../services/order.service.js'
import type { StorageService } from '../storage/storage-service.js'
import type { PublicOrderIdGenerator } from '../utils/public-order-id.js'
import { parseBody } from '../validators/body.js'
import {
  type CreateOrderInput,
  createOrderSchema,
} from '../validators/order.validator.js'

export interface OrderControllerDeps {
  getDb: () => DbClient
  // null when order submission is not configured (no storage).
  storage: StorageService | null
  generatePublicId: PublicOrderIdGenerator
  now: () => Date
}

// What the request carried: the order input and validated uploads. The
// multipart reader (upload.middleware.ts) sets `req.orderSubmission`;
// plain JSON requests are parsed here.
declare module 'express-serve-static-core' {
  interface Request {
    orderSubmission?: { input: CreateOrderInput; uploads: AcceptedUpload[] }
  }
}

// POST /api/v1/orders — Guest or MEMBER (session optional, CSRF required).
export function createOrderHandler(deps: OrderControllerDeps): RequestHandler {
  return async (req, res) => {
    if (!deps.storage) {
      throw new AppError(503, 'Order submission is not available')
    }
    const { input, uploads } = req.orderSubmission ?? {
      input: parseBody(createOrderSchema, req.body),
      uploads: [],
    }
    const submitter: OrderSubmitter | null = req.principal
      ? { id: req.principal.id, role: req.principal.role }
      : null

    const receipt = await submitOrder(
      {
        db: deps.getDb(),
        storage: deps.storage,
        generatePublicId: deps.generatePublicId,
        now: deps.now,
      },
      input,
      submitter,
      uploads,
    )
    res.status(201).json(itemResponse(toOrderReceiptDto(receipt)))
  }
}
