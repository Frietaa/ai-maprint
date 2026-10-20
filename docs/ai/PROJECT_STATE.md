\# MABA PRINTING — Project State



\## Project



Name: MABA PRINTING

Version: MVP 1.0

Status: IMPLEMENTATION



\## Current Stage



Phase 00 (Repository \& Tooling) ACCEPTED and COMPLETE (2026-10-20).



Foundation-only implementation exists: React + Vite web shell

(heading and foundation message), Express API with only

GET /api/v1/health, empty shared package, plus TypeScript, lint,

format, environment, test and root-script tooling. No business

features, database, authentication or production UI exist.



Phase 01 (Application \& Data Foundation): ACCEPTED and COMPLETE

(human-approved 2026-10-20).

TASK-01.01 added the Prisma 7 + PostgreSQL tooling foundation

and a Docker-based local development PostgreSQL 17

(compose.dev.yml); Prisma connectivity verified. TASK-01.02 added

the first domain schema (UserRole, User, Location) and migration.

TASK-01.03 added the catalog schema (services, location-service

availability, ATK products). TASK-01.04 added the order schema

(orders, items, laptop/software extensions). TASK-01.05 added

payments, status history, file metadata, admin audit log and

business settings; the core MVP persistence model is complete.

TASK-01.06 hardened it with row-level CHECK constraints, a

case-insensitive email index and access-path indexes.

TASK-01.07 added an idempotent synthetic local-development seed.

TASK-01.08 added concrete read repositories for settings,

locations, services and products (no routes).

TASK-01.09 added the separate maba\_printing\_test database workflow

(built from migrations only) and resolved KI-009.



\## Current Phase



Phase 0 — Repository \& Tooling



Status: ACCEPTED / COMPLETE (human-approved 2026-10-20)



Completed tasks: TASK-00.01 (CLOSED 2026-10-20, human-accepted)

TASK-00.02 (COMPLETED 2026-10-20, awaiting human acceptance)

TASK-00.03 (COMPLETED 2026-10-20, awaiting human acceptance)

TASK-00.04 (COMPLETED 2026-10-20, awaiting human acceptance)

TASK-00.05 (COMPLETED 2026-10-20, awaiting human acceptance)

TASK-00.06 (COMPLETED 2026-10-20, awaiting human acceptance)

TASK-00.07 (COMPLETED 2026-10-20, accepted with correction)

TASK-00.08 (COMPLETED 2026-10-20, awaiting human acceptance)

TASK-00.09 (COMPLETED 2026-10-20, awaiting human acceptance)

TASK-00.10 Phase 00 final verification: PASS (2026-10-20)



Phase 00 accepted by human approval (2026-10-20).



Phase 01 — Application \& Data Foundation

Status: ACCEPTED / COMPLETE (human-approved 2026-10-20)

TASK-01.01 (COMPLETED 2026-10-20, awaiting human acceptance;

local Docker PostgreSQL added and Prisma connectivity verified)

TASK-01.02 (COMPLETED 2026-10-20, awaiting human acceptance;

first migration 20261020125104\_core\_identity\_locations applied

to local maba\_printing\_dev)

TASK-01.03 (COMPLETED 2026-10-20, awaiting human acceptance;

migration 20261020130233\_catalog\_foundation applied to local

maba\_printing\_dev)

TASK-01.04 (COMPLETED 2026-10-20, awaiting human acceptance;

migration 20261020132657\_order\_foundation applied to local

maba\_printing\_dev)

TASK-01.05 (COMPLETED 2026-10-20, awaiting human acceptance;

migration 20261020133802\_payment\_history\_files\_audit applied to

local maba\_printing\_dev)

TASK-01.06 (COMPLETED 2026-10-20, awaiting human acceptance;

migration 20261020135726\_database\_constraints\_indexes applied

to local maba\_printing\_dev)

TASK-01.07 (COMPLETED 2026-10-20, awaiting human acceptance;

synthetic seed applied to local maba\_printing\_dev)

TASK-01.08 (COMPLETED 2026-10-20, awaiting human acceptance; no

schema change, no migration)

TASK-01.09 (COMPLETED 2026-10-20, awaiting human acceptance; no

schema change, no migration)

TASK-01.10 Phase 01 final verification: PASS (2026-10-20)

Phase 01 accepted by human approval (2026-10-20).



\## Source of Truth



1\. docs/PRD\_MABA\_PRINTING\_v1.0.md

2\. docs/ARCHITECTURE\_MABA\_PRINTING\_v1.0.md

3\. docs/ai/DECISIONS.md

4\. docs/ai/CURRENT\_TASK.md



\## Completed



\- Product discovery

\- Requirement analysis

\- PRD v1.0

\- Technical Architecture v1.0

\- MVP scope definition

\- AI development workflow definition

\- Repository initialization (TASK-00.01)

\- Frontend foundation: React + Vite + TypeScript (TASK-00.02)

\- Backend foundation: Express + TypeScript (TASK-00.03)

\- Shared package foundation (TASK-00.04)

\- TypeScript configuration standardization (TASK-00.05)

\- Code quality: ESLint + Prettier (TASK-00.06)

\- Environment configuration foundation (TASK-00.07)

\- Testing foundation (TASK-00.08)

\- Unified root scripts; KI-006 resolved (TASK-00.09)



\## In Progress



None.



\## Not Started

\- Authentication

\- Public website

\- Business locations

\- Printing

\- ATK

\- Laptop service

\- Software installation

\- Unified order system

\- File management

\- Order tracking

\- Member area

\- Admin dashboard

\- Payment management

\- WhatsApp deep link

\- Audit system

\- Security hardening

\- E2E testing

\- Deployment



\## Current Technical Stack



Frontend:

React + Vite + TypeScript



Backend:

Node.js + Express + TypeScript



API:

REST / JSON



Database:

PostgreSQL



ORM:

Prisma ORM



Styling:

Tailwind CSS



Validation:

Zod



Authentication:

Server-managed secure authentication/session



Testing:

Vitest

Supertest

React Testing Library

Playwright



Package Manager:

npm



\## Current MVP Roles



\- Guest

\- Member

\- Admin



\## Current MVP Status



No production code exists yet.



Repository contains:

\- root package.json (private, workspaces apps/\*, packages/\*)

\- package-lock.json

\- .gitignore, README.md

\- .env.example (root): canonical environment inventory,

  reference only, not loaded at runtime (removed in TASK-00.07,

  restored by human-requested correction)

\- apps/api/.env.example and apps/web/.env.example: operational

  examples split by owner

\- apps/web: React + Vite + TypeScript foundation

  (@maba-printing/web; minimal neutral shell, no product UI)

\- apps/api: Express + TypeScript foundation

  (@maba-printing/api; only GET /api/v1/health)

