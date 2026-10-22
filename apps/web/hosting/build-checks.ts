// Build-time checks for the website (vite.config.ts). A production build
// must call the API over HTTPS — the session cookie is Secure in production —
// so plain http is accepted only for local hosts (tests, `vite preview`).
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

export function checkProductionApiUrl(
  raw: string | undefined,
  mode: string,
): void {
  const value = raw?.trim()
  if (mode !== 'production' || !value) return
  const url = new URL(value)
  if (url.protocol !== 'https:' && !LOCAL_HOSTS.has(url.hostname)) {
    throw new Error('VITE_API_BASE_URL must use https for production builds')
  }
}
