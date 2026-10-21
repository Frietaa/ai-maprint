// Order records → client DTOs. Allow-lists only the fields of the shared
// contract: no internal UUIDs, storage keys, admin notes or actors.
import type {
  MemberOrderDetailDto,
  MemberOrderSummaryDto,
  OrderReceiptDto,
  OrderTimelineEntryDto,
  TrackedOrderDto,
} from '@maba-printing/shared'
import type {
  MemberOrderDetailRecord,
  MemberOrderSummaryRecord,
  OrderReceiptRecord,
  TrackedOrderRecord,
} from '../repositories/order.repository.js'

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

function toTimeline(
  history: { toStatus: OrderTimelineEntryDto['status']; createdAt: Date }[],
): OrderTimelineEntryDto[] {
  return history.map((entry) => ({
    status: entry.toStatus,
    at: entry.createdAt.toISOString(),
  }))
}

export function toOrderReceiptDto(order: OrderReceiptRecord): OrderReceiptDto {
  return {
    publicId: order.publicId,
    type: order.type,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    requestedCompletionAt: iso(order.requestedCompletionAt),
    estimatedTotal: order.estimatedTotal,
  }
}

// The safe public minimum (PRD §16): no customer data, description, files,
// prices or actors.
export function toTrackedOrderDto(order: TrackedOrderRecord): TrackedOrderDto {
  return {
    publicId: order.publicId,
    type: order.type,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    requestedCompletionAt: iso(order.requestedCompletionAt),
    location: order.location ? { name: order.location.name } : null,
    timeline: toTimeline(order.statusHistory),
  }
}

export function toMemberOrderSummaryDto(
  order: MemberOrderSummaryRecord,
): MemberOrderSummaryDto {
  return {
    publicId: order.publicId,
    type: order.type,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    requestedCompletionAt: iso(order.requestedCompletionAt),
    estimatedTotal: order.estimatedTotal,
    finalTotal: order.finalTotal,
  }
}

export function toMemberOrderDetailDto(
  order: MemberOrderDetailRecord,
): MemberOrderDetailDto {
  const laptop = order.laptopServiceRequest
  const software = order.softwareInstallationRequest
  return {
    ...toMemberOrderSummaryDto(order),
    customer: {
      name: order.customerName,
      whatsapp: order.customerWhatsapp,
      email: order.customerEmail,
    },
    description: order.description,
    location: order.location
      ? { name: order.location.name, address: order.location.address }
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
    files: order.files.map((file) => ({
      name: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
    })),
    timeline: toTimeline(order.statusHistory),
  }
}
