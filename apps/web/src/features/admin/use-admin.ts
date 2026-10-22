// Admin server state via TanStack Query and the single API client
// (credentials + CSRF). The API authorizes every request; nothing here is
// a security boundary.
import {
  ADMIN_API_PATHS,
  type AdminCategoryDto,
  type AdminDashboardDto,
  type AdminLocationDto,
  type AdminOrderDetailDto,
  type AdminOrderSummaryDto,
  type AdminProductDto,
  type AdminServiceDto,
  type AdminSettingsDto,
  type ApiItemResponse,
  type ApiListResponse,
  type ApiPageResponse,
} from '@maba-printing/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ApiError,
  apiGet,
  apiSend,
  type QueryParams,
} from '../../lib/api-client.ts'
import { publicSettingsQueryKey } from '../settings/use-public-settings.ts'

export const adminQueryKey = ['admin'] as const

export function useAdminDashboard() {
  return useQuery({
    queryKey: [...adminQueryKey, 'dashboard'],
    queryFn: async ({ signal }) =>
      (
        await apiGet<ApiItemResponse<AdminDashboardDto>>(
          ADMIN_API_PATHS.dashboard,
          undefined,
          signal,
        )
      ).data,
    staleTime: 0,
  })
}

export function useAdminOrders(params: QueryParams) {
  return useQuery({
    queryKey: [...adminQueryKey, 'orders', params],
    queryFn: ({ signal }) =>
      apiGet<ApiPageResponse<AdminOrderSummaryDto>>(
        ADMIN_API_PATHS.orders,
        params,
        signal,
      ),
    staleTime: 0,
    retry: false,
  })
}

function orderKey(publicId: string) {
  return [...adminQueryKey, 'order', publicId] as const
}

export function useAdminOrder(publicId: string) {
  return useQuery({
    queryKey: orderKey(publicId),
    queryFn: async ({ signal }) =>
      (
        await apiGet<ApiItemResponse<AdminOrderDetailDto>>(
          `${ADMIN_API_PATHS.orders}/${encodeURIComponent(publicId)}`,
          undefined,
          signal,
        )
      ).data,
    staleTime: 0,
    retry: false,
  })
}

export type OrderCommand = 'status' | 'pricing' | 'notes' | 'payment'

// Order commands answer with the fresh detail. On a 409 (another Admin
// changed the order) the detail is reloaded; nothing is retried.
export function useOrderCommand(publicId: string, command: OrderCommand) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: object) =>
      (
        await apiSend<ApiItemResponse<AdminOrderDetailDto>>(
          'PATCH',
          `${ADMIN_API_PATHS.orders}/${encodeURIComponent(publicId)}/${command}`,
          body,
        )
      ).data,
    onSuccess: (order) => {
      queryClient.setQueryData(orderKey(publicId), order)
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKey, 'orders'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKey, 'dashboard'],
      })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: orderKey(publicId) })
      }
    },
  })
}

export type CatalogResource =
  | 'productCategories'
  | 'products'
  | 'serviceCategories'
  | 'services'
  | 'locations'

interface CatalogDtos {
  productCategories: AdminCategoryDto
  products: AdminProductDto
  serviceCategories: AdminCategoryDto
  services: AdminServiceDto
  locations: AdminLocationDto
}

export function useAdminCatalog<R extends CatalogResource>(resource: R) {
  return useQuery({
    queryKey: [...adminQueryKey, 'catalog', resource],
    queryFn: async ({ signal }) =>
      (
        await apiGet<ApiListResponse<CatalogDtos[R]>>(
          ADMIN_API_PATHS[resource],
          undefined,
          signal,
        )
      ).data,
    staleTime: 0,
  })
}

// Create (no id) or update (id) a catalog record; refreshes Admin lists and
// the public catalog caches.
export function useSaveCatalog<R extends CatalogResource>(resource: R) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: object }) =>
      (
        await apiSend<ApiItemResponse<CatalogDtos[R]>>(
          id ? 'PATCH' : 'POST',
          id ? `${ADMIN_API_PATHS[resource]}/${id}` : ADMIN_API_PATHS[resource],
          body,
        )
      ).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKey, 'catalog'],
      })
      void queryClient.invalidateQueries({ queryKey: ['public'] })
    },
  })
}

export function useLocationServiceToggle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      locationId: string
      serviceId: string
      isAvailable: boolean
    }) =>
      (
        await apiSend<ApiItemResponse<AdminLocationDto>>(
          'PUT',
          `${ADMIN_API_PATHS.locations}/${input.locationId}/services/${input.serviceId}`,
          { isAvailable: input.isAvailable },
        )
      ).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKey, 'catalog'],
      })
      void queryClient.invalidateQueries({ queryKey: ['public'] })
    },
  })
}

export function useAdminSettings() {
  return useQuery({
    queryKey: [...adminQueryKey, 'settings'],
    queryFn: async ({ signal }) =>
      (
        await apiGet<ApiItemResponse<AdminSettingsDto>>(
          ADMIN_API_PATHS.settings,
          undefined,
          signal,
        )
      ).data,
    staleTime: 0,
  })
}

export function useSaveSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: object) =>
      (
        await apiSend<ApiItemResponse<AdminSettingsDto>>(
          'PATCH',
          ADMIN_API_PATHS.settings,
          body,
        )
      ).data,
    onSuccess: (settings) => {
      queryClient.setQueryData([...adminQueryKey, 'settings'], settings)
      // The public site shows the new values without a reload.
      void queryClient.invalidateQueries({ queryKey: publicSettingsQueryKey })
    },
  })
}

// Downloads are plain navigations to the API (session cookie, attachment
// response); the URL contains only the public ID and the file record ID.
export function fileDownloadPath(publicId: string, fileId: string): string {
  return `${ADMIN_API_PATHS.orders}/${encodeURIComponent(publicId)}/files/${fileId}/download`
}