\- packages/shared: @maba-printing/shared foundation

  (empty public API; ESM + nodenext; no Node/DOM types).

  Current exports (since TASK-00.09): types -> dist/index.d.ts,

  development -> src/index.ts, default -> dist/index.js. Dev and

  tests use source; production uses dist/ built by tsc via

  packages/shared/tsconfig.build.json.



TypeScript configuration (TASK-00.05):

\- tsconfig.base.json (root) holds common policy only: target

  es2023, strict, verbatimModuleSyntax, moduleDetection force,

  erasableSyntaxOnly, forceConsistentCasingInFileNames,

  skipLibCheck, noUnusedLocals, noUnusedParameters,

  noFallthroughCasesInSwitch.

\- Every workspace config extends it and keeps only

  environment settings (lib, module, moduleResolution, types,

  output): web = bundler + DOM + vite/client; api = nodenext +

  node types; shared = nodenext + no types.

\- Project references (current, since TASK-00.08):

  apps/api/tsconfig.json, apps/api/tsconfig.build.json and

  apps/web/tsconfig.app.json reference

  packages/shared/tsconfig.build.json (composite, references

  nothing). tsc -b in web/api builds shared first.

  \[Superseded TASK-00.05 wording: references targeted

  packages/shared (tsconfig.json).\]

\- Build info files live inside dist/ (shared, api) or

  apps/web/node\_modules/.tmp (web); delete the whole dist/ to

  force a rebuild.

\- When web/api first import shared, also add

  "@maba-printing/shared" to that workspace's package.json.



Code quality (TASK-00.06):

\- One root ESLint flat config (eslint.config.mjs; ESLint 10).

  typescript-eslint 8 recommendedTypeChecked with

  projectService for all TypeScript; type-checked rules

  disabled for plain JS config files.

\- apps/web/src: browser globals + eslint-plugin-react-hooks

  (flat recommended) + eslint-plugin-react-refresh (vite).

  apps/api and apps/web/vite.config.ts: Node globals.

  packages/shared: no environment globals.

\- eslint-config-prettier last, so ESLint does not enforce

  formatting.

\- Prettier 3 (.prettierrc.json): semi false, singleQuote true,

  endOfLine auto (files are CRLF on this Windows checkout with

  core.autocrlf=true; auto keeps existing line endings).

\- .prettierignore: generated output, package-lock.json, and

  docs/ (approved specs and project memory are not reformatted).

\- Scripts: root lint (eslint .), format (prettier --write .),

  format:check (prettier --check .); each workspace has lint

  (eslint .) using the root config.

\- Tool dev dependencies live in the root package.json only.



Environment configuration (TASK-00.07):

\- Ownership: each app owns its env file.

  apps/api/.env (template apps/api/.env.example): server-only

  variables. apps/web/.env (template apps/web/.env.example):

  VITE\_\* browser-visible values only. Server variables never live

  in apps/web, so Vite cannot load them; Vite's default envPrefix

  (VITE\_) and envDir (apps/web) are unchanged.

\- The 16-variable approved inventory is preserved, split by

  owner (server 14, client 2). The root .env.example remains the

  canonical reference inventory (documentation only; nothing

  loads it).

\- Loading: apps/api/src/server.ts loads apps/api/.env with

  Node's built-in process.loadEnvFile when the file exists (path

  resolved from the module, works from src/ and dist/). Real

  environment variables take precedence over .env.

\- Parsing: apps/api/src/config/env.ts. loadConfig() reads PORT

  (optional; fallback 3000; invalid -> startup error).

  readRequired() is the fail-fast helper for variables that

  become mandatory later; its error names the variable and never

  echoes a value.

\- The Phase-00 API requires no variables. NODE\_ENV is read by

  Express itself, not by project code.

\- No dependency added (no dotenv; Zod not justified yet since

  only PORT is parsed).

\- Frontend reads no env yet; no vite-env typing added.



Testing (TASK-00.08):

\- Stack: Vitest 5 (all workspaces), React Testing Library 16 +

  jest-dom 7 + jsdom 30 (web), Supertest 7 (api), Playwright 1.64

  (web E2E, Chromium only in Phase 00).

\- Tests live next to their source as \*.test.ts / \*.test.tsx;

  Playwright specs in apps/web/e2e/\*.spec.ts.

\- Vitest globals are off (explicit imports from 'vitest'). Web

  Vitest config is the `test` block in apps/web/vite.config.ts

  (jsdom, include src/\*\*/\*.test.{ts,tsx}, setup

  src/test/setup.ts with jest-dom matchers and RTL cleanup).

  api/shared use Vitest defaults (no config file).

\- API tests import createApp() from app.ts with Supertest; no

  port is opened by project code.

\- Playwright (apps/web/playwright.config.ts) starts its own Vite

  dev server on port 5179 (strictPort, never reuses an existing

  server) and stops it after the run. Browser binaries are

  per-machine: run `npx playwright install chromium` once.

\- TypeScript split (needed so tests are typechecked and linted

  but never emitted): packages/shared and apps/api now have

  tsconfig.json = no-emit project incl. tests (typecheck, editor,

  ESLint projectService) and tsconfig.build.json = emitting build

  excluding \*.test.ts. Project references (web, api) point to

  packages/shared/tsconfig.build.json. Build scripts use

  `tsc -b tsconfig.build.json`; api typecheck is now `tsc -b`

  (replaces the TASK-00.05 explicit shared build).

\- apps/web/tsconfig.node.json also includes playwright.config.ts

  and e2e/.

\- Scripts: test (vitest run), test:watch (vitest) in every

  workspace; test:e2e (playwright test) in web. Root `test`

  still delegates to workspaces (unit/component only; E2E is not

  in root scripts yet: TASK-00.09).



Root commands and shared resolution (TASK-00.09):

\- packages/shared "exports" is now conditional (supersedes the

  single-string export from TASK-00.04):

  types -> ./dist/index.d.ts, development -> ./src/index.ts,

  default -> ./dist/index.js.

  Dev/test runtimes resolve shared from TypeScript source, so

  no shared build is needed for dev or tests: Vite dev server and

  Vitest apply the "development" condition by default; the api

  dev script runs `tsx watch --conditions=development`.

  Production (node dist/..., vite build) uses default -> dist,

  which `npm run build` creates first. TypeScript types resolve

  via the "types" condition and project references (tsc -b

  builds shared first).

\- Root scripts:

  dev (web + api together via concurrently, --kill-others),

  dev:web, dev:api, build (explicit order shared -> api -> web),

  start:api (production API; run build first), typecheck,

  lint, format, format:check, test (Vitest in all workspaces),

  test:e2e (Playwright in web), clean (removes dist/, TypeScript

  .tmp caches, and test output: test-results, playwright-report,

  coverage; extended at Phase 00 closure).

