import {
  type ApiListResponse,
  type LocationDto,
  PUBLIC_API_PATHS,
} from '@maba-printing/shared'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api-client.ts'

export const locationsQueryKey = ['public', 'locations'] as const

// Active public locations (database-backed).
export function useLocations() {
  return useQuery({
    queryKey: locationsQueryKey,
    queryFn: async ({ signal }) => {
      const body = await apiGet<ApiListResponse<LocationDto>>(
        PUBLIC_API_PATHS.locations,
        undefined,
        signal,
      )
      return body.data
    },
  })
}
