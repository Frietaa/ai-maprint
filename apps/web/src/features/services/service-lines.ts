import {
  categoryMatchesLine,
  type ServiceDto,
  type ServiceLine,
} from '@maba-printing/shared'

// Pages pick their categories with the shared keyword mapping (KI-013,
// packages/shared/src/service-lines.ts). No database IDs live here.
export { categoryMatchesLine, type ServiceLine }

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
