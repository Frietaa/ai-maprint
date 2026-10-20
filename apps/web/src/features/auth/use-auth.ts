// Authentication server state via TanStack Query. `auth/me` is the single
// source of truth for "who is signed in"; there is no separate context store
// and nothing about the session is persisted in the browser.
import {
  type ApiItemResponse,
  AUTH_API_PATHS,
  type AuthUserDto,
  type GoogleLoginRequest,
  type LoginRequest,
  type RegisterRequest,
} from '@maba-printing/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { apiGet, apiSend, resetCsrfToken } from '../../lib/api-client.ts'

export const currentUserQueryKey = ['auth', 'me'] as const
// Prefix of every query that depends on the signed-in account.
export const accountQueryKey = ['account'] as const

// The signed-in account, or null when signed out.
export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: async ({ signal }) => {
      const body = await apiGet<ApiItemResponse<AuthUserDto | null>>(
        AUTH_API_PATHS.me,
        undefined,
        signal,
      )
      return body.data
    },
  })
}

// Shared success handling of every sign-in path: the server rotated the
// session (new CSRF token) and the new account becomes `auth/me`.
function useSignedIn() {
  const queryClient = useQueryClient()
  return (user: AuthUserDto) => {
    resetCsrfToken()
    queryClient.removeQueries({ queryKey: accountQueryKey })
    queryClient.setQueryData(currentUserQueryKey, user)
  }
}

export function useLogin() {
  const onSignedIn = useSignedIn()
  return useMutation({
    mutationFn: async (input: LoginRequest) =>
      (
        await apiSend<ApiItemResponse<AuthUserDto>>(
          'POST',
          AUTH_API_PATHS.login,
          input,
        )
      ).data,
    onSuccess: onSignedIn,
    gcTime: 0,
  })
}

export function useRegister() {
  const onSignedIn = useSignedIn()
  return useMutation({
    mutationFn: async (input: RegisterRequest) =>
      (
        await apiSend<ApiItemResponse<AuthUserDto>>(
          'POST',
          AUTH_API_PATHS.register,
          input,
        )
      ).data,
    onSuccess: onSignedIn,
    gcTime: 0,
  })
}

// Mutation variables (passwords, the Google credential) live only in memory
// while the form is mounted; gcTime 0 drops them as soon as it unmounts.
// Nothing is persisted. The Google credential goes straight to the API
// verifier.
export function useGoogleLogin() {
  const onSignedIn = useSignedIn()
  return useMutation({
    mutationFn: async (input: GoogleLoginRequest) =>
      (
        await apiSend<ApiItemResponse<AuthUserDto>>(
          'POST',
          AUTH_API_PATHS.google,
          input,
        )
      ).data,
    onSuccess: onSignedIn,
    gcTime: 0,
  })
}

// Server-side logout. The caller leaves the protected page first and then
// clears the cached session (useClearSession), so the member guard never
// redirects to the login page on the way out.
export function useLogout() {
  return useMutation({
    mutationFn: () =>
      apiSend<ApiItemResponse<null>>('POST', AUTH_API_PATHS.logout),
    onSuccess: () => {
      resetCsrfToken()
    },
  })
}

// Forgets everything known about the signed-out account (stable identity).
export function useClearSession() {
  const queryClient = useQueryClient()
  return useCallback(() => {
    queryClient.removeQueries({ queryKey: accountQueryKey })
    queryClient.setQueryData(currentUserQueryKey, null)
  }, [queryClient])
}
