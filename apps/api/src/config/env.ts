// Server-only configuration. Never import this from apps/web.
import { type LogLevel, parseLogLevel } from '../observability/logger.js'
import {
  parseUploadLimits,
  type UploadLimits,
} from '../uploads/upload-policy.js'

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
  // Private file storage for order documents. Only the local adapter
  // exists; production object storage is chosen at deployment.
  storageProvider: StorageProvider
  uploadLimits: UploadLimits
  // Where rate-limit counters live (KI-015): shared PostgreSQL table or
  // this process's memory.
  rateLimitStore: RateLimitStoreKind
  // LOG_LEVEL: debug, info (default), warn, error or silent.
  logLevel: LogLevel
  // Malware scanning of uploads (UPLOAD_SCANNER, KI-019).
  uploadScanner: UploadScannerConfig
  // Session cookie SameSite policy (SESSION_COOKIE_SAMESITE, KI-022).
  sessionCookieSameSite: 'lax' | 'strict' | 'none'
}

export type UploadScannerConfig =
  | { kind: 'none' }
  | { kind: 'clamav'; host: string; port: number; timeoutMs: number }

export type RateLimitStoreKind = 'memory' | 'postgres'

// Implemented StorageService adapters (storage/storage-factory.ts).
export type StorageProvider = 'local'

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

// STORAGE_PROVIDER: unset or "local". Local disk storage is for development
// only and refused when NODE_ENV=production.
export function parseStorageProvider(
  raw: string | undefined,
  production: boolean,
): StorageProvider {
  if (raw !== undefined && raw !== 'local') {
    throw new Error('Invalid STORAGE_PROVIDER: only "local" is supported')
  }
  if (production) {
    throw new Error(
      'STORAGE_PROVIDER "local" is for development only; configure private object storage for production',
    )
  }
  return 'local'
}

// RATE_LIMIT_STORE: "postgres" (shared by all instances, survives restarts)
// or "memory" (this process only). Default: postgres in production, memory
// elsewhere.
export function parseRateLimitStore(
  raw: string | undefined,
  production: boolean,
): RateLimitStoreKind {
  if (raw === undefined) return production ? 'postgres' : 'memory'
  if (raw !== 'memory' && raw !== 'postgres') {
    throw new Error('Invalid RATE_LIMIT_STORE: expected "postgres" or "memory"')
  }
  return raw
}

const DEFAULT_CLAMAV_PORT = 3310
const DEFAULT_CLAMAV_TIMEOUT_MS = 30_000

function parseBoundedInt(
  name: string,
  raw: string | undefined,
  fallback: number,
  max: number,
): number {
  if (raw === undefined) return fallback
  const value = Number(raw)
  if (!/^\d+$/.test(raw) || value < 1 || value > max) {
    throw new Error(`Invalid ${name}: expected an integer between 1 and ${max}`)
  }
  return value
}

// UPLOAD_SCANNER: "clamav" (CLAMAV_HOST required; CLAMAV_PORT default 3310,
// CLAMAV_TIMEOUT_MS default 30000) or "none". Production refuses to start
// without an explicit value, so running without malware scanning is always
// a deliberate operator decision.
export function parseUploadScanner(
  env: Env,
  production: boolean,
): UploadScannerConfig {
  const raw = readOptional(env, 'UPLOAD_SCANNER')
  if (raw === undefined) {
    if (production) {
      throw new Error(
        'Missing required environment variable: UPLOAD_SCANNER (set "clamav", or "none" to accept uploads without malware scanning)',
      )
    }
    return { kind: 'none' }
  }
  if (raw === 'none') return { kind: 'none' }
  if (raw !== 'clamav') {
    throw new Error('Invalid UPLOAD_SCANNER: expected "clamav" or "none"')
  }
  return {
    kind: 'clamav',
    host: readRequired(env, 'CLAMAV_HOST'),
    port: parseBoundedInt(
      'CLAMAV_PORT',
      readOptional(env, 'CLAMAV_PORT'),
      DEFAULT_CLAMAV_PORT,
      65_535,
    ),
    timeoutMs: parseBoundedInt(
      'CLAMAV_TIMEOUT_MS',
      readOptional(env, 'CLAMAV_TIMEOUT_MS'),
      DEFAULT_CLAMAV_TIMEOUT_MS,
      600_000,
    ),
  }
}

