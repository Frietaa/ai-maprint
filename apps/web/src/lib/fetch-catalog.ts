// The public catalog is served in bounded pages (KI-012). The website still
// shows the whole (small) catalog — category filters and the ATK request
// form work on the full list — so it reads the pages in order, at most
// MAX_CATALOG_PAGES requests (2,000 rows at the API's page size).
import type { ApiCatalogPageResponse } from '@maba-printing/shared'
import { apiGet, type QueryParams } from './api-client.ts'

export const MAX_CATALOG_PAGES = 20

export async function fetchCatalog<T>(
  path: string,
  params: QueryParams = {},
  signal?: AbortSignal,
): Promise<T[]> {
  const items: T[] = []
  for (let page = 1; page <= MAX_CATALOG_PAGES; page += 1) {
    const body = await apiGet<ApiCatalogPageResponse<T>>(
      path,
      { ...params, page: page > 1 ? String(page) : undefined },
      signal,
    )
    items.push(...body.data)
    // Missing or exhausted page metadata ends the read.
    if (!(body.meta.totalPages > page)) break
  }
  return items
}
