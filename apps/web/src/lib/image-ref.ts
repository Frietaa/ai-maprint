// Browser-safe image references; the one definition lives in
// @maba-printing/shared (also used by the API before publishing a
// reference). Unsafe references return null and the caller shows its
// placeholder.
import { safeImageRef } from '@maba-printing/shared'

export function resolveImageRef(ref: string | null | undefined): string | null {
  return safeImageRef(ref)
}
