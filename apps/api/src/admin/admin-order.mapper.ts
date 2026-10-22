// Admin order records → Admin DTOs (explicit allow-lists). The internal
// order ID, storage keys, password hashes and Google IDs never appear.
import {
  type AdminDashboardDto,
  type AdminOrderDetailDto,
  type AdminOrderSummaryDto,
  ORDER_STATUS_TRANSITIONS,
  ORDER_STATUSES,
  type OrderStatus,
} from '@maba-printing/shared'
import type {
  AdminOrderDetailRecord,
  AdminOrderSummaryRecord,
} from './admin-order.repository.js'

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

export function toAdminOrderSummaryDto(
  order: AdminOrderSummaryRecord,
): AdminOrderSummaryDto {
  return {
    publicId: order.publicId,
    type: order.type,
    status: order.status,
    customerName: order.customerName,
    location: order.location
      ? { id: order.location.id, name: order.location.name }
      : null,
    requestedCompletionAt: iso(order.requestedCompletionAt),
    estimatedTotal: order.estimatedTotal,
    finalTotal: order.finalTotal,
    paymentStatus: order.payment?.status ?? null,
    createdAt: order.createdAt.toISOString(),
  }
}

export function toAdminDashboardDto(figures: {
  byStatus: { status: OrderStatus; _count: { _all: number } }[]
  pendingPayments: number
  recent: AdminOrderSummaryRecord[]
}): AdminDashboardDto {
  const statusCounts = Object.fromEntries(
    ORDER_STATUSES.map((status) => [status, 0]),
  ) as Record<OrderStatus, number>
  for (const row of figures.byStatus) {
    statusCounts[row.status] = row._count._all
  }
  return {
    statusCounts,
    pendingPaymentConfirmations: figures.pendingPayments,
    recentOrders: figures.recent.map(toAdminOrderSummaryDto),
  }
}

export function toAdminOrderDetailDto(
  order: AdminOrderDetailRecord,
): AdminOrderDetailDto {
  const laptop = order.laptopServiceRequest
  const software = order.softwareInstallationRequest
  const payment = order.payment
  return {
    ...toAdminOrderSummaryDto(order),
    customer: {
      name: order.customerName,
      whatsapp: order.customerWhatsapp,
      email: order.customerEmail,
    },
    member: order.user
      ? { name: order.user.name, email: order.user.email }
      : null,
    description: order.description,
    location: order.location
      ? {
          id: order.location.id,
          name: order.location.name,
          address: order.location.address,
        }
      : null,
    items: order.items.map((item) => ({
      name: item.nameSnapshot,
      description: item.descriptionSnapshot,
      quantity: item.quantity,
      unitPrice: item.unitPriceSnapshot,
      subtotal: item.subtotal,
    })),
    laptopService: laptop
      ? {
          complaint: laptop.complaint,
          handoverMethod: laptop.handoverMethod,
          handoverAt: iso(laptop.handoverAt),
          pickupAddress: laptop.pickupAddress,
          distanceKm: laptop.distanceKm ? laptop.distanceKm.toNumber() : null,
          pickupFee: laptop.pickupFee,
        }
      : null,
    softwareInstallation: software
      ? {
          softwareName: software.softwareName,
          requirements: software.requirements,
          licenseNote: software.licenseNote,
        }
      : null,
    adminNotes: order.adminNotes,
    payment: payment
      ? {
          method: payment.method,
          status: payment.status,
          amount: payment.amount,
          confirmedAt: iso(payment.confirmedAt),
          confirmedBy: payment.confirmedBy
            ? { name: payment.confirmedBy.name }
            : null,
        }
      : null,
    files: order.files.map((file) => ({
      id: file.id,
      name: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      createdAt: file.createdAt.toISOString(),
      deletedAt: iso(file.deletedAt),
    })),
    timeline: order.statusHistory.map((entry) => ({
      status: entry.toStatus,
      fromStatus: entry.fromStatus,
      at: entry.createdAt.toISOString(),
      changedBy: entry.changedBy ? { name: entry.changedBy.name } : null,
    })),
    completedAt: iso(order.completedAt),
    updatedAt: order.updatedAt.toISOString(),
    allowedTransitions: [...ORDER_STATUS_TRANSITIONS[order.status]],
  }
}
