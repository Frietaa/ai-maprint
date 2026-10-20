import {
  type ApiListResponse,
  type ProductDto,
  PUBLIC_API_PATHS,
} from '@maba-printing/shared'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api-client.ts'

export const productsQueryKey = ['public', 'products'] as const

// Public ATK catalog (database-backed): active products of active
// categories, AVAILABLE and UNAVAILABLE. The page filters categories
// locally, so one request serves every filter state.
export function useProducts() {
  return useQuery({
    queryKey: productsQueryKey,
    queryFn: async ({ signal }) => {
      const body = await apiGet<ApiListResponse<ProductDto>>(
        PUBLIC_API_PATHS.products,
        undefined,
        signal,
      )
      return body.data
    },
  })
}
