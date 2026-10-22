// Persistence access for Admin order management — use-case functions with
// explicit selects. Never selects password hashes, Google IDs or session
// data; storage keys only for the download lookup, which never leaves the
// API.
import type { DbClient } from '../db/prisma.js'
import type {
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '../generated/prisma/client.js'
import type { AdminOrderListQuery } from './admin-order.validator.js'

export const adminSummarySelect = {
  publicId: true,
  type: true,
  status: true,
  customerName: true,
  requestedCompletionAt: true,
  estimatedTotal: true,
  finalTotal: true,
  createdAt: true,
  location: { select: { id: true, name: true } },
  payment: { select: { status: true } },
} satisfies Prisma.OrderSelect

export type AdminOrderSummaryRecord = Prisma.OrderGetPayload<{
  select: typeof adminSummarySelect
}>

function whereFor(query: Omit<AdminOrderListQuery, 'page' | 'pageSize'>) {
  const where: Prisma.OrderWhereInput = {}
  if (query.status) where.status = query.status
  if (query.type) where.type = query.type
  if (query.locationId) where.locationId = query.locationId
  if (query.publicId) where.publicId = query.publicId
  if (query.paymentStatus === 'UNPAID') {
    // No payment recorded yet counts as unpaid.
    where.OR = [
      { payment: { is: null } },
      { payment: { is: { status: 'UNPAID' } } },
    ]
  } else if (query.paymentStatus) {
    where.payment = { is: { status: query.paymentStatus } }
  }
  return where
}

const newestFirst = [
  { createdAt: 'desc' },
  { publicId: 'desc' },
] satisfies Prisma.OrderOrderByWithRelationInput[]

export async function listAdminOrders(
  db: DbClient,
  query: AdminOrderListQuery,
): Promise<{ orders: AdminOrderSummaryRecord[]; total: number }> {
  const where = whereFor(query)
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      select: adminSummarySelect,
      orderBy: newestFirst,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    db.order.count({ where }),
  ])
  return { orders, total }
}

export async function dashboardFigures(db: DbClient) {
  const [byStatus, pendingPayments, recent] = await Promise.all([
    db.order.groupBy({ by: ['status'], _count: { _all: true } }),
    db.payment.count({ where: { status: 'PENDING_CONFIRMATION' } }),
    db.order.findMany({
      select: adminSummarySelect,
      orderBy: newestFirst,
      take: 5,
    }),
  ])
  return { byStatus, pendingPayments, recent }
}

const actorSelect = { select: { name: true } } as const

export const adminDetailSelect = {
  ...adminSummarySelect,
  id: true,
  customerWhatsapp: true,
  customerEmail: true,
  description: true,
  adminNotes: true,
  completedAt: true,
  updatedAt: true,
  user: { select: { name: true, email: true } },
  location: { select: { id: true, name: true, address: true } },
  items: {
    select: {
      nameSnapshot: true,
      descriptionSnapshot: true,
      quantity: true,
      unitPriceSnapshot: true,
      subtotal: true,
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
  laptopServiceRequest: {
    select: {
      complaint: true,
      handoverMethod: true,
      handoverAt: true,
      pickupAddress: true,
      distanceKm: true,
      pickupFee: true,
    },
  },
  softwareInstallationRequest: {
    select: { softwareName: true, requirements: true, licenseNote: true },
  },
  payment: {
    select: {
      method: true,
      status: true,
      amount: true,
      confirmedAt: true,
      confirmedBy: actorSelect,
    },
  },
  files: {
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
      deletedAt: true,
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
  statusHistory: {
    select: {
      fromStatus: true,
      toStatus: true,
      createdAt: true,
      changedBy: actorSelect,
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.OrderSelect

export type AdminOrderDetailRecord = Prisma.OrderGetPayload<{
  select: typeof adminDetailSelect
}>

export function findAdminOrder(
  db: DbClient,
  publicId: string,
): Promise<AdminOrderDetailRecord | null> {
  return db.order.findUnique({ where: { publicId }, select: adminDetailSelect })
}

// Minimal state for commands (read inside the command's transaction).
export function findOrderState(db: DbClient, publicId: string) {
  return db.order.findUnique({
    where: { publicId },
    select: {
      id: true,
      type: true,
      status: true,
      estimatedTotal: true,
      finalTotal: true,
      adminNotes: true,
      laptopServiceRequest: {
        select: { handoverMethod: true, distanceKm: true, pickupFee: true },
      },
      payment: {
        select: {
          method: true,
          status: true,
          amount: true,
          confirmedById: true,
          confirmedAt: true,
        },
      },
    },
  })
}

// Optimistic concurrency: only changes the row while it still has the
// expected status. Returns false when another change got there first.
export async function updateStatusIfCurrent(
  db: DbClient,
  orderId: string,
  from: OrderStatus,
  to: OrderStatus,
  completedAt: Date | null,
): Promise<boolean> {
  const result = await db.order.updateMany({
    where: { id: orderId, status: from },
    data: { status: to, ...(completedAt && { completedAt }) },
  })
  return result.count === 1
}

export function appendStatusHistory(
  db: DbClient,
  entry: {
    orderId: string
    fromStatus: OrderStatus
    toStatus: OrderStatus
    changedByUserId: string
  },
) {
  return db.orderStatusHistory.create({ data: entry, select: { id: true } })
}

export function updateOrderPricing(
  db: DbClient,
  orderId: string,
  data: { estimatedTotal?: number | null; finalTotal?: number | null },
) {
  return db.order.update({ where: { id: orderId }, data, select: { id: true } })
}

export function updateLaptopPickup(
  db: DbClient,
  orderId: string,
  data: { distanceKm: number | null; pickupFee: number | null },
) {
  return db.laptopServiceRequest.update({
    where: { orderId },
    data,
    select: { orderId: true },
  })
}

export function updateAdminNotes(
  db: DbClient,
  orderId: string,
  adminNotes: string | null,
) {
  return db.order.update({
    where: { id: orderId },
    data: { adminNotes },
    select: { id: true },
  })
}

export function upsertPayment(
  db: DbClient,
  orderId: string,
  data: {
    method: Prisma.PaymentCreateInput['method']
    status: PaymentStatus
    amount: number | null
    confirmedById: string | null
    confirmedAt: Date | null
  },
) {
  return db.payment.upsert({
    where: { orderId },
    create: { orderId, ...data },
    update: data,
    select: { id: true },
  })
}

// The file must belong to the order and not be deleted. The storage key is
// returned for the download only and never serialized.
export function findDownloadableFile(
  db: DbClient,
  publicId: string,
  fileId: string,
) {
  return db.orderFile.findFirst({
    where: { id: fileId, deletedAt: null, order: { publicId } },
    select: {
      id: true,
      storageKey: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
    },
  })
}
