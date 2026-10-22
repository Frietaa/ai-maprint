// Operator command: create (or explicitly promote) an ADMIN account in the
// database named by DATABASE_URL (local development by default).
//
//   ADMIN_EMAIL=... ADMIN_NAME=... ADMIN_PASSWORD=... npm run admin:create
//   ... npm run admin:create -- --promote   # promote an existing MEMBER
//
// Credentials come from the environment (e.g. the git-ignored apps/api/.env
// or the shell); nothing is ever printed except the outcome. There is no
// default password and no HTTP route that creates Admins.
import { existsSync } from 'node:fs'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  provisionAdmin,
  ProvisioningError,
} from '../src/admin/admin-provisioning.js'
import { readRequired } from '../src/config/env.js'
import { PrismaClient } from '../src/generated/prisma/client.js'

if (existsSync('.env')) process.loadEnvFile('.env')

const promote = process.argv.includes('--promote')
const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: readRequired(process.env, 'DATABASE_URL'),
  }),
})

try {
  const outcome = await provisionAdmin(db, {
    email: readRequired(process.env, 'ADMIN_EMAIL'),
    name: readRequired(process.env, 'ADMIN_NAME'),
    password: readRequired(process.env, 'ADMIN_PASSWORD'),
    promote,
  })
  const messages = {
    created: 'ADMIN account created.',
    promoted: 'Existing member promoted to ADMIN.',
    'already-admin':
      'An ADMIN with this email already exists; nothing changed.',
  } as const
  console.log(messages[outcome])
} catch (error) {
  // Expected problems explain themselves; anything else prints only its
  // category (no connection details or values).
  console.error(
    error instanceof ProvisioningError ||
      (error instanceof Error && error.message.startsWith('Missing required'))
      ? error.message
      : `Provisioning failed (${error instanceof Error ? error.name : 'error'})`,
  )
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