\- concurrently (root devDependency) runs web and api in

  parallel and stops the whole process tree on Windows when one

  exits; npm alone cannot run two long-running scripts in

  parallel.

\- New machine: `npm install`, then once `npx playwright install

  chromium`; all other commands run from the root with no manual

  build step.



Module system (apps/api): ESM ("type": "module") with

TypeScript module/moduleResolution "nodenext". Relative imports

in API source must use the .js extension (e.g. './app.js').

\- docs/ and docs/ai/



Git: project-local repository exists at maba-printing/.git

(initialized by the owner; branch master). First commit observed

during TASK-01.01: 30251db "chore: establish Phase 00 project

foundation".

See KI-002 / KI-004.



\## Last Verified State



TASK-00.01 implementation verified on 2026-10-20.



npm install: PASS

Workspace configuration: PASS (0 workspace packages yet)

Typecheck / Lint / Tests / Build: NOT\_APPLICABLE



Independent verification on 2026-10-20: FAIL.

Blocking finding F-1: .gitignore rules storage/ and uploads/

matched directories at any depth and would hide future source

code (e.g. StorageService, upload feature files).



Recovery on 2026-10-20: storage/ and uploads/ rules removed;

no replacement storage rule added (storage location not yet

decided). Focused verification after recovery: PASS.



Root scripts build/test/lint/typecheck were executed and

currently exit 1 ("No workspaces found!") because no workspace

package.json exists yet. The corresponding typecheck/lint/

test/build tooling checks are NOT\_APPLICABLE at TASK-00.01.



Workspace globs were confirmed in a scratchpad copy containing

sample workspace packages (npm query .workspace returning \[\]

without an install is not sufficient evidence).



Independent re-verification on 2026-10-20: PASS.

F-1 confirmed fixed; all TASK-00.01 requirements satisfied;

no blocking defect remains.



TASK-00.01 formally accepted by human approval and CLOSED

on 2026-10-20.



Non-blocking consideration for future tooling tasks: KI-005

(.gitignore build/, dist/, logs/ match at any depth).



TASK-00.02 verified on 2026-10-20:

\- apps/web recognized as npm workspace: PASS

\- npm install (root): PASS (0 vulnerabilities)

\- typecheck (tsc -b): PASS

\- production build (tsc -b \&\& vite build): PASS

\- App renders "MABA PRINTING" (Vite SSR render check): PASS

\- vite preview serves index.html (HTTP 200): PASS

\- root typecheck/build scripts: PASS (exit 0)

\- root test/lint scripts: exit 0 only because no workspace

  defines them; lint/test tooling NOT\_APPLICABLE (TASK-00.06/00.08)



TASK-00.03 verified on 2026-10-20:

\- apps/api recognized as npm workspace: PASS

\- dependency installation: PASS (0 vulnerabilities)

\- api typecheck (tsc --noEmit, strict): PASS

\- api production build (tsc): PASS

\- compiled server starts (node dist/server.js): PASS

\- GET /api/v1/health: HTTP 200, body {"status":"ok"}: PASS

\- tsx dev runner serves health endpoint: PASS

\- web typecheck/build still pass: PASS

\- root typecheck/build: PASS; root test/lint exit 0 only

  because no workspace defines them (NOT\_APPLICABLE)

\- temporary server processes stopped; port 3000 freed: PASS



TASK-00.04 verified on 2026-10-20:

\- @maba-printing/shared recognized as npm workspace: PASS

\- shared typecheck (tsc --noEmit, strict): PASS

\- shared build (tsc): PASS

\- entry point: Node import PASS; TypeScript resolution to

  dist/index.d.ts under nodenext and bundler: PASS; deep

  import blocked (ERR\_PACKAGE\_PATH\_NOT\_EXPORTED): PASS

\- web and api typecheck/build still pass: PASS

\- root typecheck/build: PASS; npm ls --all: PASS

\- root test/lint exit 0 only because no workspace defines

  them (NOT\_APPLICABLE)



TASK-00.05 verified on 2026-10-20 (from clean generated-output

state: all dist/, web .tmp and \*.tsbuildinfo removed first):

\- shared/api/web typecheck: PASS

\- shared/api/web build: PASS

\- root typecheck and root build (order api, web, shared): PASS

\- strict explicitly true in all four configs: PASS

\- api NodeNext/ESM and .js imports preserved; compiled api

  serves GET /api/v1/health 200: PASS

\- web Vite build: PASS

\- shared environment-neutral (process/document rejected): PASS

\- no circular references: PASS

\- clean-state consumer probe importing shared: fails without

  reference (TS2307), passes with reference (nodenext and

  bundler): PASS

\- no dependency changes (lockfile unchanged): PASS



TASK-00.06 verified on 2026-10-20:

\- ESLint config loads; lints exactly 7 files (sources,

  vite.config.ts, eslint.config.mjs): PASS

\- root lint and web/api/shared lint: PASS

\- violation probes caught (react-hooks in web; type-aware

  no-floating-promises in api; no-explicit-any/no-unsafe-\* in

  shared): PASS

\- Prettier format:check after formatting: PASS

\- dist/ output, package-lock.json and docs/ ignored by

  ESLint/Prettier: PASS

\- web/api/shared typecheck and build from clean state: PASS

\- root typecheck/build: PASS

\- web render unchanged; api health 200: PASS

\- no runtime dependency added: PASS



TASK-00.07 verified on 2026-10-20:

\- .env files ignored at any depth; both .env.example files

  trackable: PASS

\- PORT parsing (13 cases incl. blank, 0, 65536, 3e3, 30.5) and

  readRequired behavior: PASS

\- API starts with no .env and no PORT on 3000, health 200: PASS

\- apps/api/.env PORT honored; real env PORT overrides .env;

  tsx dev path loads .env; invalid PORT exits 1: PASS

\- planted secret in .env not written to logs: PASS

\- web reads no env; api config not imported by web/shared: PASS

\- web/api/shared typecheck/build from clean state; root

  typecheck/build/lint/format:check: PASS

\- secret scan of non-ignored files: PASS



TASK-00.08 verified on 2026-10-20:

\- shared Vitest: 1 file, 1 test PASS

\- api Vitest + Supertest health: 1 file, 1 test PASS

\- web Vitest + RTL: 1 file, 1 test PASS

\- Playwright smoke (Chromium): 1 test PASS; dev server stopped

\- mutation checks: web test fails if heading changes; api test

  fails if health body changes (sources restored): PASS

\- typecheck catches type errors in test files (web/api/shared):

  PASS

\- web/api/shared typecheck/build from clean state; root

  typecheck/build/test/lint/format:check: PASS

\- no test files in dist/; no test code in web bundle: PASS

\- test-results/, playwright-report/, coverage/ ignored: PASS



