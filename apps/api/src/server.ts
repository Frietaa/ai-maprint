import { existsSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { createApp } from './app.js'
import { loadConfig } from './config/env.js'
import {
  createPgSessionStore,
  DEFAULT_PRUNE_INTERVAL_SECONDS,
} from './db/session-store.js'
import { createGoogleVerifier } from './services/google-identity.js'
import { createLocalStorage } from './storage/local-storage.js'

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

// Private local document storage (development): apps/api/.local-storage/,
// git-ignored and never served. In-flight uploads go to a private temp dir.
const storageRoot = fileURLToPath(
  new URL('../.local-storage/', import.meta.url),
)
const uploadTempDir = path.join(tmpdir(), 'maba-printing-uploads')
mkdirSync(storageRoot, { recursive: true })
mkdirSync(uploadTempDir, { recursive: true })

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
  orders: {
    storage: createLocalStorage(storageRoot),
    uploadTempDir,
    uploadLimits: config.uploadLimits,
  },
}).listen(config.port, () => {
  console.log(`API listening on port ${config.port}`)
})
