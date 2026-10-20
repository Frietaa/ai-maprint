import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { createApp } from './app.js'
import { loadConfig } from './config/env.js'
import {
  createPgSessionStore,
  DEFAULT_PRUNE_INTERVAL_SECONDS,
} from './db/session-store.js'
import { createGoogleVerifier } from './services/google-identity.js'

// Optional local file apps/api/.env (resolved from src/ or dist/).
// Variables already set in the real environment take precedence.
const envFile = fileURLToPath(new URL('../.env', import.meta.url))
if (existsSync(envFile)) {
  process.loadEnvFile(envFile)
}

// Fails fast (naming the variable, never its value) when SESSION_SECRET or
// DATABASE_URL is missing or invalid.
const config = loadConfig()

// Small dedicated pool for the session store. Connections open lazily, so
// /api/v1/health still works while the database is unreachable.
const sessionPool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 5,
})
sessionPool.on('error', (error) => {
  console.error('Session database pool error:', error.name)
})

createApp({
  allowedOrigins: config.allowedOrigins,
  trustProxy: config.trustProxy,
  auth: {
    sessionSecret: config.sessionSecret,
    sessionStore: createPgSessionStore(sessionPool, {
      pruneIntervalSeconds: DEFAULT_PRUNE_INTERVAL_SECONDS,
    }),
    secureCookies: config.production,
    googleVerifier: config.googleClientId
      ? createGoogleVerifier(config.googleClientId)
      : null,
  },
}).listen(config.port, () => {
  console.log(`API listening on port ${config.port}`)
})
