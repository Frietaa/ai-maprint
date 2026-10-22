import type {
  ApiCatalogPageResponse,
  ApiItemResponse,
  ApiListResponse,
} from '@maba-printing/shared'

// Standard success envelopes (Architecture §14). Unpaginated collections
// (locations: a handful of physical sites) report a count; the catalog is
// served in bounded pages (KI-012).
export function itemResponse<T>(data: T): ApiItemResponse<T> {
  return { data }
}

export function listResponse<T>(data: T[]): ApiListResponse<T> {
  return { data, meta: { count: data.length } }
}

export function catalogPage<T>(
  data: T[],
  { page, pageSize }: { page: number; pageSize: number },
  total: number,
): ApiCatalogPageResponse<T> {
  return {
    data,
    meta: {
      count: data.length,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}
