// Explicit mapping from repository records to the public DTO contract.
// Only allow-listed fields are copied: isActive, timestamps and any future
// internal columns never reach a public response. The static QRIS image is
// public payment information, published only as a browser-safe reference.
import {
  type CategoryDto,
  type LocationDto,
  parseOpeningHours,
  type ProductDto,
  safeImageRef,
  type PublicSettingsDto,
  type ServiceDto,
  type SocialLinkDto,
} from '@maba-printing/shared'
import type { BusinessSettingsRecord } from '../repositories/business-settings.repository.js'
import type { LocationRecord } from '../repositories/location.repository.js'
import type { ProductRecord } from '../repositories/product-catalog.repository.js'
import type { ServiceRecord } from '../repositories/service-catalog.repository.js'

function textOrNull(value: string | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

// social_links is free-form JSONB ({ "instagram": "https://..." }). Only
// entries whose value is an absolute http(s) URL are published, so values
// such as "javascript:..." can never become links on the website.
export function toSocialLinks(value: unknown): SocialLinkDto[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return []
  }
  const links: SocialLinkDto[] = []
  for (const [key, raw] of Object.entries(value)) {
    const platform = key.trim()
    if (platform === '' || typeof raw !== 'string') continue
    try {
      const url = new URL(raw.trim())
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        links.push({ platform, url: url.toString() })
      }
    } catch {
      // Not a URL: skip.
    }
  }
  return links
}

export function toPublicSettingsDto(
  record: BusinessSettingsRecord,
): PublicSettingsDto {
  return {
    businessName: textOrNull(record.businessName),
    whatsappNumber: textOrNull(record.whatsappNumber),
    logoRef: textOrNull(record.logoRef),
    qrisImageRef: safeImageRef(record.qrisImageRef),
    socialLinks: toSocialLinks(record.socialLinks),
    publicInfo: textOrNull(record.publicInfo),
  }
}

export function toLocationDto(record: LocationRecord): LocationDto {
  return {
    id: record.id,
    name: record.name,
    address: record.address,
    openingHours: parseOpeningHours(record.openingHours),
  }
}

function toCategoryDto(category: {
  id: string
  name: string
  description: string | null
}): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    description: textOrNull(category.description),
  }
}

export function toServiceDto(record: ServiceRecord): ServiceDto {
  return {
    id: record.id,
    name: record.name,
    description: textOrNull(record.description),
    priceType: record.priceType,
    price: record.price,
    category: toCategoryDto(record.category),
    availableLocationIds: record.locations.map((link) => link.locationId),
  }
}

export function toProductDto(record: ProductRecord): ProductDto {
  return {
    id: record.id,
    name: record.name,
    description: textOrNull(record.description),
    price: record.price,
    availability: record.availability,
    imageRef: textOrNull(record.imageRef),
    category: toCategoryDto(record.category),
  }
}
