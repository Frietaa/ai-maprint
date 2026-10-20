import {
  type ApiItemResponse,
  PUBLIC_API_PATHS,
  type PublicSettingsDto,
} from '@maba-printing/shared'
import { useQuery } from '@tanstack/react-query'
import { brand } from '../../config/brand.ts'
import { apiGet } from '../../lib/api-client.ts'
import { resolveImageRef } from '../../lib/image-ref.ts'

export const publicSettingsQueryKey = ['public', 'settings'] as const

// Database-authoritative business information (KI-011). `data` is null when
// the owner has not configured settings yet.
export function usePublicSettings() {
  return useQuery({
    queryKey: publicSettingsQueryKey,
    queryFn: async ({ signal }) => {
      const body = await apiGet<ApiItemResponse<PublicSettingsDto | null>>(
        PUBLIC_API_PATHS.settings,
        undefined,
        signal,
      )
      return body.data
    },
  })
}

// Display identity for the shell and pages. Falls back to the static
// display name while loading, on error, or when settings are not configured,
// so a settings failure never breaks the page.
export function useBusinessIdentity() {
  const { data: settings } = usePublicSettings()
  return {
    settings: settings ?? null,
    name: settings?.businessName ?? brand.fallbackName,
    logoSrc: resolveImageRef(settings?.logoRef),
  }
}
