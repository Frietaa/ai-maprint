// Order server state via TanStack Query (no separate store). Submissions go
// through the single API client: JSON, or FormData when printing documents
// are attached (payload JSON + files), always with credentials and CSRF.
import {
  type ApiItemResponse,
  type ApiPageResponse,
  type CreateOrderRequest,
  type MemberOrderDetailDto,
  type MemberOrderSummaryDto,
  ORDER_API_PATHS,
  ORDER_MULTIPART_FIELDS,
  type OrderReceiptDto,
  type TrackedOrderDto,
} from '@maba-printing/shared'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { apiGet, apiSend } from '../../lib/api-client.ts'
import { accountQueryKey } from '../auth/use-auth.ts'

export const memberOrdersQueryKey = [...accountQueryKey, 'orders'] as const

export interface SubmitOrderVariables {
  order: CreateOrderRequest
  files?: readonly File[]
}

export function toOrderBody({ order, files = [] }: SubmitOrderVariables) {
  if (files.length === 0) return order
  const form = new FormData()
  form.append(ORDER_MULTIPART_FIELDS.payload, JSON.stringify(order))
  for (const file of files) form.append(ORDER_MULTIPART_FIELDS.files, file)
  return form
}

export function useSubmitOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (variables: SubmitOrderVariables) =>
      (
        await apiSend<ApiItemResponse<OrderReceiptDto>>(
          'POST',
          ORDER_API_PATHS.orders,
          toOrderBody(variables),
        )
      ).data,
    // A member's history now has a new entry.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: memberOrdersQueryKey }),
    // Customer data and files live in memory only while the form exists.
    gcTime: 0,
  })
}

// Exact-ID tracking, fetched only for an explicitly submitted ID.
export function useTrackedOrder(publicId: string | null) {
  return useQuery({
    queryKey: ['orders', 'track', publicId],
    queryFn: async ({ signal }) =>
      (
        await apiGet<ApiItemResponse<TrackedOrderDto>>(
          `${ORDER_API_PATHS.track}/${encodeURIComponent(publicId ?? '')}`,
          undefined,
          signal,
        )
      ).data,
    enabled: publicId !== null,
    staleTime: 30_000,
    retry: false,
  })
}

export function useMemberOrders(page: number) {
  return useQuery({
    queryKey: [...memberOrdersQueryKey, 'list', page],
    queryFn: ({ signal }) =>
      apiGet<ApiPageResponse<MemberOrderSummaryDto>>(
        ORDER_API_PATHS.accountOrders,
        { page: String(page) },
        signal,
      ),
    placeholderData: keepPreviousData,
    staleTime: 0,
  })
}

export function useMemberOrder(publicId: string) {
  return useQuery({
    queryKey: [...memberOrdersQueryKey, 'detail', publicId],
    queryFn: async ({ signal }) =>
      (
        await apiGet<ApiItemResponse<MemberOrderDetailDto>>(
          `${ORDER_API_PATHS.accountOrders}/${encodeURIComponent(publicId)}`,
          undefined,
          signal,
        )
      ).data,
    staleTime: 0,
  })
}