TASK-00.09 verified on 2026-10-20 (every workflow run after

`npm run clean`, with no dist/ present):

\- npm ci fresh install; npm ls --all: PASS

\- root typecheck, build (shared -> api -> web), lint,

  format:check: PASS

\- root test: 3 files, 3 tests PASS; root test:e2e: 1 test PASS

\- build then start:api: health 200 PASS

\- root dev: web 5173 and api 3000 both up from clean; stopping

  one stops both; ports freed: PASS

\- KI-006 real-import probe (temporary imports of shared in

  api server.ts and web App.tsx, restored afterwards): dev api

  and dev web resolve shared source with dist/ absent; root

  test/typecheck/build/start:api pass from clean: PASS

\- no leftover project processes: PASS



TASK-00.10 Phase 00 final verification on 2026-10-20: PASS

(independent; all checks executed during the task; details and

non-blocking findings in CURRENT\_TASK.md).



Database foundation (TASK-01.01):

\- Prisma ORM 7.10.1 (prisma CLI dev dependency; @prisma/client,

  @prisma/adapter-pg 7.10.1 and pg ^8.23.1 runtime) in apps/api

  only. Chosen as the newest stable line: npm's "latest" tag for

  prisma pointed at 8.0.0-rc.23 (a release candidate), so

  versions are pinned to 7.10.1. Requirements met: Node ^24.0

  (repo 24.21.0), TypeScript >=5.4 (repo 6.0.3).

\- Provider: PostgreSQL. Files: apps/api/prisma/schema.prisma

  (generator "prisma-client", output ../src/generated/prisma;

  no models), apps/api/prisma.config.ts (schema/migrations

  paths, datasource.url from DATABASE\_URL).

\- Environment: prisma.config.ts loads optional apps/api/.env with

  process.loadEnvFile (same strategy as server.ts; no dotenv).

  DATABASE\_URL is optional for validate/generate and required

  for migrate/studio and getPrisma().

\- Client: apps/api/src/db/prisma.ts getPrisma() creates one

  PrismaClient per process on first use (PrismaPg adapter;

  DATABASE\_URL via readRequired). The API starts without it.

\- Generated client: apps/api/src/generated/prisma (compiled by

  the API build; ignored by Git/ESLint/Prettier with anchored

  paths). Created by the api `postinstall` (prisma generate) and

  regenerated by api typecheck/build.

\- Scripts (api, mirrored at root): db:validate, db:generate,

  db:migrate (prisma migrate dev), db:migrate:status, db:studio.

  No reset script.

\- No migration exists yet (nothing to migrate without models).



TASK-01.01 verified on 2026-10-20:

\- npm ci fresh install (postinstall regenerated client); npm ls

  --all: PASS

\- prisma CLI 7.10.1; db:validate; db:generate: PASS

\- clean-state root/api typecheck and build; lint; format:check:

  PASS

\- root test 3/3, test:e2e 1/1: PASS

\- API health 200 without DATABASE\_URL: PASS

\- getPrisma() without DATABASE\_URL fails fast (names variable

  only); lazy singleton: PASS

\- PostgreSQL connectivity (initial run): NOT\_RUN (no PostgreSQL;

  with a placeholder URL, query and migrate status failed with

  "can't reach database server" as expected). Superseded by the

  closure prerequisite below.

\- DATABASE\_URL / Prisma absent from web source, bundle, and web

  env example: PASS; no committed credentials: PASS

\- no models or migrations: PASS



Local development database (TASK-01.01 closure prerequisite,

human-approved Docker use, 2026-10-20):

\- compose.dev.yml (root): one service `postgres`, official image

  postgres:17 (server 17.11), synthetic dev-only credentials

  (user maba\_dev, database maba\_printing\_dev), port bound to

  127.0.0.1:5432, named volume maba-printing\_postgres-data,

  pg\_isready healthcheck, restart unless-stopped. Development

  only; not production configuration.

\- Root scripts: db:start (docker compose up -d --wait postgres),

  db:stop (compose stop), db:status (compose ps). No volume

  removal script.

\- apps/api/.env (git-ignored, local only) holds DATABASE\_URL for

  the Docker database; apps/api/.env.example documents it.

\- Verified: container healthy; database exists (0 public

  tables); db:validate and db:generate PASS; prisma db execute

  SELECT 1 PASS; app getPrisma() query PASS (17.11);

  db:migrate:status reached the database and reported "No

  migration found / not managed by Prisma Migrate" (exit 1, as

  expected with no migrations); root typecheck/build/lint/

  format:check, tests 3/3, E2E 1/1, API health PASS; no

  DATABASE\_URL in web.

\- Docker Desktop restarted itself during verification (engine

  29.8.1 -> 29.9.1); the container came back via its restart

  policy and data persisted.

\- PostgreSQL left running for the next schema task.



Domain schema (TASK-01.02):

\- Conventions: PascalCase models / camelCase fields in Prisma,

  @@map/@map to snake\_case tables/columns; UUID primary keys

  generated by PostgreSQL (dbgenerated gen\_random\_uuid(),

  @db.Uuid); timestamps @db.Timestamptz(3) with

  created\_at/updated\_at defaults (updatedAt also @updatedAt).

\- Enum UserRole (db type user\_role): MEMBER, ADMIN. Guests have

  no user row. Default role MEMBER.

\- User (table users): id, role, name, email (unique),

  passwordHash (password\_hash, nullable), googleId (google\_id,

  nullable unique; Google OIDC "sub", no tokens), whatsapp

  (nullable), isActive (is\_active, default true), createdAt,

  updatedAt.

\- Location (table locations): id, name, address, openingHours

  (opening\_hours JSONB, nullable), isActive (default true),

  createdAt, updatedAt.

\- Opening hours: JSONB, null until configured. Shape

  { "weekly": { "mon".."sun": \[{ "open": "HH:mm", "close":

  "HH:mm" }] }, "note"?: string }; empty list = closed; times are

  local business time (Asia/Jakarta / WIB). Shape validation is

  an application responsibility (later location task).

\- No relations yet (location-service availability: TASK-01.03).

\- Email uniqueness is case-sensitive at the database level

  (KI-008).

\- Migration: apps/api/prisma/migrations/

  20261020125104\_core\_identity\_locations (CREATE TYPE user\_role;

  CREATE TABLE users, locations; UNIQUE INDEX users\_email\_key,

  users\_google\_id\_key). Reviewed before applying (create-only),

  then applied with db:migrate to local maba\_printing\_dev.



TASK-01.02 verified on 2026-10-20:

\- prisma validate/format, generate (User, Location, UserRole in

  client): PASS

\- migration SQL review (only intended objects, no destructive

  statements): PASS; applied; migrate status "up to date": PASS

