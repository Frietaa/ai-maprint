// AdminAuditLog writes (PRD §21, ADR-017). Append-only: there is no code
// path that edits or deletes audit rows. Call recordAudit inside the same
// transaction as the change it describes, so a privileged change never
// commits without its audit row. Metadata holds small operational
// before/after values only — never passwords, tokens, session data, file
// contents or free-text notes.
import type { DbClient } from '../db/prisma.js'
import type { Prisma } from '../generated/prisma/client.js'

export const AUDIT_ACTIONS = {
  orderStatusUpdated: 'ORDER_STATUS_UPDATED',
  orderPricingUpdated: 'ORDER_PRICING_UPDATED',
  orderAdminNotesUpdated: 'ORDER_ADMIN_NOTES_UPDATED',
  paymentUpdated: 'PAYMENT_UPDATED',
  orderFileDownloaded: 'ORDER_FILE_DOWNLOADED',
  productCategoryCreated: 'PRODUCT_CATEGORY_CREATED',
  productCategoryUpdated: 'PRODUCT_CATEGORY_UPDATED',
  productCreated: 'PRODUCT_CREATED',
  productUpdated: 'PRODUCT_UPDATED',
  productDeactivated: 'PRODUCT_DEACTIVATED',
  productReactivated: 'PRODUCT_REACTIVATED',
  serviceCategoryCreated: 'SERVICE_CATEGORY_CREATED',
  serviceCategoryUpdated: 'SERVICE_CATEGORY_UPDATED',
  serviceCreated: 'SERVICE_CREATED',
  serviceUpdated: 'SERVICE_UPDATED',
  serviceDeactivated: 'SERVICE_DEACTIVATED',
  serviceReactivated: 'SERVICE_REACTIVATED',
  locationCreated: 'LOCATION_CREATED',
  locationUpdated: 'LOCATION_UPDATED',
  locationDeactivated: 'LOCATION_DEACTIVATED',
  locationReactivated: 'LOCATION_REACTIVATED',
  locationServiceAvailabilityUpdated: 'LOCATION_SERVICE_AVAILABILITY_UPDATED',
  businessSettingsUpdated: 'BUSINESS_SETTINGS_UPDATED',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

export const AUDIT_ENTITIES = {
  order: 'ORDER',
  payment: 'PAYMENT',
  orderFile: 'ORDER_FILE',
  productCategory: 'PRODUCT_CATEGORY',
  product: 'PRODUCT',
  serviceCategory: 'SERVICE_CATEGORY',
  service: 'SERVICE',
  location: 'LOCATION',
  locationService: 'LOCATION_SERVICE',
  businessSettings: 'BUSINESS_SETTINGS',
} as const

export type AuditEntity = (typeof AUDIT_ENTITIES)[keyof typeof AUDIT_ENTITIES]

export interface AuditEvent {
  // Always the signed-in ADMIN (never taken from the request body).
  actorId: string
  action: AuditAction
  entityType: AuditEntity
  // Public order ID for orders, the row ID otherwise.
  entityId: string | null
  metadata?: Prisma.InputJsonValue
}

export async function recordAudit(
  tx: DbClient,
  event: AuditEvent,
): Promise<void> {
  await tx.adminAuditLog.create({
    data: {
      actorId: event.actorId,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      ...(event.metadata !== undefined && { metadata: event.metadata }),
    },
  })
}

// { field: { from, to } } for the fields that actually changed.
export function changes<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
): Record<string, { from: unknown; to: unknown }> {
  const diff: Record<string, { from: unknown; to: unknown }> = {}
  for (const [key, value] of Object.entries(after)) {
    if (value !== undefined && before[key] !== value) {
      diff[key] = { from: before[key] ?? null, to: value }
    }
  }
  return diff
}
