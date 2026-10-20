// Server-only configuration. Never import this from apps/web.

export interface ApiConfig {
  port: number
  // Browser origins allowed to call the API cross-origin (CORS allowlist).
  allowedOrigins: string[]
}

type Env = Record<string, string | undefined>

// Non-secret local development fallback used when PORT is unset.
const DEFAULT_PORT = 3000

function readOptional(env: Env, name: string): string | undefined {
  const value = env[name]?.trim()
  return value === '' ? undefined : value
}

// For variables that become mandatory in later phases (e.g. DATABASE_URL).
// The error names the variable but never echoes a value.
export function readRequired(env: Env, name: string): string {
  const value = readOptional(env, name)
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function parsePort(raw: string | undefined): number {
  if (raw === undefined) return DEFAULT_PORT
  const port = Number(raw)
  if (!/^\d+$/.test(raw) || port < 1 || port > 65535) {
    throw new Error('Invalid PORT: expected an integer between 1 and 65535')
  }
  return port
}

// FRONTEND_URL: one or more comma-separated web origins, e.g.
// "http://localhost:5173". Optional: without it no cross-origin browser
// access is allowed (same-origin/proxied use still works).
export function parseAllowedOrigins(raw: string | undefined): string[] {
  if (raw === undefined) return []
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '')
    .map((entry) => {
      let url: URL
      try {
        url = new URL(entry)
      } catch {
        throw new Error('Invalid FRONTEND_URL: expected http(s) origin(s)')
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Invalid FRONTEND_URL: expected http(s) origin(s)')
      }
      return url.origin
    })
}

export function loadConfig(env: Env = process.env): ApiConfig {
  return {
    port: parsePort(readOptional(env, 'PORT')),
    allowedOrigins: parseAllowedOrigins(readOptional(env, 'FRONTEND_URL')),
  }
}