\- PostgreSQL inspection: tables users, locations,

  \_prisma\_migrations only; columns/types/defaults; PKs; unique

  indexes; enum values: PASS

\- constraint probes in a rolled-back transaction (defaults,

  duplicate email/google\_id rejected, multiple NULL google\_id

  allowed, GUEST role rejected, NOT NULL name): PASS; 0 rows

  remain

\- Prisma Client probe (types, @updatedAt, JSONB roundtrip) in a

  rolled-back transaction: PASS

\- root typecheck/build (clean), lint, format:check, tests 3/3,

  E2E 1/1, API health; no DATABASE\_URL in web: PASS



Catalog schema (TASK-01.03):

\- Enums: PriceType (price\_type) = FIXED, REQUIRES\_CONFIRMATION;

  ProductAvailability (product\_availability) = AVAILABLE,

  UNAVAILABLE (binary stock; no numeric inventory).

\- ServiceCategory (service\_categories), ProductCategory

  (product\_categories): id, name, description?, isActive,

  timestamps. Admin-editable data; no category enum, no seed.

\- Service (services): id, categoryId -> service\_categories,

  name, description?, priceType, price Int? (integer Rupiah;

  null allowed for REQUIRES\_CONFIRMATION), isActive, timestamps.

  No request-type fields (those belong to orders).

\- LocationService (location\_services): composite primary key

  (location\_id, service\_id) = the duplicate-pair guard; no

  surrogate UUID because nothing references the pair itself.

  isAvailable (default true) toggles availability; timestamps.

\- Product (products): id, categoryId -> product\_categories,

  name, description?, price Int (integer Rupiah), imageRef?

  (image\_ref; URL or storage key, resolution decided later;

  required by PRD 10 / Architecture 25), availability (default

  AVAILABLE), isActive, timestamps. availability = temporarily

  not orderable; isActive = removed from normal display.

\- Referential actions: every catalog FK is ON DELETE RESTRICT

  (explicit in schema; equals Prisma's default for required

  relations) and ON UPDATE CASCADE (Prisma default; UUID keys

  never change). No cascading deletes.

\- Pending for TASK-01.06 (deliberately not in this migration):

  CHECK FIXED services have a non-null price; CHECK prices >= 0

  (services.price, products.price); indexes on unindexed FK

  columns services.category\_id, products.category\_id,

  location\_services.service\_id.

\- Migration: 20261020130233\_catalog\_foundation (CREATE TYPE

  price\_type, product\_availability; CREATE TABLE

  service\_categories, services, location\_services,

  product\_categories, products; 4 FKs ON DELETE RESTRICT).

  Reviewed with --create-only, then applied. No statement touches

  users/locations columns; TASK-01.02 migration file unchanged.



TASK-01.03 verified on 2026-10-20:

\- validate, generate (7 models), migrate create/apply, status

  "up to date" (2 migrations, no drift/checksum warning): PASS

\- PostgreSQL inspection: 8 tables (5 new + users, locations,

  \_prisma\_migrations); columns/defaults; PKs incl. composite;

  4 RESTRICT FKs; enum values: PASS

\- rolled-back probes (integer-only prices, nullable

  confirmation price, enum rejection, duplicate pair rejected,

  availability toggle, RESTRICT on delete, availability vs

  isActive independent): PASS; 0 rows remain

\- Prisma Client probe (nested relations, composite-key lookup,

  defaults, enums), rolled back: PASS

\- root typecheck/build (clean), lint, format:check, tests 3/3,

  E2E 1/1, API health; no DATABASE\_URL in web: PASS



Order schema (TASK-01.04):

\- Enums: OrderType (order\_type) = PRINTING, ATK, LAPTOP\_SERVICE,

  SOFTWARE\_INSTALLATION; OrderStatus (order\_status) = SUBMITTED,

  CONFIRMED, IN\_PROGRESS, READY, COMPLETED, CANCELLED (default

  SUBMITTED); HandoverMethod (handover\_method) = DROP\_OFF, PICKUP

  (PRD 11).

\- Order (orders): id UUID; publicId (public\_id VARCHAR(32)

  unique; random "MP-2026-A7K92D"-style value generated by the

  application, never derived from id, no SQL generation);

  userId? (null = guest; no guest users); locationId?; type

  (order\_type); customer snapshot customerName and

  customerWhatsapp (required, PRD 8) and customerEmail?;

  description? (original request, never overwritten by admin);

  requestedCompletionAt? (timestamptz); status; estimatedTotal?

  and finalTotal? (integer Rupiah); adminNotes? (separate from

  description); completedAt? (set by application logic);

  timestamps.

\- Snapshot strategy: customer name/contact copied onto the order

  at submission, independent of the linked user profile (verified:

  renaming the user does not change the order).

\- OrderItem (order\_items): id; orderId; productId? and

  serviceId? (optional live catalog links); nameSnapshot;

  descriptionSnapshot?; quantity Int; unitPriceSnapshot? and

  subtotal? (integer Rupiah; null while a price still requires

  confirmation); createdAt only (items are immutable snapshots).

  Items are optional per order type; custom items without catalog

  links are allowed.

\- Extensions (orderId is the primary key = at most one per

  order): LaptopServiceRequest (laptop\_service\_requests:

  complaint, handoverAt?, handoverMethod, pickupAddress?,

  distanceKm? DECIMAL(6,2) km entered by Admin, pickupFee?

  integer Rupiah, timestamps; desired completion uses

  Order.requestedCompletionAt) and SoftwareInstallationRequest

  (software\_installation\_requests: softwareName, requirements?,

  licenseNote?, timestamps). No PrintingRequest: the PRD defines

  no printing-specific fields beyond the order itself.

\- Referential actions: all 7 order-domain FKs are ON DELETE

  RESTRICT (explicit; Prisma would default optional relations to

  SET NULL), including items/extensions -> orders, where cascade

  was allowed but not chosen. ON UPDATE CASCADE (UUIDs never

  change). Deactivation keeps history; deletion of referenced

  rows is refused.

\- Pending for TASK-01.06 (or service layer): CHECK quantity > 0;

  CHECK money/distance >= 0 (estimated\_total, final\_total,

  unit\_price\_snapshot, subtotal, pickup\_fee, distance\_km);

  CHECK pickup\_address present for PICKUP; CHECK an item does

  not link both product and service; extension row must match

  the order type (cross-table: service layer or trigger);

  indexes on orders user\_id/status/order\_type/created\_at

  (Architecture 26) and order\_items order\_id/product\_id/

  service\_id.

\- Migration: 20261020132657\_order\_foundation (CREATE TYPE

  order\_type, order\_status, handover\_method; CREATE TABLE

  orders, order\_items, laptop\_service\_requests,

  software\_installation\_requests; UNIQUE INDEX

  orders\_public\_id\_key; 7 FKs ON DELETE RESTRICT). Reviewed with

  --create-only, then applied. Existing tables' columns and both

  earlier migration files unchanged (fingerprints compared).



