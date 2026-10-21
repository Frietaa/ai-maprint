// Order submission, tracking and member order-history contract shared by
// apps/api and apps/web. Implementation-independent: no Prisma, Express,
// storage, multipart or React types. Internal UUIDs, storage keys, admin
// notes and status-change actors are intentionally never part of these
// DTOs. Money is whole Rupiah; instants are ISO 8601 strings (UTC).

export const ORDER_API_PATHS = {
  orders: '/orders',
  // `/orders/track/<publicId>`
  track: '/orders/track',
  // `/account/orders` and `/account/orders/<publicId>`
  accountOrders: '/account/orders',
} as const

export const ORDER_TYPES = [
  'PRINTING',
  'ATK',
  'LAPTOP_SERVICE',
  'SOFTWARE_INSTALLATION',
] as const
export type OrderType = (typeof ORDER_TYPES)[number]

export const ORDER_STATUSES = [
  'SUBMITTED',
  'CONFIRMED',
  'IN_PROGRESS',
  'READY',
  'COMPLETED',
  'CANCELLED',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

// Consumer-facing labels (PRD §14). Raw enum values are never shown.
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  SUBMITTED: 'Menunggu Konfirmasi',
  CONFIRMED: 'Pesanan Diterima',
  IN_PROGRESS: 'Sedang Dikerjakan',
  READY: 'Siap/Selesai',
  COMPLETED: 'Pesanan Selesai',
  CANCELLED: 'Dibatalkan',
}

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  PRINTING: 'Printing',
  ATK: 'ATK',
  LAPTOP_SERVICE: 'Service Laptop',
  SOFTWARE_INSTALLATION: 'Instalasi Software',
}

export const HANDOVER_METHODS = ['DROP_OFF', 'PICKUP'] as const
export type HandoverMethod = (typeof HANDOVER_METHODS)[number]

export const HANDOVER_METHOD_LABELS: Record<HandoverMethod, string> = {
  DROP_OFF: 'Antar sendiri ke lokasi',
  PICKUP: 'Dijemput',
}

// "MP-2026-7K92D4QX8M7RA": year (Asia/Jakarta) + 13 Crockford base-32
// characters (65 random bits). Parsing trims and uppercases first.
export const PUBLIC_ORDER_ID_PATTERN = /^MP-\d{4}-[0-9A-HJKMNP-TV-Z]{13}$/

// Input bounds enforced by the API (authoritative) and mirrored by the web
// forms. Lengths are JavaScript string lengths.
export const ORDER_LIMITS = {
  customerNameMaxLength: 120,
  descriptionMaxLength: 5000,
  softwareNameMaxLength: 200,
  pickupAddressMaxLength: 500,
  atkMaxItems: 20,
  atkMaxQuantity: 99,
  // Requested completion may be at most this far ahead.
  maxScheduleAheadDays: 365,
  historyPageSizeDefault: 10,
  historyPageSizeMax: 50,
} as const

// Upload policy shown to customers; the API enforces the configured values.
export const UPLOAD_ACCEPTED_EXTENSIONS = [
  'pdf',
  'docx',
  'pptx',
  'xlsx',
  'jpg',
  'jpeg',
  'png',
] as const

// Default upload limits (the API may be configured lower or higher within
// its hard caps; it is authoritative).
export const UPLOAD_DEFAULT_LIMITS = {
  maxFiles: 5,
  maxFileBytes: 10 * 1024 * 1024,
  maxTotalBytes: 25 * 1024 * 1024,
} as const

// multipart/form-data field names for PRINTING orders with files.
export const ORDER_MULTIPART_FIELDS = {
  payload: 'payload',
  files: 'files',
} as const

// --- requests ----------------------------------------------------------------

export interface OrderCustomerInput {
  customerName: string
  customerWhatsapp: string
  customerEmail?: string | null
  locationId?: string | null
  // ISO 8601 instant; preferred completion, not a guarantee.
  requestedCompletionAt?: string | null
}

export interface PrintingOrderRequest extends OrderCustomerInput {
  type: 'PRINTING'
  description?: string | null
}

export interface AtkOrderItemInput {
  productId: string
  quantity: number
}

export interface AtkOrderRequest extends OrderCustomerInput {
  type: 'ATK'
  description?: string | null
  items: AtkOrderItemInput[]
}

export interface LaptopServiceOrderRequest extends OrderCustomerInput {
  type: 'LAPTOP_SERVICE'
  complaint: string
  handoverMethod: HandoverMethod
  handoverAt?: string | null
  pickupAddress?: string | null
}

export interface SoftwareInstallationOrderRequest extends OrderCustomerInput {
  type: 'SOFTWARE_INSTALLATION'
  softwareName: string
  requirements?: string | null
  // Must be true: only legal software is installed.
  licenseAcknowledged: boolean
}

export type CreateOrderRequest =
  | PrintingOrderRequest
  | AtkOrderRequest
  | LaptopServiceOrderRequest
  | SoftwareInstallationOrderRequest

// --- responses ---------------------------------------------------------------

// POST /orders (201)
export interface OrderReceiptDto {
  publicId: string
  type: OrderType
  status: OrderStatus
  createdAt: string
  requestedCompletionAt: string | null
  estimatedTotal: number | null
}

export interface OrderTimelineEntryDto {
  status: OrderStatus
  at: string
}

// GET /orders/track/:publicId — the safe public minimum (PRD §16).
export interface TrackedOrderDto {
  publicId: string
  type: OrderType
  status: OrderStatus
  createdAt: string
  requestedCompletionAt: string | null
  location: { name: string } | null
  timeline: OrderTimelineEntryDto[]
}

// GET /account/orders
export interface MemberOrderSummaryDto {
  publicId: string
  type: OrderType
  status: OrderStatus
  createdAt: string
  requestedCompletionAt: string | null
  estimatedTotal: number | null
  finalTotal: number | null
}

export interface MemberOrderItemDto {
  name: string
  description: string | null
  quantity: number
  unitPrice: number | null
  subtotal: number | null
}

export interface MemberOrderFileDto {
  name: string
  mimeType: string
  sizeBytes: number
}

// GET /account/orders/:publicId — the member's own order, as submitted.
export interface MemberOrderDetailDto extends MemberOrderSummaryDto {
  customer: {
    name: string
    whatsapp: string
    email: string | null
  }
  description: string | null
  location: { name: string; address: string } | null
  items: MemberOrderItemDto[]
  laptopService: {
    complaint: string
    handoverMethod: HandoverMethod
    handoverAt: string | null
    pickupAddress: string | null
    // Set later by Admin (no Maps API).
    distanceKm: number | null
    pickupFee: number | null
  } | null
  softwareInstallation: {
    softwareName: string
    requirements: string | null
    licenseNote: string | null
  } | null
  files: MemberOrderFileDto[]
  timeline: OrderTimelineEntryDto[]
}

export interface ApiPageMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ApiPageResponse<T> {
  data: T[]
  meta: ApiPageMeta
}

// The one Public Order ID normalization (tracking, member detail, web
// input): surrounding whitespace removed, uppercased, then the exact
// pattern. null for anything else — no partial or wildcard lookups.
export function parsePublicOrderId(raw: string): string | null {
  const value = raw.trim().toUpperCase()
  return PUBLIC_ORDER_ID_PATTERN.test(value) ? value : null
}
