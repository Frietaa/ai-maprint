import {
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENCY_KEY_PATTERN,
  IDEMPOTENT_REPLAY_HEADER,
} from '@maba-printing/shared'
import type { RequestHandler } from 'express'
import type { DbClient } from '../db/prisma.js'
import { AppError, ValidationError } from '../errors/app-error.js'
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

// Optional Idempotency-Key header (KI-020): absent = no duplicate check.
function readIdempotencyKey(raw: string | undefined): string | null {
  if (raw === undefined) return null
  if (!IDEMPOTENCY_KEY_PATTERN.test(raw)) {
    throw new ValidationError({ idempotencyKey: ['Invalid idempotency key'] })
  }
  return raw
}

// POST /api/v1/orders — Guest or MEMBER (session optional, CSRF required).
// 201 for a new order; 200 + Idempotent-Replayed for a repeated submission.
export function createOrderHandler(deps: OrderControllerDeps): RequestHandler {
  return async (req, res) => {
    if (!deps.storage) {
      throw new AppError(503, 'Order submission is not available')
    }
    const idempotencyKey = readIdempotencyKey(req.get(IDEMPOTENCY_KEY_HEADER))
    const { input, uploads } = req.orderSubmission ?? {
      input: parseBody(createOrderSchema, req.body),
      uploads: [],
    }
    const submitter: OrderSubmitter | null = req.principal
      ? { id: req.principal.id, role: req.principal.role }
      : null

    const { receipt, replayed } = await submitOrder(
      {
        db: deps.getDb(),
        storage: deps.storage,
        generatePublicId: deps.generatePublicId,
        now: deps.now,
      },
      input,
      submitter,
      uploads,
      idempotencyKey,
    )
    if (replayed) res.set(IDEMPOTENT_REPLAY_HEADER, 'true')
    res
      .status(replayed ? 200 : 201)
      .json(itemResponse(toOrderReceiptDto(receipt)))
  }
}
