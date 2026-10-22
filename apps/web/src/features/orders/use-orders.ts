// Order server state via TanStack Query (no separate store). Submissions go
// through the single API client: JSON, or FormData when printing documents
// are attached (payload JSON + files), always with credentials and CSRF.
import {
  type ApiItemResponse,
  type ApiPageResponse,
  type CreateOrderRequest,
  IDEMPOTENCY_KEY_HEADER,
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
import { useRef } from 'react'
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

// Random Idempotency-Key (KI-020). crypto.randomUUID needs a secure
// context; getRandomValues also works on plain-http development hosts.
export function newIdempotencyKey(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  )
}

// Identifies "the same submission": the request plus file metadata.
export function submissionFingerprint({
  order,
  files = [],
}: SubmitOrderVariables): string {
  return JSON.stringify([
    order,
    files.map((file) => [file.name, file.size, file.type, file.lastModified]),
  ])
}

// One Idempotency-Key per distinct submission: resending the identical
// request (e.g. after a lost response or network error) reuses the key, so
// the API returns the original order instead of creating a duplicate; any
// change, or a successful submission, starts a new key.
export function useSubmitOrder() {
  const queryClient = useQueryClient()
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null)
  return useMutation({
    mutationFn: async (variables: SubmitOrderVariables) => {
      const fingerprint = submissionFingerprint(variables)
      if (attempt.current?.fingerprint !== fingerprint) {
        attempt.current = { fingerprint, key: newIdempotencyKey() }
      }
      return (
        await apiSend<ApiItemResponse<OrderReceiptDto>>(
          'POST',
          ORDER_API_PATHS.orders,
          toOrderBody(variables),
          { [IDEMPOTENCY_KEY_HEADER]: attempt.current.key },
        )
      ).data
    },
    onSuccess: () => {
      attempt.current = null
      // A member's history now has a new entry.
      return queryClient.invalidateQueries({ queryKey: memberOrdersQueryKey })
    },
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
