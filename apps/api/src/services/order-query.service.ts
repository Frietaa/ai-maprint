// Read use cases for orders: guest tracking by exact Public Order ID and the
// member's own history/detail. Missing and foreign orders are the same 404.
import type { DbClient } from '../db/prisma.js'
import { NotFoundError } from '../errors/app-error.js'
import {
  findMemberOrder,
  findTrackedOrder,
  listMemberOrders,
  type MemberOrderDetailRecord,
  type MemberOrderSummaryRecord,
  type TrackedOrderRecord,
} from '../repositories/order.repository.js'

export const ORDER_NOT_FOUND_MESSAGE = 'Order not found'

export async function trackOrder(
  db: DbClient,
  publicId: string,
): Promise<TrackedOrderRecord> {
  const order = await findTrackedOrder(db, publicId)
  if (!order) throw new NotFoundError(ORDER_NOT_FOUND_MESSAGE)
  return order
}

export interface OrderPage {
  orders: MemberOrderSummaryRecord[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export async function listOwnOrders(
  db: DbClient,
  userId: string,
  { page, pageSize }: { page: number; pageSize: number },
): Promise<OrderPage> {
  const { orders, total } = await listMemberOrders(db, userId, {
    skip: (page - 1) * pageSize,
    take: pageSize,
  })
  return {
    orders,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getOwnOrder(
  db: DbClient,
  userId: string,
  publicId: string,
): Promise<MemberOrderDetailRecord> {
  const order = await findMemberOrder(db, userId, publicId)
  if (!order) throw new NotFoundError(ORDER_NOT_FOUND_MESSAGE)
  return order
}
