// Migration integrity check (ADR-020, Architecture §50): applied migrations
// must never change. apps/api/prisma/migration-manifest.json records the
// SHA-256 of every committed migration.sql (line endings normalized, see
// KI-009). This check fails when a recorded migration was edited, deleted
// or reordered, or when a new migration is not recorded yet.
//
//   npm run check:migrations                 verify (CI)
//   npm run check:migrations -- --record     append NEW migrations only
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const migrationsDir = path.join(root, 'apps/api/prisma/migrations')
const manifestPath = path.join(root, 'apps/api/prisma/migration-manifest.json')
const record = process.argv.includes('--record')

function hashOf(name) {
  const sql = readFileSync(
    path.join(migrationsDir, name, 'migration.sql'),
    'utf8',
  )
  return createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex')
}

const onDisk = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : {}
const recorded = Object.keys(manifest)
const problems = []

for (const name of recorded) {
  if (!onDisk.includes(name))
    problems.push(`${name}: recorded migration is missing`)
  else if (hashOf(name) !== manifest[name])
    problems.push(`${name}: applied migration was modified`)
}
const last = recorded.at(-1) ?? ''
const added = onDisk.filter((name) => !recorded.includes(name))
for (const name of added) {
  if (!existsSync(path.join(migrationsDir, name, 'migration.sql')))
    problems.push(`${name}: migration.sql missing`)
  else if (name < last)
    problems.push(`${name}: new migration sorts before ${last} (reordering)`)
}

if (problems.length > 0) {
  console.error(`Migration integrity check failed:\n- ${problems.join('\n- ')}`)
  process.exit(1)
}
if (added.length > 0 && !record) {
  console.error(
    `Unrecorded migration(s): ${added.join(', ')}\nReview the SQL, then run: npm run check:migrations -- --record`,
  )
  process.exit(1)
}
if (added.length > 0) {
  for (const name of added) manifest[name] = hashOf(name)
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`Recorded: ${added.join(', ')}`)
}
console.log(`Migrations OK (${onDisk.length} recorded, unchanged).`)
