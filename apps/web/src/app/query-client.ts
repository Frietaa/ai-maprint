import { QueryCache, QueryClient } from '@tanstack/react-query'
import {
  accountQueryKey,
  currentUserQueryKey,
} from '../features/auth/use-auth.ts'
import { adminQueryKey } from '../features/admin/use-admin.ts'
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

const SESSION_SCOPED = new Set<unknown>([accountQueryKey[0], adminQueryKey[0]])

// Public catalog data changes rarely: keep it fresh for five minutes and do
// not refetch merely because the window regained focus.
//
// A 401 from an account or Admin query means the session expired while the
// page was open: re-check `auth/me`, so the route guards send the visitor to
// the login page instead of leaving a dead error card.
export function createQueryClient(): QueryClient {
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (
          error instanceof ApiError &&
          error.status === 401 &&
          SESSION_SCOPED.has(query.queryKey[0])
        ) {
          void client.invalidateQueries({ queryKey: currentUserQueryKey })
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
    },
  })
  return client
}
