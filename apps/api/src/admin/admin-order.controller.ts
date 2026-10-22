import type {
  AdminOrderSummaryDto,
  ApiPageResponse,
} from '@maba-printing/shared'
import type { Request, RequestHandler } from 'express'
import type { DbClient } from '../db/prisma.js'
import { inTransaction } from '../db/transaction.js'
import {
  AppError,
  AuthenticationError,
  NotFoundError,
} from '../errors/app-error.js'
import { itemResponse } from '../http/response.js'
import type { StorageService } from '../storage/storage-service.js'
import { parseBody } from '../validators/body.js'
import { publicOrderIdParamSchema } from '../validators/order.validator.js'
import { noQuerySchema } from '../validators/public-query.validator.js'
import { parseParams, parseQuery } from '../validators/query.js'
import {
  toAdminDashboardDto,
  toAdminOrderDetailDto,
  toAdminOrderSummaryDto,
} from './admin-order.mapper.js'
import {
  dashboardFigures,
  findAdminOrder,
  findDownloadableFile,
  listAdminOrders,
} from './admin-order.repository.js'
import {
  type AdminCommandContext,
  changeOrderStatus,
  ORDER_NOT_FOUND,
  updateNotes,
  updatePayment,
  updatePricing,
} from './admin-order.service.js'
import {
  adminOrderListQuerySchema,
  fileIdParamSchema,
  updateNotesSchema,
  updatePaymentSchema,
  updatePricingSchema,
  updateStatusSchema,
} from './admin-order.validator.js'
import { AUDIT_ACTIONS, AUDIT_ENTITIES, recordAudit } from './audit.js'

export interface AdminOrderControllerDeps {
  getDb: () => DbClient
  storage: StorageService | null
  now: () => Date
}

// The router has already required an active ADMIN; this narrows the type.
function adminId(req: Request): string {
  if (req.principal?.role !== 'ADMIN') throw new AuthenticationError()
  return req.principal.id
}

function publicIdOf(req: Request): string {
  return parseParams(publicOrderIdParamSchema, {
    publicId: req.params.publicId,
  }).publicId
}

export function dashboardHandler(getDb: () => DbClient): RequestHandler {
  return async (req, res) => {
    parseQuery(noQuerySchema, req.query)
    res
      .status(200)
      .json(itemResponse(toAdminDashboardDto(await dashboardFigures(getDb()))))
  }
}

export function listOrdersHandler(getDb: () => DbClient): RequestHandler {
  return async (req, res) => {
    const query = parseQuery(adminOrderListQuerySchema, req.query)
    const { orders, total } = await listAdminOrders(getDb(), query)
    const body: ApiPageResponse<AdminOrderSummaryDto> = {
      data: orders.map(toAdminOrderSummaryDto),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    }
    res.status(200).json(body)
  }
}

async function respondWithOrder(
  db: DbClient,
  publicId: string,
  res: Parameters<RequestHandler>[1],
) {
  const order = await findAdminOrder(db, publicId)
  if (!order) throw new NotFoundError(ORDER_NOT_FOUND)
  res.status(200).json(itemResponse(toAdminOrderDetailDto(order)))
}

export function getOrderHandler(getDb: () => DbClient): RequestHandler {
  return async (req, res) => {
    parseQuery(noQuerySchema, req.query)
    await respondWithOrder(getDb(), publicIdOf(req), res)
  }
}

// Commands answer with the fresh order detail.
function command(
  deps: AdminOrderControllerDeps,
  run: (
    ctx: AdminCommandContext,
    req: Request,
    publicId: string,
  ) => Promise<void>,
): RequestHandler {
  return async (req, res) => {
    const publicId = publicIdOf(req)
    const ctx = { db: deps.getDb(), adminId: adminId(req), now: deps.now }
    await run(ctx, req, publicId)
    await respondWithOrder(ctx.db, publicId, res)
  }
}

export const statusHandler = (deps: AdminOrderControllerDeps) =>
  command(deps, (ctx, req, publicId) => {
    const { fromStatus, toStatus } = parseBody(updateStatusSchema, req.body)
    return changeOrderStatus(ctx, publicId, fromStatus, toStatus)
  })

export const pricingHandler = (deps: AdminOrderControllerDeps) =>
  command(deps, (ctx, req, publicId) =>
    updatePricing(ctx, publicId, parseBody(updatePricingSchema, req.body)),
  )

export const notesHandler = (deps: AdminOrderControllerDeps) =>
  command(deps, (ctx, req, publicId) =>
    updateNotes(
      ctx,
      publicId,
      parseBody(updateNotesSchema, req.body).adminNotes,
    ),
  )

export const paymentHandler = (deps: AdminOrderControllerDeps) =>
  command(deps, (ctx, req, publicId) =>
    updatePayment(ctx, publicId, parseBody(updatePaymentSchema, req.body)),
  )

// GET /admin/orders/:publicId/files/:fileId/download — streamed through
// StorageService as an attachment; the storage key and path never leave the
// server. Each successful access is audited (file id and size only).
export function downloadHandler(
  deps: AdminOrderControllerDeps,
): RequestHandler {
  return async (req, res) => {
    parseQuery(noQuerySchema, req.query)
    const { fileId } = parseParams(fileIdParamSchema, req.params)
    const publicId = publicIdOf(req)
    const actorId = adminId(req)
    if (!deps.storage) throw new AppError(503, 'File access is not available')

    const db = deps.getDb()
    const file = await findDownloadableFile(db, publicId, fileId)
    if (!file) throw new NotFoundError('File not found')

    let stream: Awaited<ReturnType<StorageService['download']>>
    try {
      stream = await deps.storage.download(file.storageKey)
    } catch {
      throw new NotFoundError('File not found')
    }

    try {
      await inTransaction(db, (tx) =>
        recordAudit(tx, {
          actorId,
          action: AUDIT_ACTIONS.orderFileDownloaded,
          entityType: AUDIT_ENTITIES.orderFile,
          entityId: file.id,
          metadata: { order: publicId, sizeBytes: file.sizeBytes },
        }),
      )
    } catch (error) {
      stream.destroy()
      throw error
    }

    // attachment(): Content-Disposition via the content-disposition package
    // (quoted ASCII fallback + RFC 5987 filename*), so the untrusted name
    // cannot inject headers; never rendered inline.
    res.attachment(file.originalName)
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': String(file.sizeBytes),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    })
    stream.on('error', () => {
      res.destroy()
    })
    stream.pipe(res)
  }
}
