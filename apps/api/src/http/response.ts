import type { ApiItemResponse, ApiListResponse } from '@maba-printing/shared'

// Standard success envelopes (Architecture §14). Collections report only a
// count: the public catalog is small and not paginated yet (KI-012).
export function itemResponse<T>(data: T): ApiItemResponse<T> {
  return { data }
}

export function listResponse<T>(data: T[]): ApiListResponse<T> {
  return { data, meta: { count: data.length } }
}
