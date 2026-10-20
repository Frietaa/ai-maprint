import { existsSync } from 'node:fs'
import { defineConfig } from 'prisma/config'

// Same strategy as src/server.ts: optional apps/api/.env, real environment
// variables take precedence. Prisma CLI runs with apps/api as cwd.
if (existsSync('.env')) {
  process.loadEnvFile('.env')
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Synthetic local development data; run explicitly with `npm run db:seed`.
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Optional here so validate/generate work without a database;
    // migrate/studio commands fail clearly when it is missing.
    url: process.env.DATABASE_URL,
  },
})
