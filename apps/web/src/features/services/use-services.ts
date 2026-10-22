import {
  PUBLIC_API_PATHS,
  type ServiceDto,
  type ServiceListQuery,
} from '@maba-printing/shared'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchCatalog } from '../../lib/fetch-catalog.ts'

export const servicesQueryKey = (query: ServiceListQuery) =>
  [
    'public',
    'services',
    query.locationId ?? null,
    query.categoryId ?? null,
  ] as const

// Public service catalog (database-backed). Keeps the previous list visible
// while a new location filter loads.
export function useServices(query: ServiceListQuery = {}) {
  return useQuery({
    queryKey: servicesQueryKey(query),
    queryFn: ({ signal }) =>
      fetchCatalog<ServiceDto>(
        PUBLIC_API_PATHS.services,
        { categoryId: query.categoryId, locationId: query.locationId },
        signal,
      ),
    placeholderData: keepPreviousData,
  })
}
