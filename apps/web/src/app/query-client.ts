import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../lib/api-client.ts'

// Retry once for transient failures (network, 5xx); never for 4xx, which
// will not change on retry.
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false
  if (error instanceof ApiError) {
    return error.kind === 'network' || (error.status ?? 0) >= 500
  }
  return false
}

// Public catalog data changes rarely: keep it fresh for five minutes and do
// not refetch merely because the window regained focus.
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
    },
  })
}