// SESSION_COOKIE_SAMESITE: "lax" (default; website and API on the same
// site, e.g. www.example.id + api.example.id), "strict", or "none" for an
// explicit cross-site deployment — allowed only in production, where the
// cookie is Secure. Third-party cookie blocking in browsers makes "none"
// unreliable, so a same-site topology is strongly preferred (KI-022).
export function parseSessionCookieSameSite(
  raw: string | undefined,
  production: boolean,
): 'lax' | 'strict' | 'none' {
  if (raw === undefined) return 'lax'
  if (raw !== 'lax' && raw !== 'strict' && raw !== 'none') {
    throw new Error(
      'Invalid SESSION_COOKIE_SAMESITE: expected "lax", "strict" or "none"',
    )
  }
  if (raw === 'none' && !production) {
    throw new Error(
      'SESSION_COOKIE_SAMESITE=none requires NODE_ENV=production (Secure cookies over HTTPS)',
    )
  }
  return raw
}

// Production settings that are valid but often wrong; reported as warnings
// at start-up (names only, never values).
export function productionWarnings(config: ApiConfig): string[] {
  if (!config.production) return []
  const warnings: string[] = []
  if (config.trustProxy === false) {
    warnings.push(
      'TRUST_PROXY is unset: behind a TLS-terminating proxy, Secure session cookies are not set and rate limits see the proxy IP',
    )
  }
  if (config.allowedOrigins.length === 0) {
    warnings.push(
      'FRONTEND_URL is unset: only same-origin (reverse-proxied) browser access works',
    )
  }
  if (config.allowedOrigins.some((origin) => origin.startsWith('http:'))) {
    warnings.push('FRONTEND_URL contains a non-https origin')
  }
  if (config.uploadScanner.kind === 'none') {
    warnings.push('UPLOAD_SCANNER=none: uploads are not scanned for malware')
  }
  if (config.rateLimitStore === 'memory') {
    warnings.push(
      'RATE_LIMIT_STORE=memory: limits are per process and reset on restart',
    )
  }
  return warnings
}

export function loadConfig(env: Env = process.env): ApiConfig {
  const production = readOptional(env, 'NODE_ENV') === 'production'
  return {
    port: parsePort(readOptional(env, 'PORT')),
    allowedOrigins: parseAllowedOrigins(readOptional(env, 'FRONTEND_URL')),
    production,
    sessionSecret: parseSessionSecret(readOptional(env, 'SESSION_SECRET')),
    databaseUrl: readRequired(env, 'DATABASE_URL'),
    trustProxy: parseTrustProxy(readOptional(env, 'TRUST_PROXY')),
    googleClientId: readOptional(env, 'GOOGLE_CLIENT_ID') ?? null,
    storageProvider: parseStorageProvider(
      readOptional(env, 'STORAGE_PROVIDER'),
      production,
    ),
    uploadLimits: parseUploadLimits(
      readOptional(env, 'UPLOAD_MAX_FILES'),
      readOptional(env, 'UPLOAD_MAX_FILE_SIZE'),
    ),
    rateLimitStore: parseRateLimitStore(
      readOptional(env, 'RATE_LIMIT_STORE'),
      production,
    ),
    logLevel: parseLogLevel(readOptional(env, 'LOG_LEVEL')),
    uploadScanner: parseUploadScanner(env, production),
    sessionCookieSameSite: parseSessionCookieSameSite(
      readOptional(env, 'SESSION_COOKIE_SAMESITE'),
      production,
    ),
  }
}
