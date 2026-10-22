// Image references (business_settings.logo_ref / qris_image_ref,
// products.image_ref) are owner-configured strings. Only references a
// browser can load safely are ever rendered or published:
// - absolute https URLs with a host (no credentials, whitespace or
//   backslashes);
// - root-relative paths served by the website itself ("/brand/qris.png"),
//   never protocol-relative ("//host", "/\host") and without "..".
// Anything else — http, data:, javascript:, bare storage keys such as the
// development seed's "dev/placeholder-logo.png" — yields null, and the
// caller shows its placeholder or nothing.

const HTTPS_URL = /^https:\/\/[^\s/\\?#@]+(?:[/?#][^\s\\]*)?$/i
const ROOT_PATH = /^\/(?![/\\])[^\s\\]*$/

export function safeImageRef(ref: string | null | undefined): string | null {
  const value = ref?.trim()
  if (!value) return null
  if (value.startsWith('/')) {
    return ROOT_PATH.test(value) && !value.includes('..') ? value : null
  }
  return HTTPS_URL.test(value) ? value : null
}
