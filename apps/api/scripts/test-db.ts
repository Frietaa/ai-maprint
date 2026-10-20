// LOCAL TEST DATABASE setup (maba_printing_test only).
//
//   prepare  create the test database if missing, then apply the committed
//            migrations (prisma migrate deploy) and verify status and drift.
//   rebuild  drop and recreate ONLY maba_printing_test, then as prepare.
//            Proves the schema can be rebuilt from migration history alone.
//
// The target comes from TEST_DATABASE_URL and must pass the guard in
// test-database.ts; the database dropped/created is always the constant
// TEST_DATABASE_NAME, never a name taken from input. The development
// database is never touched.
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import pg from 'pg'
import { createTestDbClient, removeE2eFixtures } from './e2e-fixtures.js'
import {
  assertCurrentDatabase,
  loadTestDatabaseUrl,
  TEST_DATABASE_NAME,
} from './test-database.js'

const command = process.argv[2]
if (command !== 'prepare' && command !== 'rebuild') {
  console.error('Usage: tsx scripts/test-db.ts <prepare|rebuild>')
  process.exit(2)
}

const testUrl = loadTestDatabaseUrl()

// Same server and credentials, maintenance database "postgres", used only
// to check for / create / drop the test database.
const adminUrl = new URL(testUrl)
adminUrl.pathname = '/postgres'

async function withAdmin(
  run: (client: pg.Client) => Promise<void>,
): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl.toString() })
  await client.connect()
  try {
    await run(client)
  } finally {
    await client.end()
  }
}

const quotedName = `"${TEST_DATABASE_NAME}"`

async function ensureDatabase(rebuild: boolean): Promise<void> {
  await withAdmin(async (client) => {
    if (rebuild) {
      await client.query(`DROP DATABASE IF EXISTS ${quotedName} WITH (FORCE)`)
      console.log(`Dropped ${TEST_DATABASE_NAME} (if it existed).`)
    }
    const found = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [TEST_DATABASE_NAME],
    )
    if (found.rowCount === 0) {
      await client.query(`CREATE DATABASE ${quotedName}`)
      console.log(`Created ${TEST_DATABASE_NAME}.`)
    }
  })

  // Confirm the identity from the server side before running migrations.
  const client = new pg.Client({ connectionString: testUrl.toString() })
  await client.connect()
  try {
    const result = await client.query<{ name: string }>(
      'SELECT current_database() AS name',
    )
    assertCurrentDatabase(result.rows[0]?.name)
  } finally {
    await client.end()
  }
}

// Prisma CLI with DATABASE_URL replaced by the test URL for this child only
// (prisma.config.ts does not override variables that are already set).
// The installed CLI runs via node directly: no shell, no argument parsing.
const prismaCli = createRequire(import.meta.url).resolve(
  'prisma/build/index.js',
)

function prisma(args: string[]): { status: number | null; output: string } {
  const result = spawnSync(process.execPath, [prismaCli, ...args], {
    env: { ...process.env, DATABASE_URL: testUrl.toString() },
    encoding: 'utf8',
  })
  const output = `${result.stdout}${result.stderr}`
  process.stdout.write(output)
  return { status: result.status, output }
}

function migrate(): void {
  // Read-only first: prove Prisma resolves the test database.
  const status = prisma(['migrate', 'status'])
  if (!status.output.includes(`"${TEST_DATABASE_NAME}"`)) {
    throw new Error(`Prisma did not target ${TEST_DATABASE_NAME}; aborting`)
  }
  if (prisma(['migrate', 'deploy']).status !== 0) {
    throw new Error('prisma migrate deploy failed')
  }
  if (prisma(['migrate', 'status']).status !== 0) {
    throw new Error('prisma migrate status reports a problem')
  }
  // Exit code 2 = the migrated database differs from schema.prisma.
  const drift = prisma([
    'migrate',
    'diff',
    '--from-config-datasource',
    '--to-schema',
    'prisma/schema.prisma',
    '--exit-code',
  ])
  if (drift.status !== 0) {
    throw new Error('Test database differs from schema.prisma (drift)')
  }
}

// Leftover E2E fixtures (e.g. from an interrupted Playwright run) would
// break the empty-database assumption of the DB tests; remove them.
async function removeE2eLeftovers(): Promise<void> {
  const db = createTestDbClient()
  try {
    await removeE2eFixtures(db)
  } finally {
    await db.$disconnect()
  }
}

try {
  await ensureDatabase(command === 'rebuild')
  migrate()
  await removeE2eLeftovers()
  console.log(`Test database ${TEST_DATABASE_NAME} is ready.`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
