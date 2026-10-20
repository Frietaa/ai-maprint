// Server-only configuration. Never import this from apps/web.

export interface ApiConfig {
  port: number
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

export function loadConfig(env: Env = process.env): ApiConfig {
  return { port: parsePort(readOptional(env, 'PORT')) }
}
