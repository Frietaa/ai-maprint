// Image references (business_settings.logo_ref, products.image_ref) are
// owner-configured strings that may be a URL or a not-yet-resolvable storage
// key (e.g. "dev/placeholder-logo.png" in the development seed). Only
// references the browser can load safely are used:
// - absolute https URLs;
// - root-relative paths served by the website itself ("/brand/logo.png").
// Anything else (http, data:, javascript:, protocol-relative, bare keys)
// returns null and the caller shows its placeholder.
export function resolveImageRef(ref: string | null | undefined): string | null {
  const value = ref?.trim()
  if (!value) return null
  if (value.startsWith('/') && !value.startsWith('//')) return value
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}
