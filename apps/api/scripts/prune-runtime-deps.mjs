// Container build step (apps/api/Dockerfile): keep only the packages the
// built API can load at runtime. `npm ci --omit=dev` still installs every
// workspace's production dependencies (the website's React) and optional
// peer dependencies (the Prisma CLI, TypeScript), so this computes the
// closure of the API's and the shared package's production dependencies from
// package-lock.json — dependencies, optional dependencies and required
// (non-optional) peers, resolved with Node's node_modules lookup — and
// deletes every other installed package. Platform-specific optional
// packages that are not installed (other CPUs/OSes) are simply skipped.
//
//   node apps/api/scripts/prune-runtime-deps.mjs [--dry-run]   (run from /app)
import { existsSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const lock = JSON.parse(
  readFileSync(path.join(root, 'package-lock.json'), 'utf8'),
)
const packages = lock.packages
const dryRun = process.argv.includes('--dry-run')

// Where Node would find `name` when required from the package at `from`.
function resolve(from, name) {
  let dir = from
  for (;;) {
    const candidate = dir
      ? `${dir}/node_modules/${name}`
      : `node_modules/${name}`
    if (packages[candidate]) return candidate
    if (!dir) return null
    const index = dir.lastIndexOf('/node_modules/')
    dir = index === -1 ? '' : dir.slice(0, index)
  }
}

function runtimeDeps(entry) {
  const optionalPeers = new Set(
    Object.entries(entry.peerDependenciesMeta ?? {})
      .filter(([, meta]) => meta.optional)
      .map(([name]) => name),
  )
  return [
    ...Object.keys(entry.dependencies ?? {}),
    ...Object.keys(entry.optionalDependencies ?? {}),
    ...Object.keys(entry.peerDependencies ?? {}).filter(
      (name) => !optionalPeers.has(name),
    ),
  ]
}

const keep = new Set()
const queue = ['apps/api', 'packages/shared']
while (queue.length > 0) {
  const at = queue.pop()
  if (keep.has(at)) continue
  keep.add(at)
  const entry = packages[at]
  if (!entry) continue
  // Workspace links: node_modules/@maba-printing/x -> packages/x.
  if (entry.link && entry.resolved) queue.push(entry.resolved)
  for (const name of runtimeDeps(entry)) {
    const target = resolve(at, name)
    if (target) queue.push(target)
  }
}

let removed = 0
const installed = Object.keys(packages)
  .filter((key) => key.includes('node_modules/'))
  .sort((a, b) => a.length - b.length)
for (const key of installed) {
  if (keep.has(key)) continue
  const dir = path.join(root, key)
  // Skip children of an already removed directory and uninstalled optionals.
  if (!existsSync(dir)) continue
  removed += 1
  if (!dryRun) rmSync(dir, { recursive: true, force: true })
}
console.log(
  `${dryRun ? 'Would remove' : 'Removed'} ${removed} packages; kept ${keep.size - 2} runtime packages.`,
)
