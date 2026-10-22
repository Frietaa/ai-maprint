// Admin order use cases. Framework-free. Every command runs in one
// transaction together with its audit row (and, for status changes, the
// history row), so no privileged change can commit without its record.
// The customer's original request (snapshot, description, files, items,
// requested time) is never modified here.
import { canTransition, pickupFeeFor } from '@maba-printing/shared'
import type { DbClient } from '../db/prisma.js'
import { inTransaction } from '../db/transaction.js'
import {
  AppError,
  NotFoundError,
  ValidationError,
} from '../errors/app-error.js'
import type { OrderStatus } from '../generated/prisma/client.js'
import {
  appendStatusHistory,
  findOrderState,
  updateAdminNotes,
  updateLaptopPickup,
  updateOrderPricing,
  updateStatusIfCurrent,
  upsertPayment,
} from './admin-order.repository.js'
import type {
  UpdatePaymentInput,
  UpdatePricingInput,
} from './admin-order.validator.js'
import { AUDIT_ACTIONS, AUDIT_ENTITIES, changes, recordAudit } from './audit.js'

export const ORDER_NOT_FOUND = 'Order not found'
export const STATUS_CHANGED_MESSAGE = 'Order status has changed'
export const TRANSITION_NOT_ALLOWED_MESSAGE = 'Status change not allowed'

export interface AdminCommandContext {
  db: DbClient
  adminId: string
  now: () => Date
}

async function loadOrder(tx: DbClient, publicId: string) {
  const order = await findOrderState(tx, publicId)
  if (!order) throw new NotFoundError(ORDER_NOT_FOUND)
  return order
}

// Approved transitions only (PRD §14). `fromStatus` is the status the Admin
// saw: if the order moved on meanwhile (another Admin), the change is
// refused with 409 instead of silently overwriting.
export function changeOrderStatus(
  { db, adminId, now }: AdminCommandContext,
  publicId: string,
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
): Promise<void> {
  if (!canTransition(fromStatus, toStatus)) {
    return Promise.reject(new AppError(409, TRANSITION_NOT_ALLOWED_MESSAGE))
  }
  return inTransaction(db, async (tx) => {
    const order = await loadOrder(tx, publicId)
    if (order.status !== fromStatus) {
      throw new AppError(409, STATUS_CHANGED_MESSAGE)
    }
    const completedAt = toStatus === 'COMPLETED' ? now() : null
    const changed = await updateStatusIfCurrent(
      tx,
      order.id,
      fromStatus,
      toStatus,
      completedAt,
    )
    if (!changed) throw new AppError(409, STATUS_CHANGED_MESSAGE)
    await appendStatusHistory(tx, {
      orderId: order.id,
      fromStatus,
      toStatus,
      changedByUserId: adminId,
    })
    await recordAudit(tx, {
      actorId: adminId,
      action: AUDIT_ACTIONS.orderStatusUpdated,
      entityType: AUDIT_ENTITIES.order,
      entityId: publicId,
      metadata: { from: fromStatus, to: toStatus },
    })
  })
}

// Order-level pricing. Item snapshots stay as submitted; a final total never
// implies payment. distanceKm applies to laptop PICKUP orders only and the
// pickup fee is computed here (≤ 5 km free, Rp2.000 per started extra km).
export function updatePricing(
  { db, adminId }: AdminCommandContext,
  publicId: string,
  input: UpdatePricingInput,
): Promise<void> {
  return inTransaction(db, async (tx) => {
    const order = await loadOrder(tx, publicId)
    const metadata: Record<string, unknown> = changes(
      { estimatedTotal: order.estimatedTotal, finalTotal: order.finalTotal },
      { estimatedTotal: input.estimatedTotal, finalTotal: input.finalTotal },
    )

    if (input.distanceKm !== undefined) {
      const laptop = order.laptopServiceRequest
      if (
        order.type !== 'LAPTOP_SERVICE' ||
        laptop?.handoverMethod !== 'PICKUP'
      ) {
        throw new ValidationError({
          distanceKm: ['Only for laptop service pickup orders'],
        })
      }
      const pickupFee =
        input.distanceKm === null ? null : pickupFeeFor(input.distanceKm)
      await updateLaptopPickup(tx, order.id, {
        distanceKm: input.distanceKm,
        pickupFee,
      })
      Object.assign(
        metadata,
        changes(
          {
            distanceKm: laptop.distanceKm ? laptop.distanceKm.toNumber() : null,
            pickupFee: laptop.pickupFee,
          },
          { distanceKm: input.distanceKm, pickupFee },
        ),
      )
    }

    if (input.estimatedTotal !== undefined || input.finalTotal !== undefined) {
      await updateOrderPricing(tx, order.id, {
        ...(input.estimatedTotal !== undefined && {
          estimatedTotal: input.estimatedTotal,
        }),
        ...(input.finalTotal !== undefined && { finalTotal: input.finalTotal }),
      })
    }
    await recordAudit(tx, {
      actorId: adminId,
      action: AUDIT_ACTIONS.orderPricingUpdated,
      entityType: AUDIT_ENTITIES.order,
      entityId: publicId,
      metadata: metadata as Record<string, never>,
    })
  })
}

// Internal notes. The audit row records only what kind of change happened,
// never the note text.
export function updateNotes(
  { db, adminId }: AdminCommandContext,
  publicId: string,
  adminNotes: string | null,
): Promise<void> {
  return inTransaction(db, async (tx) => {
    const order = await loadOrder(tx, publicId)
    const change =
      order.adminNotes === adminNotes
        ? 'unchanged'
        : adminNotes === null
          ? 'cleared'
          : order.adminNotes === null
            ? 'added'
            : 'changed'
    await updateAdminNotes(tx, order.id, adminNotes)
    await recordAudit(tx, {
      actorId: adminId,
      action: AUDIT_ACTIONS.orderAdminNotesUpdated,
      entityType: AUDIT_ENTITIES.order,
      entityId: publicId,
      metadata: { change },
    })
  })
}

// Manual payment recording (no gateway, QRIS never auto-confirms). The
// confirmation (who, when) is server-owned: set when the status becomes
// PAID, kept while it stays PAID, cleared when it leaves PAID.
export function updatePayment(
  { db, adminId, now }: AdminCommandContext,
  publicId: string,
  input: UpdatePaymentInput,
): Promise<void> {
  return inTransaction(db, async (tx) => {
    const order = await loadOrder(tx, publicId)
    const previous = order.payment
    const stillPaid = input.status === 'PAID' && previous?.status === 'PAID'
    const confirmation =
      input.status !== 'PAID'
        ? { confirmedById: null, confirmedAt: null }
        : stillPaid && previous
          ? {
              confirmedById: previous.confirmedById,
              confirmedAt: previous.confirmedAt,
            }
          : { confirmedById: adminId, confirmedAt: now() }

    await upsertPayment(tx, order.id, {
      method: input.method,
      status: input.status,
      amount: input.amount,
      ...confirmation,
    })
    await recordAudit(tx, {
      actorId: adminId,
      action: AUDIT_ACTIONS.paymentUpdated,
      entityType: AUDIT_ENTITIES.payment,
      entityId: publicId,
      metadata: {
        created: previous === null,
        ...changes(
          {
            method: previous?.method ?? null,
            status: previous?.status ?? null,
            amount: previous?.amount ?? null,
          },
          { method: input.method, status: input.status, amount: input.amount },
        ),
        confirmation:
          input.status !== 'PAID'
            ? previous?.status === 'PAID'
              ? 'cleared'
              : 'none'
            : stillPaid
              ? 'kept'
              : 'confirmed',
      },
    })
  })
}
