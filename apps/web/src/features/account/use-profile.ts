import {
  ACCOUNT_API_PATHS,
  type ApiItemResponse,
  type AuthUserDto,
  type ProfileDto,
  type UpdateProfileRequest,
} from '@maba-printing/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, apiGet, apiSend } from '../../lib/api-client.ts'
import { accountQueryKey, currentUserQueryKey } from '../auth/use-auth.ts'

export const profileQueryKey = [...accountQueryKey, 'profile'] as const

// A 401 means the session ended server-side (logout elsewhere, expiry,
// deactivation): refresh `auth/me` so the member guard reacts.
function useOnUnauthenticated() {
  const queryClient = useQueryClient()
  return (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      void queryClient.invalidateQueries({ queryKey: currentUserQueryKey })
    }
  }
}

export function useProfile({ enabled = true }: { enabled?: boolean } = {}) {
  const onUnauthenticated = useOnUnauthenticated()
  return useQuery({
    enabled,
    queryKey: profileQueryKey,
    queryFn: async ({ signal }) => {
      try {
        const body = await apiGet<ApiItemResponse<ProfileDto>>(
          ACCOUNT_API_PATHS.profile,
          undefined,
          signal,
        )
        return body.data
      } catch (error) {
        onUnauthenticated(error)
        throw error
      }
    },
    // Own data: always show the current state when the page opens.
    staleTime: 0,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const onUnauthenticated = useOnUnauthenticated()
  return useMutation({
    mutationFn: async (input: UpdateProfileRequest) =>
      (
        await apiSend<ApiItemResponse<ProfileDto>>(
          'PATCH',
          ACCOUNT_API_PATHS.profile,
          input,
        )
      ).data,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey, profile)
      // The header shows the account; keep its name in sync.
      queryClient.setQueryData<AuthUserDto | null>(
        currentUserQueryKey,
        (user) => (user ? { ...user, name: profile.name } : user),
      )
    },
    onError: onUnauthenticated,
  })
}
