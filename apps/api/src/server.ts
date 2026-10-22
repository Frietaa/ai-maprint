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
import { getPrisma } from './db/prisma.js'
import { postgresRateLimitStores } from './middleware/rate-limit-store.js'
import {
  createLogger,
  errorCategory,
  logger,
  setLogger,
} from './observability/logger.js'
import { createGoogleVerifier } from './services/google-identity.js'
import { createClamavScanner, noScanner } from './uploads/file-scanner.js'
import {
  createStorageFromConfig,
  DEFAULT_LOCAL_STORAGE_ROOT,
} from './storage/storage-factory.js'

// Optional local file apps/api/.env (resolved from src/ or dist/).
// Variables already set in the real environment take precedence.
const envFile = fileURLToPath(new URL('../.env', import.meta.url))
if (existsSync(envFile)) {
  process.loadEnvFile(envFile)
}

// Fails fast (naming the variable, never its value) when SESSION_SECRET or
// DATABASE_URL is missing or invalid.
const config = loadConfig()
setLogger(createLogger({ level: config.logLevel }))

// Small dedicated pool for the session store. Connections open lazily, so
// /api/v1/health still works while the database is unreachable.
const sessionPool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 5,
})
sessionPool.on('error', (error) => {
  logger().error('db.session_pool_error', { category: errorCategory(error) })
})

// Private document storage chosen by STORAGE_PROVIDER (storage-factory.ts):
// today the local development adapter (apps/api/.local-storage/,
// git-ignored, never served). In-flight uploads go to a private temp dir.
if (config.storageProvider === 'local') {
  mkdirSync(DEFAULT_LOCAL_STORAGE_ROOT, { recursive: true })
}
const storage = createStorageFromConfig({ provider: config.storageProvider })
const uploadTempDir = path.join(tmpdir(), 'maba-printing-uploads')
mkdirSync(uploadTempDir, { recursive: true })

createApp({
  allowedOrigins: config.allowedOrigins,
  trustProxy: config.trustProxy,
  rateLimitStores:
    config.rateLimitStore === 'postgres'
      ? postgresRateLimitStores(getPrisma)
      : undefined,
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
    storage,
    scanner:
      config.uploadScanner.kind === 'clamav'
        ? createClamavScanner(config.uploadScanner)
        : noScanner,
    uploadTempDir,
    uploadLimits: config.uploadLimits,
  },
}).listen(config.port, () => {
  logger().info('server.started', {
    port: config.port,
    production: config.production,
    storageProvider: config.storageProvider,
    rateLimitStore: config.rateLimitStore,
    uploadScanner: config.uploadScanner.kind,
  })
})
