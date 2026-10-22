import { type ProductDto, PUBLIC_API_PATHS } from '@maba-printing/shared'
import { useQuery } from '@tanstack/react-query'
import { fetchCatalog } from '../../lib/fetch-catalog.ts'

export const productsQueryKey = ['public', 'products'] as const

// Public ATK catalog (database-backed): active products of active
// categories, AVAILABLE and UNAVAILABLE. The page filters categories
// locally, so one read (all pages) serves every filter state.
export function useProducts() {
  return useQuery({
    queryKey: productsQueryKey,
    queryFn: ({ signal }) =>
      fetchCatalog<ProductDto>(PUBLIC_API_PATHS.products, {}, signal),
  })
}