TASK-01.04 verified on 2026-10-20:

\- validate, generate (11 models), migrate create/apply, status

  "up to date" (3 migrations, no drift/checksum warning): PASS

\- PostgreSQL inspection: 12 tables; columns/types/defaults;

  PKs incl. order\_id PKs on extensions; unique public\_id; 7

  RESTRICT FKs; enum values exact: PASS

\- rolled-back probes: guest (null user/location) and member

  orders; duplicate public\_id, unknown user, invalid enums,

  missing snapshot, fractional money/quantity rejected; snapshot

  unchanged after profile edit; admin notes/final total do not

  touch description; item snapshots unchanged after catalog

  edit/deactivation; one extension per order; RESTRICT on

  deleting users/locations/products/services/orders: PASS; 0

  rows remain

\- Prisma Client probe (nested create, Decimal distanceKm,

  enums), rolled back: PASS (pg deprecation warning, KI-010)

\- root typecheck/build (clean), lint, format:check, tests 3/3,

  E2E 1/1, API health; no DATABASE\_URL in web: PASS



Payment, history, files, audit, settings (TASK-01.05):

\- Enums: PaymentMethod (payment\_method) = CASH, QRIS\_STATIC;

  PaymentStatus (payment\_status) = UNPAID,

  PENDING\_CONFIRMATION, PAID. No gateway values.

