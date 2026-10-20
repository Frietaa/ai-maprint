import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'
import { loadConfig } from './config/env.js'

// Optional local file apps/api/.env (resolved from src/ or dist/).
// Variables already set in the real environment take precedence.
const envFile = fileURLToPath(new URL('../.env', import.meta.url))
if (existsSync(envFile)) {
  process.loadEnvFile(envFile)
}

const { port } = loadConfig()

createApp().listen(port, () => {
  console.log(`API listening on port ${port}`)
})
