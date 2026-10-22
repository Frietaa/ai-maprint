// Admin REST contract shared by apps/api and apps/web. Implementation-
// independent: no Prisma, Express, storage or React types. Admin DTOs show
// operational data (customer snapshot, notes, payment, file metadata) but
// never password hashes, Google IDs, sessions, storage keys or paths.
import type { OpeningHours } from './opening-hours.js'
import type {
  HandoverMethod,
  OrderStatus,
  OrderTimelineEntryDto,
  OrderType,
} from './order-api.js'
import type { PriceType, ProductAvailability } from './public-api.js'

export const ADMIN_API_PREFIX = '/admin'

export const ADMIN_API_PATHS = {
  dashboard: '/admin/dashboard',
  orders: '/admin/orders',
  productCategories: '/admin/product-categories',
  products: '/admin/products',
  serviceCategories: '/admin/service-categories',
  services: '/admin/services',
  locations: '/admin/locations',
  settings: '/admin/settings',
} as const

// The approved order state machine (PRD §14, Architecture §29). The backend
// enforces it; the Admin UI only offers these next steps.
export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  SUBMITTED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to)
}

export const PAYMENT_METHODS = ['CASH', 'QRIS_STATIC'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_STATUSES = [
  'UNPAID',
  'PENDING_CONFIRMATION',
  'PAID',
] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Tunai',
  QRIS_STATIC: 'QRIS',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: 'Belum dibayar',
  PENDING_CONFIRMATION: 'Menunggu konfirmasi',
  PAID: 'Lunas',
}

// Pickup fee policy (PRD §11, Architecture §31): free up to 5 km, then
// Rp2.000 per additional started kilometre.
export const PICKUP_FREE_KM = 5
export const PICKUP_FEE_PER_KM = 2000

export function pickupFeeFor(distanceKm: number): number {
  if (distanceKm <= PICKUP_FREE_KM) return 0
  // Round to cents first so 5.1 km is not 5.10000001.
  const extra = Math.round((distanceKm - PICKUP_FREE_KM) * 100) / 100
  return Math.ceil(extra) * PICKUP_FEE_PER_KM
}

export const ADMIN_LIMITS = {
  adminNotesMaxLength: 5000,
  catalogNameMaxLength: 120,
  catalogDescriptionMaxLength: 1000,
  addressMaxLength: 300,
  imageRefMaxLength: 500,
  businessNameMaxLength: 120,
  publicInfoMaxLength: 2000,
  socialLinksMax: 10,
  maxDistanceKm: 9999.99,
  pageSizeMax: 50,
} as const

// --- orders ----------------------------------------------------------------

export interface AdminPaymentDto {
  method: PaymentMethod
  status: PaymentStatus
  amount: number | null
  confirmedAt: string | null
  confirmedBy: { name: string } | null
}

export interface AdminOrderSummaryDto {
  publicId: string
  type: OrderType
  status: OrderStatus
  customerName: string
  location: { id: string; name: string } | null
  requestedCompletionAt: string | null
  estimatedTotal: number | null
  finalTotal: number | null
  paymentStatus: PaymentStatus | null
  createdAt: string
}

export interface AdminDashboardDto {
  statusCounts: Record<OrderStatus, number>
  pendingPaymentConfirmations: number
  recentOrders: AdminOrderSummaryDto[]
}

export interface AdminOrderFileDto {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
  createdAt: string
  // Removed by the retention cleanup (download no longer possible).
  deletedAt: string | null
}

export interface AdminTimelineEntryDto extends OrderTimelineEntryDto {
  fromStatus: OrderStatus | null
  // Who made the change: an Admin, or the signed-in member who submitted;
  // null for guest submissions.
  changedBy: { name: string } | null
}

export interface AdminOrderDetailDto extends AdminOrderSummaryDto {
  customer: { name: string; whatsapp: string; email: string | null }
  // Signed-in member who submitted, if any (guest orders: null).
  member: { name: string; email: string } | null
  description: string | null
  location: { id: string; name: string; address: string } | null
  items: {
    name: string
    description: string | null
    quantity: number
    unitPrice: number | null
    subtotal: number | null
  }[]
  laptopService: {
    complaint: string
    handoverMethod: HandoverMethod
    handoverAt: string | null
    pickupAddress: string | null
    distanceKm: number | null
    pickupFee: number | null
  } | null
  softwareInstallation: {
    softwareName: string
    requirements: string | null
    licenseNote: string | null
  } | null
  adminNotes: string | null
  payment: AdminPaymentDto | null
  files: AdminOrderFileDto[]
  timeline: AdminTimelineEntryDto[]
  completedAt: string | null
  updatedAt: string
  // Next statuses allowed by the state machine.
  allowedTransitions: OrderStatus[]
}

export interface UpdateOrderStatusRequest {
  // The status the Admin saw (optimistic concurrency check).
  fromStatus: OrderStatus
  toStatus: OrderStatus
}

export interface UpdateOrderPricingRequest {
  estimatedTotal?: number | null
  finalTotal?: number | null
  // LAPTOP_SERVICE with PICKUP only; the server computes the pickup fee.
  distanceKm?: number | null
}

export interface UpdateOrderNotesRequest {
  adminNotes: string | null
}

export interface UpdatePaymentRequest {
  method: PaymentMethod
  status: PaymentStatus
  amount: number | null
}

// --- catalog ---------------------------------------------------------------

export interface AdminCategoryDto {
  id: string
  name: string
  description: string | null
  isActive: boolean
}

export interface AdminProductDto {
  id: string
  name: string
  description: string | null
  price: number
  availability: ProductAvailability
  imageRef: string | null
  isActive: boolean
  category: AdminCategoryDto
}

export interface AdminServiceDto {
  id: string
  name: string
  description: string | null
  priceType: PriceType
  price: number | null
  isActive: boolean
  category: AdminCategoryDto
}

export interface AdminLocationDto {
  id: string
  name: string
  address: string
  openingHours: OpeningHours | null
  isActive: boolean
  // Every service with its availability at this location.
  services: { serviceId: string; isAvailable: boolean }[]
}

export interface CategoryInput {
  name: string
  description?: string | null
  isActive?: boolean
}

export interface ProductInput {
  categoryId: string
  name: string
  description?: string | null
  price: number
  availability: ProductAvailability
  imageRef?: string | null
  isActive?: boolean
}

export interface ServiceInput {
  categoryId: string
  name: string
  description?: string | null
  priceType: PriceType
  price: number | null
  isActive?: boolean
}

export interface LocationInput {
  name: string
  address: string
  openingHours: OpeningHoursInput | null
  isActive?: boolean
}

// What the Admin editor submits: every weekday with zero or more ranges.
export interface OpeningHoursInput {
  weekly: Record<string, { open: string; close: string }[]>
  note: string | null
}

// --- business settings -----------------------------------------------------

export interface AdminSettingsDto {
  businessName: string | null
  whatsappNumber: string | null
  logoRef: string | null
  qrisImageRef: string | null
  // platform → URL
  socialLinks: Record<string, string>
  publicInfo: string | null
  updatedAt: string | null
}

export type UpdateSettingsRequest = Partial<Omit<AdminSettingsDto, 'updatedAt'>>
