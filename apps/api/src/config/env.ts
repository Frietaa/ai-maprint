// Server-only configuration. Never import this from apps/web.

export interface ApiConfig {
  port: number
  // Browser origins allowed to call the API cross-origin (CORS allowlist).
  allowedOrigins: string[]
  // NODE_ENV=production: Secure cookies, no development conveniences.
  production: boolean
  // Signs the session cookie. Required, server-only, never logged.
  sessionSecret: string
  // PostgreSQL connection for the session store (same database as Prisma).
  databaseUrl: string
  // Number of trusted reverse-proxy hops (Express "trust proxy"); false =
  // the API is reached directly.
  trustProxy: number | false
  // Google OAuth client ID used as the ID-token audience; null disables
  // Google Sign-In (email/password keeps working).
  googleClientId: string | null
}

type Env = Record<string, string | undefined>

// Non-secret local development fallback used when PORT is unset.
const DEFAULT_PORT = 3000

function readOptional(env: Env, name: string): string | undefined {
  const value = env[name]?.trim()
  return value === '' ? undefined : value
}

// Mandatory variables (e.g. DATABASE_URL).
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

// Minimum SESSION_SECRET length. A strong value is random, e.g.
// `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`.
export const SESSION_SECRET_MIN_LENGTH = 32

export function parseSessionSecret(raw: string | undefined): string {
  if (raw === undefined) {
    throw new Error('Missing required environment variable: SESSION_SECRET')
  }
  if (raw.length < SESSION_SECRET_MIN_LENGTH) {
    throw new Error(
      `Invalid SESSION_SECRET: expected at least ${SESSION_SECRET_MIN_LENGTH} characters`,
    )
  }
  return raw
}

// TRUST_PROXY: unset/empty = no proxy; otherwise the number of proxy hops in
// front of the API (e.g. 1 behind a single load balancer). Needed for
// correct client IPs (rate limiting) and Secure cookies behind TLS proxies.
export function parseTrustProxy(raw: string | undefined): number | false {
  if (raw === undefined) return false
  if (!/^\d+$/.test(raw)) {
    throw new Error('Invalid TRUST_PROXY: expected a number of proxy hops')
  }
  const hops = Number(raw)
  return hops === 0 ? false : hops
}

export function loadConfig(env: Env = process.env): ApiConfig {
  return {
    port: parsePort(readOptional(env, 'PORT')),
    allowedOrigins: parseAllowedOrigins(readOptional(env, 'FRONTEND_URL')),
    production: readOptional(env, 'NODE_ENV') === 'production',
    sessionSecret: parseSessionSecret(readOptional(env, 'SESSION_SECRET')),
    databaseUrl: readRequired(env, 'DATABASE_URL'),
    trustProxy: parseTrustProxy(readOptional(env, 'TRUST_PROXY')),
    googleClientId: readOptional(env, 'GOOGLE_CLIENT_ID') ?? null,
  }
}