\- Payment (payments): one current payment per order (order\_id

  UNIQUE); method; status (default UNPAID); amount? integer

  Rupiah; confirmedById? -> users and confirmedAt? (Architecture

  confirmed\_by/confirmed\_at; confirmation = moment it became

  PAID, i.e. the task's "paidAt"); timestamps. No provider,

  webhook or QRIS image fields; QRIS image is a business setting.

\- OrderStatusHistory (order\_status\_history): orderId;

  fromStatus? (null for the initial status) and toStatus reuse

  the existing order\_status enum; changedByUserId? -> users

  (nullable: e.g. guest submission; ADMIN role is enforced by

  authorization, not the DB); createdAt; append-only (no

  updatedAt). Column names follow the task (from\_status,

  to\_status, changed\_by\_user\_id) rather than the Architecture's

  preliminary status\_from/status\_to/changed\_by\_admin\_id.

\- OrderFile (order\_files): metadata only (no bytea anywhere);

  storageKey (UNIQUE, random private key for StorageService,

  never a public URL); originalName (untrusted metadata);

  mimeType; sizeBytes Int; createdAt; deletedAt? (actual removal).

  No type enum (upload logic validates configurable

  types/size/count). Retention eligibility = Order.completedAt +

  30 days, so the Architecture's delete\_after is not stored.

\- AdminAuditLog (admin\_audit\_logs): actorId -> users (required);

  action (short code, e.g. "order.status.update"); entityType;

  entityId? (text, no FK; targets vary); metadata? JSONB for

  optional old/new values ({ "old": ..., "new": ... }); never

  secrets, tokens, passwords or document contents; createdAt;

  append-only.

\- BusinessSettings (business\_settings): typed singleton, id Int

  default 1; businessName?, whatsappNumber?, logoRef?,

  qrisImageRef?, socialLinks? JSONB, publicInfo?; timestamps. No

  location/opening-hours duplication, no credentials, no seed

  row. Access pattern: upsert where id = 1. Source-of-truth

  overlap with env WHATSAPP\_NUMBER / brand config: KI-011.

\- Referential actions: all 6 new FKs ON DELETE RESTRICT (payment,

  history, files -> orders; payment confirmer, history actor,

  audit actor -> users). Nothing cascades.

\- Pending for TASK-01.06: CHECK business\_settings id = 1 (an

  explicit id = 2 is currently accepted); CHECK payments.amount

  >= 0 and order\_files.size\_bytes > 0; indexes from Architecture

  26 (status history by order/time, order\_files by order) and on

  FK columns.

\- Migration: 20261020133802\_payment\_history\_files\_audit (CREATE

  TYPE payment\_method, payment\_status; CREATE TABLE payments,

  order\_status\_history, order\_files, admin\_audit\_logs,

  business\_settings; UNIQUE payments\_order\_id\_key,

  order\_files\_storage\_key\_key; 6 RESTRICT FKs). Reviewed with

  --create-only, then applied. Existing columns, constraints and

  the three earlier migration files unchanged (fingerprints).



TASK-01.05 verified on 2026-10-20:

\- validate, generate (16 models), migrate create/apply, status

  "up to date" (4 migrations, no drift/checksum warning): PASS

\- PostgreSQL inspection: 17 tables; columns/defaults; unique

  order\_id / storage\_key; 6 RESTRICT FKs; enum values exact; 0

  bytea columns: PASS

\- rolled-back probes (one payment per order, enum/integer

  rejection, manual confirmation, null initial fromStatus,

  storage key uniqueness, soft-delete metadata, audit JSONB and

  required actor, settings singleton default and duplicate

  rejection, RESTRICT on order/user delete): PASS; 0 rows remain

\- Prisma Client probe (relations, singleton upsert, audit JSON),

  rolled back: PASS

\- root typecheck/build (clean), lint, format:check, tests 3/3,

  E2E 1/1, API health; no DATABASE\_URL in web: PASS



Database hardening (TASK-01.06):

\- Principle: row-level, stable invariants only, as CHECK

  constraints and indexes in one additive migration. No triggers.

\- Custom SQL (Prisma cannot express CHECKs or expression

  indexes) is hand-written at the end of migration

  20261020135726\_database\_constraints\_indexes; schema.prisma

  comments name each constraint. `prisma migrate diff` from the

  database to the schema is empty, so Prisma does not try to drop

  the custom objects in later migrations.

\- CHECK constraints (15):

  services\_price\_non\_negative, services\_fixed\_price\_required

  (price\_type <> FIXED or price present; REQUIRES\_CONFIRMATION

  may have none or an indicative price),

  products\_price\_non\_negative, orders\_estimated\_total\_non\_negative,

  orders\_final\_total\_non\_negative, order\_items\_quantity\_positive,

  order\_items\_unit\_price\_snapshot\_non\_negative,

  order\_items\_subtotal\_non\_negative, order\_items\_single\_catalog\_ref

  (not both product\_id and service\_id; both null = custom item),

  laptop\_service\_requests\_distance\_km\_non\_negative,

  laptop\_service\_requests\_pickup\_fee\_non\_negative,

  laptop\_service\_requests\_pickup\_address\_required (PICKUP needs an

  address with at least one non-whitespace character),

  payments\_amount\_non\_negative, order\_files\_size\_bytes\_positive,

  business\_settings\_singleton (id = 1).

\- KI-008: unique expression index users\_email\_lower\_key on

  lower(email) (no CITEXT). users\_email\_key stays for Prisma

  findUnique. Application must still trim + lowercase emails and

  look them up via the normalized value.

\- Indexes (11, Prisma @@index): services(category\_id);

  location\_services(service\_id) (the PK covers location-first);

  products(category\_id, availability); orders(user\_id,

  created\_at), orders(status, created\_at), orders(order\_type,

  created\_at), orders(created\_at), orders(location\_id);

  order\_items(order\_id); order\_status\_history(order\_id,

  created\_at); order\_files(order\_id). Architecture 26 is fully

  covered (users email / google\_id and orders public\_id unique

  already existed).

\- Deliberately not indexed (no read access path yet; deletes of

  catalog rows/users are rare and RESTRICT-checked):

  order\_items(product\_id / service\_id), payments(confirmed\_by\_id),

  order\_status\_history(changed\_by\_user\_id),

  admin\_audit\_logs (no audit read feature specified yet; add with

  the audit phase when its query is known).

\- Left to the service layer (no trigger): extension row matches

  order type (laptop -> LAPTOP\_SERVICE, software ->

  SOFTWARE\_INSTALLATION); order status transitions; payment

  status/confirmedBy/confirmedAt combinations; totals and the

  pickup fee calculation; openingHours JSON shape (Zod); upload

  MIME/extension/count rules; admin role of actors.

\- KI-011 decision (task-directed): BusinessSettings is

  authoritative for mutable runtime values (businessName,

  whatsappNumber, logoRef, qrisImageRef, socialLinks). Env vars

  may only be a later deployment/bootstrap fallback where a task

  explicitly needs one; frontend static config must not hold

  competing mutable copies. Not yet an ADR in DECISIONS.md

  (protected; owner may add it).

\- Earlier four migration files unchanged (md5). KI-009 and

  KI-010 untouched.

TASK-01.06 verified on 2026-10-20:

\- validate, generate, migrate create (--create-only) / review /

  apply, status "up to date" (5 migrations, no drift/checksum

  warning): PASS

\- PostgreSQL inspection: 15 CHECKs, 12 new indexes (34 total),

  no duplicate or same-leading-column indexes, 0 user triggers;

  email lookup uses users\_email\_lower\_key: PASS

\- rolled-back probes: 25 invalid cases rejected by the intended

  named constraint, matching valid cases accepted; 0 rows remain:

  PASS

\- root typecheck/build (clean), lint, format:check, tests 3/3,

  E2E 1/1, API health; no DATABASE\_URL in web: PASS



Development seed (TASK-01.07):

\- apps/api/prisma/seed.ts (Architecture 11 location), run by

  `prisma db seed` via prisma.config.ts migrations.seed

  ("tsx prisma/seed.ts"); scripts db:seed (api) and root db:seed.

  Prisma 7 never seeds automatically after migrate. Not part of

  the API build (tsconfig.build includes src only); covered by

  typecheck/lint via apps/api/tsconfig.json include.

\- Uses getPrisma() (one client; fails with "Missing required

  environment variable: DATABASE_URL"); $disconnect in finally;

  exit code 1 on failure. One batch $transaction (all or nothing,

  no interactive transaction, so no KI-010 warning).

\- Seed-owned rows have fixed UUIDs with prefix 5eed0000- and are

  upserted with their full baseline values (a rerun converges

  drifted seed rows); LocationService upserts on the composite

  key. Rows not owned by the seed are never touched or deleted.

\- BusinessSettings id = 1 is create-if-missing (update: {}):

  database-authoritative (KI-011), so a rerun never overwrites

  values edited later.

\- Contents (all synthetic): BusinessSettings (name "MABA

  PRINTING (Local Dev)", placeholder WhatsApp +620000000000,

  placeholder logo ref, no QRIS image, empty social links);

  2 fictional locations (both active, documented openingHours

  shape, one with split intervals and a note); service categories

  Printing / Laptop Service / Software Installation; 7 services

  (FIXED 500, 1500; REQUIRES_CONFIRMATION null x3 and indicative

  50000; 1 inactive); 8 location-service links (Location A all

  active services, Location B print B/W + color unavailable);

  product categories Writing Tools / Paper / Notebooks;

  5 products (AVAILABLE, UNAVAILABLE, 1 inactive, 1 imageRef).

\- No users (no auth yet; nothing near-term needs one, and

  Architecture 49 forbids dev credentials reaching production;

  an auth task can add a dev account). No orders.

\- README Local Database section: migrate + seed steps and the

  synthetic/rerun-safe note.

TASK-01.07 verified on 2026-10-20:

\- seed run 1 counts: business\_settings 1, locations 2,

  service\_categories 3, services 7, location\_services 8,

  product\_categories 3, products 5, users 0, orders 0: PASS

\- reruns: no duplicate-key errors; counts identical to run 1;

  drifted seed service reset to baseline; owner-edited settings

  kept; a non-seed probe row kept (probe edits then restored or

  removed): PASS

\- constraints all validated; data inspected: PASS

\- missing DATABASE\_URL fails clearly (exit 1): PASS

\- migration status up to date; 5 migration files unchanged: PASS

\- root typecheck/build (clean), lint, format:check, tests 3/3,

  E2E 1/1, API health; no DATABASE\_URL in web: PASS



Data access (TASK-01.08):

\- Prisma client ownership unchanged: src/db/prisma.ts getPrisma()

  lazy singleton (server-only). Added `DbClient =

  Prisma.TransactionClient` there: repositories accept the shared

  client or a future interactive-transaction `tx` client. No DI

  framework, no generic BaseRepository, no interfaces.

\- src/repositories/: plain exported functions, `db` as the

  first argument; repository modules import only types, so

  importing them opens no connection. Each defines a `select`

  object (only needed columns) and exports its record type via

  Prisma GetPayload (API-internal, not DTOs).

\- business-settings.repository.ts: findBusinessSettings(db) ->

  row id = 1 or null (no env fallback, no defaults).

\- location.repository.ts: listLocations(db, { activeOnly }),

  ordered name, id; findLocationById(db, id). openingHours

  returned as stored (no parsing).

\- service-catalog.repository.ts: listServices(db, { activeOnly,

  categoryId? }) with category selected, ordered category name,

  name, id; findServiceById(db, id); listServicesAtLocation(db,

  locationId, { activeOnly }) via location_services (PK leads with

  location_id), returns service + isAvailable. activeOnly =

  service and category active (and isAvailable for location

  reads).

\- product-catalog.repository.ts: listProducts(db, { activeOnly,

  categoryId? }) with category, ordered category name, name, id

  (categoryId filter uses products_category_id_availability_idx);

  findProductById(db, id). UNAVAILABLE products stay in public

  lists (display state).

\- activeOnly is a required explicit option (no public-only

  assumption); find-by-id returns rows regardless of isActive.

\- N+1: relations loaded by select in the same Prisma call;

  tests assert the SQL statement count is identical for the full

  list and a filtered list (constant per call, <= 3 services,

  <= 2 products).

\- Tests: src/repositories/repositories.db.test.ts (10 read-only

  integration tests against the seed), run by `npm run test:db`

  (api + root); `npm run test` excludes `*.db.test.ts`. Guard

  refuses any DATABASE\_URL other than localhost /

  maba\_printing\_dev. Uses its own query-logging PrismaClient

  passed as DbClient (also proves injection).

\- /api/v1/health unchanged; app/server do not use the DB.

TASK-01.08 verified on 2026-10-20:

\- test:db 10/10 against seed: PASS; guard rejects non-local URL

  before connecting: PASS

\- seed baseline unchanged (counts 1/2/3/7/8/3/5, users 0,

  orders 0): PASS

\- no Prisma/DATABASE\_URL in apps/web or packages/shared: PASS

\- validate, generate; migration status up to date; still 5

  migrations, files unchanged: PASS

\- root typecheck/build (clean), lint, format:check, tests 3/3,

  E2E 1/1, API health 200: PASS



Database test workflow (TASK-01.09):

\- Same Docker PostgreSQL server, second database

  maba\_printing\_test (no new container). Development stays on

  maba\_printing\_dev via DATABASE\_URL; tests use only

  TEST\_DATABASE\_URL (apps/api/.env, git-ignored; documented in

  apps/api/.env.example and root .env.example). DATABASE\_URL is

  never a fallback.

\- Guard: apps/api/scripts/test-database.ts. Fails closed before

  connecting unless TEST\_DATABASE\_URL is postgres(ql)://, a

  loopback host (localhost / 127.0.0.1 / [::1]) and exactly the

  database maba\_printing\_test; after connecting,

  current\_database() must equal maba\_printing\_test (setup

  script and every test transaction). Unit-tested in

  scripts/test-database.test.ts (part of normal `npm test`).

\- Setup: apps/api/scripts/test-db.ts. `prepare` creates the test

  database if missing (via the maintenance database "postgres"),

  then runs prisma migrate status (must name maba\_printing\_test),

  migrate deploy, migrate status (must pass) and migrate diff

  --exit-code against schema.prisma (no drift). `rebuild` first

  drops/recreates ONLY the constant name maba\_printing\_test

  (DROP DATABASE ... WITH (FORCE)); no generic reset taking an

  arbitrary URL. Prisma CLI runs via node with DATABASE\_URL

  replaced by the test URL for the child process only. No schema

  push.

\- Commands (api + root): db:test:prepare, db:test:rebuild;

  test:db = db:test:prepare then vitest on \*.db.test.ts. Normal

  `npm test` stays database-free (excludes \*.db.test.ts).

\- Isolation: repositories.db.test.ts (11 tests) inserts its own

  synthetic fixtures (IDs 7e570000-, flat createMany) inside an

  interactive transaction per test that always rolls back; the

  transaction client is passed to repositories as DbClient. No

  dependency on the development seed or on test order; the test

  database stays empty. Supersedes the TASK-01.08 tests that read

  the dev seed.

\- Fresh reconstruction: rebuild from an empty database applied

  all 5 migrations in order; status up to date; no drift; 15

  CHECKs, users\_email\_lower\_key on lower(email),

  business\_settings\_singleton and the 11 indexes present.

  Columns, constraints, indexes, enums and migration checksums

  fingerprint-identical to maba\_printing\_dev.

\- KI-009 resolved (evidence in KNOWN\_ISSUES): Prisma's checksum

  check ignores CRLF-only differences (a real content change is

  flagged); .gitattributes rule for apps/api/prisma/migrations

  SQL (text eol=lf) keeps migration SQL LF in every checkout

  (simulated Windows autocrlf checkout). Working-tree migration

  files were not rewritten.

\- Development database preserved: content and migration

  fingerprints identical before and after.

TASK-01.09 verified on 2026-10-20:

\- guard rejects maba\_printing\_dev, other names, remote hosts and

  a missing TEST\_DATABASE\_URL before connecting: PASS

\- db:test:rebuild from empty, migration status on test DB,

  no drift: PASS

\- test:db 11/11, run twice; 0 rows left in test DB: PASS

\- normal tests 4 files / 7 tests without a database; E2E 1/1:

  PASS

\- validate, generate, root typecheck/build (clean), lint,

  format:check, API health 200: PASS

\- dev migration status up to date; dev data identical; 5

  migration files unchanged; no DATABASE\_URL in web: PASS



Phase 01 final verification (TASK-01.10, 2026-10-20): PASS

\- Independent re-verification of TASK-01.01..01.09 against files,

  both databases and commands; no fixes made.

\- Fresh rebuild of maba\_printing\_test from the 5 migration files

  (new database OID, all migrations applied in this run); full

  catalog (142 columns, 8 enums, 49 constraints incl. 15 CHECKs and

  17 RESTRICT FKs, 34 indexes, 0 triggers) identical to

  maba\_printing\_dev; no drift on either database.

\- 25+ constraint/uniqueness probes and 6 RESTRICT delete probes on

  the test DB (rolled back); seed idempotency, convergence,

  non-overwrite of settings and non-seed preservation on the test

  DB; KI-009 re-checked (CRLF accepted, real change detected,

  .gitattributes checkout keeps LF); KI-010 not reproducible.

\- Commands: validate, generate, dev/test migrate status, rebuild,

  npm test 4 files / 7 tests, test:db 11/11 (x5 incl. shuffled),

  clean build, typecheck, lint, format:check, Playwright 1/1, API

  health 200 with the database unreachable: all PASS.

\- Dev DB preserved: OID, migration history, business\_settings and

  seed content identical (only updated\_at bumped by a normal seed

  rerun).

\- Findings: F-1 MEDIUM all Phase 01 work is uncommitted (the

  migrations are untracked in Git; last commit is Phase 00) and

  must be committed by the owner before Phase 01 is closed;

  F-2 LOW README "Development Status" still describes Phase 00

  with no database; F-3 LOW KI-010 entry is stale (warning not

  reproducible); INFO items listed in the TASK-01.10 report.



\## Next Action



Phase 01 accepted (2026-10-20); awaiting Phase 02 planning.

Closure housekeeping done: README status updated (F-2), KI-010 set

to MONITORING / NOT\_REPRODUCED (F-3). Open: F-1, the Phase 01 work

is not yet committed to Git (owner action). Do not start Phase 02

without explicit instruction.

