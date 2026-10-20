import type { ServiceDto } from '@maba-printing/shared'

// The three service-based business lines (PRD §2). Service categories are
// editable database rows without a fixed "line" column, so pages pick their
// categories by name keywords (KI-013). No database IDs live in this file.
export type ServiceLine =
  'printing' | 'laptop-service' | 'software-installation'

const LINE_KEYWORDS: Record<ServiceLine, readonly string[]> = {
  printing: ['print', 'cetak', 'fotokopi', 'fotocopy', 'jilid', 'scan'],
  'laptop-service': ['laptop', 'komputer', 'notebook'],
  'software-installation': [
    'software',
    'instal',
    'aplikasi',
    'perangkat lunak',
  ],
}

export function categoryMatchesLine(
  categoryName: string,
  line: ServiceLine,
): boolean {
  const name = categoryName.toLocaleLowerCase('id-ID')
  return LINE_KEYWORDS[line].some((keyword) => name.includes(keyword))
}

export interface ServiceGroup {
  category: ServiceDto['category']
  services: ServiceDto[]
}

// Groups services by category, keeping the API order (category name, then
// service name).
export function groupByCategory(
  services: readonly ServiceDto[],
): ServiceGroup[] {
  const groups = new Map<string, ServiceGroup>()
  for (const service of services) {
    const group = groups.get(service.category.id)
    if (group) {
      group.services.push(service)
    } else {
      groups.set(service.category.id, {
        category: service.category,
        services: [service],
      })
    }
  }
  return [...groups.values()]
}

export interface LineSelection {
  groups: ServiceGroup[]
  // true when no category matched the line and the full catalog is shown.
  isFallback: boolean
}

// Categories that belong to `line`; if none match (e.g. categories were
// renamed), the whole public catalog is returned instead of hiding it.
export function selectServicesForLine(
  services: readonly ServiceDto[],
  line: ServiceLine,
): LineSelection {
  const matching = services.filter((service) =>
    categoryMatchesLine(service.category.name, line),
  )
  if (matching.length > 0 || services.length === 0) {
    return { groups: groupByCategory(matching), isFallback: false }
  }
  return { groups: groupByCategory(services), isFallback: true }
}
