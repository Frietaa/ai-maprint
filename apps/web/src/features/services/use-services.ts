import {
  type ApiListResponse,
  PUBLIC_API_PATHS,
  type ServiceDto,
  type ServiceListQuery,
} from '@maba-printing/shared'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api-client.ts'

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
    queryFn: async ({ signal }) => {
      const body = await apiGet<ApiListResponse<ServiceDto>>(
        PUBLIC_API_PATHS.services,
        { categoryId: query.categoryId, locationId: query.locationId },
        signal,
      )
      return body.data
    },
    placeholderData: keepPreviousData,
  })
}
