// Public REST contract (GET-only, unauthenticated) shared by apps/api and
// apps/web. Implementation-independent: no Prisma, Express or React types.
// Money is whole Rupiah (integer). Internal fields such as isActive,
// timestamps and QRIS data are intentionally not part of these DTOs.
import type { OpeningHours } from './opening-hours.js'

export const API_PREFIX = '/api/v1'

export const PUBLIC_API_PATHS = {
  settings: '/public/settings',
  locations: '/locations',
  services: '/services',
  products: '/products',
} as const

export const PRICE_TYPES = ['FIXED', 'REQUIRES_CONFIRMATION'] as const
export type PriceType = (typeof PRICE_TYPES)[number]

export const PRODUCT_AVAILABILITIES = ['AVAILABLE', 'UNAVAILABLE'] as const
export type ProductAvailability = (typeof PRODUCT_AVAILABILITIES)[number]

// --- envelopes -----------------------------------------------------------

export interface ApiItemResponse<T> {
  data: T
}

export interface ApiListMeta {
  count: number
}

export interface ApiListResponse<T> {
  data: T[]
  meta: ApiListMeta
}

// `errors` maps a field (query parameter or body field) to its messages.
export interface ApiErrorResponse {
  message: string
  errors?: Record<string, string[]>
}

// --- resources -----------------------------------------------------------

export interface SocialLinkDto {
  platform: string
  url: string
}

// GET /public/settings returns `data: null` when business settings have not
// been configured yet; nothing is fabricated.
export interface PublicSettingsDto {
  businessName: string | null
  whatsappNumber: string | null
  // URL or storage reference; the web app only renders safe references.
  logoRef: string | null
  socialLinks: SocialLinkDto[]
  publicInfo: string | null
}

export interface LocationDto {
  id: string
  name: string
  address: string
  // null when not configured or not in the documented shape.
  openingHours: OpeningHours | null
}

export interface CategoryDto {
  id: string
  name: string
  description: string | null
}

export type ServiceCategoryDto = CategoryDto
export type ProductCategoryDto = CategoryDto

export interface ServiceDto {
  id: string
  name: string
  description: string | null
  priceType: PriceType
  // Required for FIXED; may be null (or indicative) for REQUIRES_CONFIRMATION.
  price: number | null
  category: ServiceCategoryDto
  // Active locations where the service is currently available.
  availableLocationIds: string[]
}

export interface ProductDto {
  id: string
  name: string
  description: string | null
  price: number
  // UNAVAILABLE = still listed, temporarily not orderable.
  availability: ProductAvailability
  imageRef: string | null
  category: ProductCategoryDto
}

// --- query parameters ------------------------------------------------------

export interface ServiceListQuery {
  categoryId?: string
  // Only services available at this (active) location.
  locationId?: string
}

export interface ProductListQuery {
  categoryId?: string
  availability?: ProductAvailability
}
