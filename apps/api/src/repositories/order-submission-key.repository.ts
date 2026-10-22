// Persistence for duplicate-submission keys (TASK-06.05, KI-020). Only
// SHA-256 hashes are stored; the row is written in the order transaction,
// so it exists exactly when its order exists.
import type { DbClient } from '../db/prisma.js'
import { type OrderReceiptRecord, receiptSelect } from './order.repository.js'

export interface SubmissionKeyRecord {
  userId: string | null
  requestHash: string
  createdAt: Date
  // The receipt fields of the order the key created (current status).
  order: OrderReceiptRecord
}

export function findSubmissionKey(
  db: DbClient,
  keyHash: string,
): Promise<SubmissionKeyRecord | null> {
  return db.orderSubmissionKey.findUnique({
    where: { keyHash },
    select: {
      userId: true,
      requestHash: true,
      createdAt: true,
      order: { select: receiptSelect },
    },
  })
}

export interface NewSubmissionKey {
  keyHash: string
  requestHash: string
  userId: string | null
  publicId: string
}

// Inside the order transaction. Keys created before `expiredBefore` never
// replay; deleting them first lets an old key start a new order and keeps
// the table small. A concurrent request with the same key blocks on the
// primary key until this transaction ends, then fails as a duplicate.
export async function recordSubmissionKey(
  tx: DbClient,
  key: NewSubmissionKey,
  expiredBefore: Date,
): Promise<void> {
  await tx.orderSubmissionKey.deleteMany({
    where: { createdAt: { lt: expiredBefore } },
  })
  await tx.orderSubmissionKey.create({
    data: {
      keyHash: key.keyHash,
      requestHash: key.requestHash,
      order: { connect: { publicId: key.publicId } },
      ...(key.userId ? { user: { connect: { id: key.userId } } } : {}),
    },
  })
}
