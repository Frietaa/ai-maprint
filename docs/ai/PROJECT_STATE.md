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

Phase 02 (Public Read Experience): ACCEPTED and COMPLETE

(human-approved 2026-10-20; verification PASS in TASK-02.10). Plan in

docs/ai/PHASE\_02.md, tasks TASK\_02.01..02.10.



Phase 03 (Authentication \& Identity): ACCEPTED and COMPLETE

(human-approved 2026-10-21; verification PASS in TASK-03.10). Plan in

docs/ai/PHASE\_03.md, tasks TASK\_03.01..03.10.



Phase 04 (Order Submission, Private Files \& Tracking): ACCEPTED and

COMPLETE (human-approved 2026-10-21; verification PASS in TASK-04.10).

Plan in docs/ai/PHASE\_04.md, tasks TASK\_04.01..04.10.



Phase 05 (Admin Operations \& Order Management): ACCEPTED and COMPLETE

(human-approved 2026-10-22; verification PASS in TASK-05.10; committed

aca6d83). Plan in docs/ai/PHASE\_05.md, tasks TASK\_05.01..05.10.

Final autonomous master run (human-authorized 2026-10-22): Phases 06-09

planned and executed autonomously with an independent verification and a

checkpoint commit per phase; status "AUTONOMOUSLY COMPLETED / VERIFIED"

(not human-accepted).

Phase 06 (Remaining MVP Experience \& Customer Payment UX): AUTONOMOUSLY

COMPLETED / VERIFIED (TASK-06.10 PASS, 2026-10-22; checkpoint commit

8a46464). Plan in docs/ai/PHASE\_06.md, tasks TASK\_06.01..06.10.

Phase 07 (Security, Reliability \& Production Hardening): AUTONOMOUSLY

COMPLETED / VERIFIED (TASK-07.10 PASS, 2026-10-22; checkpoint commit

"chore: complete Phase 07 production hardening"). Plan in

docs/ai/PHASE\_07.md, tasks TASK\_07.01..07.10.

Plan in docs/ai/PHASE\_03.md, tasks TASK\_03.01..03.10.

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



Phase 02 — Public Read Experience (autonomous run, 2026-10-20)

Plan: docs/ai/PHASE\_02.md; tasks docs/ai/TASK\_02.01.md .. TASK\_02.10.md.



TASK-02.01 Frontend App Shell, Routing \& Tailwind: COMPLETED

\- Dependencies (apps/web): react-router 8.4.0 (dependency; 8.5.0 was

1 day old), tailwindcss 4.3.3 + @tailwindcss/vite 4.3.3 (dev; peer vite

^5..^8). CSS-first Tailwind v4 config (@import 'tailwindcss' + @theme

brand tokens in src/index.css); no tailwind.config.js / PostCSS.

\- Structure: src/app (App, routes), src/components/layout (PublicLayout,

Header, Footer, Logo), src/components/ui (PageHeader), src/config (brand,

navigation), src/pages (Home, Printing, Atk, LaptopService,

SoftwareInstallation, Locations, NotFound), src/test (setup,

render-route). Old src/App.tsx + App.test.tsx removed.

\- Router: createBrowserRouter + RouterProvider (react-router/dom), one

PublicLayout route, ScrollRestoration, catch-all NotFound. No

/login /signup /account /track-order /admin routes.

\- Shell a11y: skip link, header/nav/main/footer landmarks, NavLink

aria-current, mobile menu button with aria-expanded/aria-controls,

Escape closes and restores focus, closes on navigation, focus-visible

outline, prefers-reduced-motion CSS.

\- Tests: src/app/routes.test.tsx (13). E2E smoke updated (shell +

navigation).



TASK-02.02 Public API Contract Foundation: COMPLETED

\- packages/shared: public-api.ts (API\_PREFIX, PUBLIC\_API\_PATHS,

PRICE\_TYPES, PRODUCT\_AVAILABILITIES, envelopes ApiItemResponse /

ApiListResponse {data, meta:{count}} / ApiErrorResponse {message,

errors?}, PublicSettingsDto, LocationDto, CategoryDto, ServiceDto,

ProductDto, query types) and opening-hours.ts (WEEKDAYS, OpeningHours,

dependency-free parseOpeningHours: [] = closed day, null = unknown day,

invalid ranges dropped, malformed value -> null). No Prisma/Express/

React/Node imports. apps/api and apps/web now declare

"@maba-printing/shared": "\*" explicitly.

\- apps/api: zod 4.6.5 (dependency). errors/app-error.ts (AppError,

ValidationError 400, NotFoundError 404); middleware/error-handler.ts

(JSON 404 for unknown routes, generic 500 without internals, error

logged server-side); middleware/cors.ts (allowlist from FRONTEND\_URL,

comma-separated, normalized to origins; never "\*", no credentials,

GET/OPTIONS only); X-Content-Type-Options: nosniff; validators/query.ts

(parseQuery with strict Zod schemas -> {field: [messages]}, unknown keys

= "Unknown query parameter") and public-query.validator.ts;

mappers/public-dto.mapper.ts (allow-listed fields; social links only

http(s) URLs; QRIS ref never mapped); http/response.ts; createApp({

getDb, allowedOrigins }) with lazy default getPrisma.

\- Repositories extended (not bypassed): services select category

description + available active-location ids, listServices locationId

filter; products select category description, listProducts

availability filter. DB test bound updated 3 -> 4 statements (one per

relation level); equality (no N+1) assertion unchanged.

\- Settings semantics: GET /public/settings returns {data: null} when no

row exists (no fabricated values, no env fallback).



TASK-02.03 Public Settings Vertical Slice: COMPLETED

\- GET /api/v1/public/settings: routes/public.routes.ts (createPublicRouter

mounted at API\_PREFIX) -> controllers/public-settings.controller.ts

(parseQuery(noQuerySchema) = validator step) ->

services/public-settings.service.ts -> findBusinessSettings repository.

200 {data: PublicSettingsDto} or {data: null} when not configured;

unknown query -> 400. Verified live against the dev DB (read-only).

\- Frontend: @tanstack/react-query 5.104.1 (5.104.5 was 1 day old).

app/query-client.ts (staleTime 5 min, retry once only for network/5xx,

no refetch on focus); lib/api-client.ts (native fetch, buildApiUrl =

VITE\_API\_BASE\_URL + /api/v1 + path, ApiError kinds network / http /

invalid-response with status and fieldErrors); src/env.d.ts typed

VITE\_API\_BASE\_URL; lib/image-ref.ts (only https URLs or root-relative

paths are rendered, else placeholder); features/settings

(usePublicSettings, useBusinessIdentity with static fallback name).

Header/logo use the DB business name; footer shows WhatsApp number as

text and http(s) social links (no deep link: WhatsApp phase).

\- Vite dev/preview proxy /api -> http://localhost:3000 (same origin, no

CORS needed for npm run dev).

\- Tests: shared DB helper src/test/test-db.ts (guarded client, rollback,

fixtures incl. QRIS ref, javascript: social link, malformed opening

hours, inactive-location link); routes/public-api.db.test.ts;

routes/public-api.test.ts (DB failure -> generic 500, health

independent); web: api-client, image-ref, settings-shell tests; test

helpers src/test/api-mock.ts (fetch mock) + render-route with

QueryClient. test:db runs files serially (--no-file-parallelism);

src/test excluded from the API build.



TASK-02.04 Locations Vertical Slice: COMPLETED

\- GET /api/v1/locations: controller public-locations.controller.ts

(noQuerySchema) -> services/public-locations.service.ts ->

listLocations({activeOnly: true}) -> toLocationDto. 200 {data, meta:

{count}}; empty list = 200 with []; any query parameter -> 400.

Opening hours normalized by the shared parser (malformed -> null).

\- Frontend: features/locations (use-locations, LocationCard,

OpeningHours + opening-hours-format: Senin..Minggu labels, "08.00"

notation, split shifts joined, [] = "Tutup", null day = "Tidak ada

informasi", whole value missing/malformed = "Jam buka belum tersedia.",

optional note, WIB hint; re-validates with parseOpeningHours).

components/ui/DataState.tsx (LoadingState skeleton with role=status,

EmptyState, ErrorState role=alert + "Coba lagi" retry) and

lib/error-message.ts (Indonesian copy per ApiError kind; no technical

details shown). /locations page uses them.

\- Tests: locations API DB tests (+3), OpeningHours (6), locations page

states incl. retry (5).



TASK-02.05 Services Catalog Vertical Slice: COMPLETED

\- GET /api/v1/services?categoryId=\&locationId= (both optional UUIDs;

strict schema): public-services.controller -> public-services.service

-> listServices({activeOnly: true, categoryId, locationId}) ->

toServiceDto. Active service + active category only; locationId keeps

services with an available link to that ACTIVE location (inactive or

unknown location -> empty list, 200). availableLocationIds lists only

available, active locations. Verified by 6 new API DB tests.

\- Frontend: lib/format-price.ts is the only price formatter

(Intl id-ID IDR, 0 decimals): FIXED -> "Rp 1.500";

REQUIRES\_CONFIRMATION -> "Konfirmasi harga" or "Mulai Rp ..." with an

indicative price; unusable numbers -> "Konfirmasi harga".

features/services: use-services (query key includes locationId,

keepPreviousData), service-lines.ts (category name keyword matching per

line, grouping, full-catalog fallback when nothing matches - KI-013),

ServiceCard (price, confirmation hint, "Tersedia di: <location names>"),

ServiceCatalog (labelled location <select> using the API locationId

filter, loading/empty/error-retry), NextStepNotice (informational only,

links to /locations). /printing, /laptop-service,

/software-installation pages (software page states the legal-software

policy). No forms, ordering or WhatsApp deep links.

\- Tests: format-price (7), service-lines (11), service pages (5).



TASK-02.06 Products / ATK Catalog Vertical Slice: COMPLETED

\- GET /api/v1/products?categoryId=\&availability= (UUID / AVAILABLE |

UNAVAILABLE; strict): public-products.controller ->

public-products.service -> listProducts({activeOnly: true, ...}) ->

toProductDto. Active product + active category; UNAVAILABLE stays

listed; inactive never public. 5 new API DB tests.

\- Frontend: features/products (use-products: one unfiltered request,

categories filtered client-side so the filter list stays complete;

API filters remain available and tested; ProductCatalog with

role=group "Filter kategori" aria-pressed toggle buttons, grouped by

category, loading/empty/error-retry; ProductCard with central price

formatter, availability badge text "Tersedia" / "Stok sedang kosong"

plus marker (not color alone), image only via resolveImageRef with

lazy loading and alt = product name, else decorative placeholder).

/atk page with notice explaining unavailable products; no cart,

checkout, quantity or stock numbers.

\- Live check (dev DB, read-only GETs): all four endpoints and filters

return the seeded baseline; screenshots at 360/768/1280 px show no

horizontal overflow on any public route.

\- Tests: atk page (5).



TASK-02.07 Homepage Composition \& Navigation: COMPLETED

\- / (pages/HomePage.tsx): hero (eyebrow, h1 = business name from

settings with static fallback, tagline, CTAs to #layanan and

/locations); "Layanan kami" with four business-line link cards

(config/business-lines.ts: static product-line concepts, inline SVG

icons aria-hidden; features/home/BusinessLineCards); "Cara kerjanya"

three-step ordered list; "Lokasi kami" preview of up to three API

locations (features/home/LocationPreview with loading/empty/error);

"Informasi" section only when settings publicInfo/WhatsApp exist;

final CTA band. Responsive grids 1/2/4 columns.

\- Copy rules: Indonesian, no prices/addresses/hours/stock/WhatsApp in

code, no 24/7 / cheapest / guarantee / coverage claims ("harga yang

jelas" softened to "informasi harga yang mudah dilihat").

\- Tests: home-page (6). Desktop/mobile screenshots reviewed.



TASK-02.08 Public UX States, Accessibility \& SEO: COMPLETED

\- SEO: config/seo.ts (per-route title + description) and

components/layout/PageMeta.tsx (sets document.title "<Title> | <business

name>" and meta description; no SEO framework); index.html static

default title/description + theme-color. NotFound has its own title.

Sitemap, structured data and admin noindex deferred to later phases.

\- Accessibility: focus moves to <main> after client-side navigation

(path comparison, StrictMode-safe); skip link; mobile menu toggle keeps

a stable accessible name "Menu" with aria-expanded (label no longer

switches to "Tutup"); headings verified (one h1, no skipped levels) on

every public route; availability/status always text; token contrast

reviewed (slate-500 on white 4.76:1, amber-900/amber-50, red-800/red-50,

brand-700/brand-50 all AA); targets >= 40px for controls, footer links

>= 24px; prefers-reduced-motion respected (CSS + motion-safe).

\- States: all data-backed screens (shell settings, locations, home

preview, services, products) have loading / success / empty / error

with retry; error copy per ApiError kind (network / 4xx / server or

invalid response) in Indonesian without technical details.

\- Tests: seo-a11y (16), error-message (6); Playwright e2e/responsive.spec

(no horizontal overflow at 360/768/1280 on all public routes, keyboard

mobile menu, 404) - 6 E2E tests pass.

\- tsconfig.node.json lib adds DOM for page.evaluate callbacks.



TASK-02.09 Public Read Integration \& E2E: COMPLETED

\- Full-stack E2E (apps/web/playwright.config.ts, workers 1): webServer 1

= apps/api `npm run db:test:prepare \&\& npm run e2e:api` (PORT 3199,

FRONTEND\_URL=http://localhost:5179); webServer 2 = Vite on 5179 with

VITE\_API\_BASE\_URL=http://localhost:3199 (real cross-origin path through

the CORS allowlist). apps/api/scripts/e2e-server.ts serves createApp

with a Prisma client built from the guarded TEST\_DATABASE\_URL only

(DATABASE\_URL never read) after applyE2eFixtures; scripts/e2e-fixtures.ts

(IDs e2e00000-, settings id 1 'MABA PRINTING E2E', current\_database()

asserted; removeE2eFixtures deletes only E2E rows; CLI clean).

e2e/global-teardown.ts runs e2e:fixtures:clean; db:test:prepare also

removes E2E leftovers (verified: 7 rows after a killed run -> 0).

\- Specs: public-journey (Home -> Lokasi -> Printing incl. location

filter via API -> ATK, asserting DB names, split shift/closed day/note,

Rupiah prices, "Mulai Rp 5.000", "Stok sedang kosong", inactive rows

absent; service-line pages; CORS allow/deny + 400 contract), responsive

(360/768/1280 no overflow, keyboard mobile menu, 404), smoke.

\- Integration coverage: API DB tests for all four endpoints (settings

3, locations 3, services 6, products 5) + repository tests (13) = 30;

component tests cover shell, loading/success/empty/error/retry, prices,

availability, opening hours.

\- Dev workflow fix (KI-014): apps/api "dev" now

`node --watch --conditions=development --import tsx src/server.ts`

(tsx watch stalled under concurrently once the Prisma client is part

of the server import graph). npm run dev verified (proxy serves data).

\- README + env examples updated (FRONTEND\_URL active, VITE\_API\_BASE\_URL

semantics, full-stack E2E prerequisites).

\- Verified: clean typecheck/build/lint/format; npm test 150 (api 34,

web 104, shared 12); test:db 30; Playwright 9; test DB empty after E2E;

dev DB content and migration fingerprint unchanged since Phase 01.



TASK-02.10 Phase 02 Final Verification: PASS (2026-10-20)

\- Independent re-verification; no fixes made. Phase 01 baseline intact

(HEAD f4b1574; no changes under apps/api/prisma; migration md5s

unchanged); only .env.example files tracked; generated output ignored.

\- Clean build, typecheck, lint, format, Prisma validate/generate,

migrate status dev + test up to date, dev drift none.

\- Live contract check of the built API on the dev DB (read-only, 28

checks): envelopes, exact field allow-lists, no QRIS/isActive/

timestamps, 400 validation incl. activeOnly rejection, JSON 404,

CORS deny, nosniff; public counts equal SQL active rows (2/6/4);

unreachable DB -> generic 500, health 200, no credentials in logs.

\- Layering route -> validator -> controller -> service -> repository ->

Prisma confirmed; no Prisma/Express/React in shared, no Prisma in web;

no any/ts-ignore/TODO; no hardcoded live business values in web.

\- Tests: npm test 150 (api 34, web 104, shared 12); test:db 30;

Playwright 9 (journey, CORS/contract, responsive 360/768/1280,

keyboard menu, 404, smoke). Test DB empty afterwards; dev DB

fingerprint identical during verification and to end of Phase 01.

\- Findings (all non-blocking): LOW pagination deferred (KI-012); LOW

category name matching (KI-013); LOW rate limiting / full security

headers / structured request-ID logging not yet implemented (Arch §42,

§46; Audit \& Security Hardening phase); LOW Phase-02 work uncommitted

(two staged deletions, rest unstaged). INFO: KI-014 mitigated;

WhatsApp shown as text (deep link deferred); success envelope omits

optional message; titles update after settings load; npm

install-scripts notice for prisma preinstall.



Phase 02 human acceptance (2026-10-20): APPROVED

\- Phase 02 verification PASS accepted; Phase 02 ACCEPTED / COMPLETE.

\- Findings carried forward unchanged (not fixed at closure): KI-012

pagination LOW / deferred; KI-013 category-name matching LOW /

deferred; KI-014 dev watcher MITIGATED; security hardening (rate

limiting, full security headers, structured request-ID logging) LOW /

deferred to an appropriate hardening phase.

\- Phase-02 work not yet committed (owner action).



\## Phase 03 — Authentication \& Identity (ACCEPTED / COMPLETE)



TASK-03.01 Auth Architecture, Session \& Security Foundation: DONE (2026-10-21)

\- Dependencies (apps/api): express-session 1.19.0, connect-pg-simple

  10.0.0, @types/express-session 1.19.0, @types/connect-pg-simple 7.0.3.

\- Migration 20261020171603\_auth\_sessions (the one allowed Phase-03

  migration): CREATE TABLE user\_sessions (sid varchar PK, sess json,

  expire timestamptz(6)) + user\_sessions\_expire\_idx. Reviewed before

  apply: no DROP/TRUNCATE/DELETE/CASCADE, no users change, LF endings;

  previous 5 migrations byte-identical (sha256). Applied to

  maba\_printing\_dev with migrate dev (no reset); status clean, no

  drift; maba\_printing\_test rebuilt from migrations. Modelled as

  UserSession in schema.prisma; createTableIfMissing off.

\- Session: cookie maba.sid (HttpOnly, SameSite=Lax, Secure when

  NODE\_ENV=production, Path=/, 7-day maxAge, rolling off),

  saveUninitialized false (browsing creates no session), payload only

  userId / authenticatedAt / csrfToken; absolute 7-day lifetime also

  checked server-side.

\- CSRF: synchronizer token in the session, GET /api/v1/auth/csrf,

  header X-CSRF-Token on POST/PUT/PATCH/DELETE, timingSafeEqual; login

  and register not exempt. Rotated with every session regeneration.

\- CORS: allowlist now sends Access-Control-Allow-Credentials: true;

  methods GET/POST/PATCH/OPTIONS; headers Content-Type, X-CSRF-Token.

\- Startup change: the API now requires SESSION\_SECRET (>= 32 chars, no

  fallback) and DATABASE\_URL (session store pool). TRUST\_PROXY = hop

  count. /api/v1/health remains database- and session-independent.

\- Local dev SESSION\_SECRET generated into the git-ignored apps/api/.env.

\- Test harness: src/test/auth-db.ts (real PG store on the test DB,

  commit + deterministic cleanup of \*.test.invalid users and all test

  sessions via guarded removeTestAccounts); db:test:prepare and E2E

  clean also remove them.



TASK-03.02 Email/Password Registration: DONE (2026-10-21)

\- @node-rs/argon2 2.2.2: Argon2id, library defaults m=19456 KiB, t=2,

  p=1 (OWASP baseline); prebuilt N-API binary, no install script.

\- POST /api/v1/auth/register: strict body (name, email, password,

  optional whatsapp; unknown fields incl. role -> 400), MEMBER only,

  201 + AuthUserDto {name, email, role}; duplicate (any case) 409;

  KI-008 index violation (P2002) also 409; session regenerated.

\- Password policy 8-128 chars, not trimmed, no composition rules.

\- One normalizeEmail helper (trim + lowercase).



TASK-03.03 Email/Password Login: DONE (2026-10-21)

\- POST /api/v1/auth/login: one 401 "Invalid email or password" for

  unknown email, wrong password, Google-only and inactive accounts;

  dummy Argon2id verification when no hash exists; session + CSRF

  rotated on success.



TASK-03.04 Current User \& Authentication Middleware: DONE (2026-10-21)

\- resolvePrincipal re-reads role/active state from users each request;

  missing/inactive user or expired lifetime destroys the session.

  requireAuthenticated (401) / requireRole (403).

\- GET /api/v1/auth/me: 200 {data: AuthUserDto} or {data: null}.



TASK-03.05 Logout \& Session Lifecycle: DONE (2026-10-21)

\- POST /api/v1/auth/logout (CSRF): store row destroyed, cookie cleared

  with identical attributes, 200 {data: null}; old cookie replay is

  unauthenticated. Store pruning every 15 min in the running API.



TASK-03.06 Google Sign-In: DONE (2026-10-21)

\- google-auth-library 11.1.0 (OAuth2Client.verifyIdToken, audience =

  GOOGLE\_CLIENT\_ID); injectable GoogleIdentityVerifier; 503 when not

  configured. Linking policy: linked googleId signs in (active only);

  unverified email 401; new email -> MEMBER (no password); existing

  email without this Google identity -> 409, never auto-linked

  (pre-account-takeover risk without email verification); ADMIN never

  created or altered. No Google tokens stored; GOOGLE\_CLIENT\_SECRET not

  needed or read.



TASK-03.07 Member Profile: DONE (2026-10-21)

\- GET/PATCH /api/v1/account/profile, MEMBER only (401/403). ProfileDto

  {name, email, whatsapp, signInMethods}. PATCH: name and/or whatsapp

  (null/"" clears); unknown fields (role, email, isActive, ...) 400;

  empty body 400. Email change out of scope.

\- Verified so far: lint, typecheck clean; API unit 63, DB 123 tests.



TASK-03.08 Authentication UI \& Protected Member Routes: DONE (2026-10-21)

\- Routes /login, /signup, /account (protected, MEMBER). "Lanjut sebagai

  tamu" is a plain link to / (no request, no session). Header: Masuk /

  Daftar or Akun (desktop + mobile menu), hidden until auth state known.

\- API client (single): credentials "include" on every request; apiSend

  for POST/PATCH with in-memory CSRF token (lazy GET /auth/csrf, reset

  after sign-in/out, one retry on "Invalid CSRF token").

\- State: TanStack Query auth/me + account/profile; thin hooks

  (use-auth.ts, use-profile.ts); no context store; auth mutations use

  gcTime 0. Logout navigates home and clears cached session on unmount

  (avoids a guard bounce to /login).

\- RequireMember guard (loading / error+retry / redirect

  /login?redirect=... / non-member message); safeRedirectPath accepts

  internal paths only (rejects absolute, //, backslash, control chars,

  encoded tricks).

\- Google: direct GIS script (accounts.google.com/gsi/client), rendered

  only when VITE\_GOOGLE\_CLIENT\_ID is set; credential posted to the API.

\- Accessible forms (labels, hints/errors via aria-describedby,

  aria-invalid, focus first invalid field / error alert), Indonesian

  copy, autocomplete email/current-password/new-password/name/tel.

\- Verified: web lint/typecheck/build clean; web tests 166; bundle has

  no server secrets; sessionStorage only from React Router

  ScrollRestoration.



TASK-03.09 Authentication Security Hardening \& E2E: DONE (2026-10-21)

\- helmet 8.3.0: CSP default-src 'none' (+ base-uri, form-action,

  frame-ancestors 'none'), X-Frame-Options DENY, nosniff, Referrer-Policy

  no-referrer, CORP same-site, HSTS only with secure cookies.

\- express-rate-limit 8.7.1: failed sign-ins (login + Google shared) 20 /

  15 min per IP (successes not counted), registrations 10 / 15 min;

  429 {message: "Too many requests"}; injectable limits; in-process store

  (KI-015).

\- X-Request-ID: server-generated UUID per response (incoming ignored),

  exposed via CORS; unexpected-error logs contain only request ID,

  method, path and error name/code (no error objects, bodies, cookies).

\- JSON bodies on session-backed routes limited to 10 kB -> 413

  {message: "Payload too large"}; malformed JSON -> 400.

\- Playwright (Chromium, real API on maba\_printing\_test, PG sessions):

  sign-up -> account -> edit profile -> reload persists -> logout ->

  /account redirects to login; API-created member login (generic

  failure message, then success) and logout; continue as guest (no

  unsafe request, no CSRF fetch, no cookie); CSRF refusal of PATCH

  profile / logout without token; auth pages added to the 360/768/1280

  overflow check. Teardown removes E2E accounts and all test sessions.

  Google Sign-In not E2E-tested (needs a real Google account); covered by

  API integration tests with a fake verifier and component tests.

\- Docs: apps/api/.env.example (SESSION\_SECRET / DATABASE\_URL required,

  GOOGLE\_CLIENT\_ID, GOOGLE\_CLIENT\_SECRET unused, TRUST\_PROXY),

  apps/web/.env.example (VITE\_GOOGLE\_CLIENT\_ID), README status/env.

\- Known issues: KI-008 RESOLVED (application side done); new KI-015

  (rate-limit store), KI-016 (website hosting headers), KI-017 (no

  password/Google account linking; accepted).

\- Verified: lint, typecheck, build clean; npm test 249 (api 70, web

  166, shared 13); test:db 127; Playwright 13; test DB empty afterwards;

  dev API starts with the .env secret and fails fast (no value echoed)

  without/with a too-short SESSION\_SECRET.



TASK-03.10 Phase 03 Final Verification: PASS (2026-10-21)

\- Independent re-verification; no fixes. Details and findings in

  docs/ai/TASK\_03.10.md.

\- Git baseline 231c263; only Phase-03 paths changed; only .env.example

  tracked; protected docs unchanged. One new migration; 5 previous

  sha256-identical; dev status clean, no drift; test DB rebuilt from

  migrations.

\- format, lint, typecheck, build, prisma validate clean; npm test 249

  (api 70, web 166, shared 13); test:db 127; Playwright 13.

\- Live API on the test DB: 37/37 auth contract checks.

\- Dev DB fingerprint unchanged (migrations 5 -> 6, user\_sessions empty);

  test DB empty afterwards.

\- Findings: LOW KI-012, KI-013, KI-015, KI-016, KI-017 (accepted), Phase

  03 uncommitted; INFO 503 Google attempts count toward the sign-in

  budget, auth state via TanStack Query instead of a context provider,

  one early test fetched Google public certs (removed).



Phase 03 human acceptance (2026-10-21): APPROVED

\- Phase 03 verification PASS accepted; Phase 03 ACCEPTED / COMPLETE.

\- Findings carried forward unchanged (not fixed at closure): KI-012

  pagination LOW / deferred; KI-013 category-name matching LOW /

  deferred; KI-014 dev watcher MITIGATED; KI-015 in-process rate-limit

  store LOW / deployment; KI-016 website hosting headers LOW /

  deployment; KI-017 no automatic password/Google account linking —

  ACCEPTED conservative security decision; structured logging platform

  future.

\- Phase-03 work not yet committed (owner action).



\## Phase 04 — Order Submission, Private Files \& Tracking (ACCEPTED / COMPLETE)



Baseline: Phase 03 committed (8968244), clean tree, only .env.example

tracked. Dev DB baseline (2026-10-21): users 1 (created by the owner after

Phase 03), locations 2, services 7, products 5, settings 1, orders 0,

order\_files 0, migrations 6; content md5 c36a1131053ceaabaf9ba4d663242e98.

Dependencies: multer 2.4.0, @types/multer 2.3.0, file-type 22.1.1 (API);

react-hook-form 7.89.0 (web). No install scripts needed.



TASK-04.01 Order Architecture, Contracts \& Persistence Access: DONE

\- Zero migrations (Phase-01 schema sufficient).

\- Shared order-api.ts: types/statuses, PRD §14 status labels, handover

  methods, limits, paths, request/response DTOs, paginated envelope,

  parsePublicOrderId (trim + uppercase + exact pattern).

\- Public Order ID MP-<YYYY Asia/Jakarta>-<13 Crockford base-32> = 65 bits

  from crypto.randomBytes; injectable generator.

\- order.validator (strict discriminated union), order.repository

  (use-case functions, explicit selects), order.service,

  order-query.service, order-dto.mapper, inTransaction helper.



TASK-04.02 Core Order Submission \& Public Order IDs: DONE

\- POST /api/v1/orders (session section): CSRF (app level) -> submission

  rate limit (10 / 15 min / IP, separate from auth) -> principal ->

  multipart reader -> service. JSON bodies 64 kB on /orders, 10 kB

  elsewhere. 201 receipt {publicId, type, status, createdAt,

  requestedCompletionAt, estimatedTotal}. 503 if orders not configured.

\- MEMBER -> userId + history actor; guest and ADMIN sessions -> null

  (ADMIN orders are not linked). Snapshot never synced with profile.

\- One transaction: order + items + extension + files + history

  (null -> SUBMITTED). Collision retry up to 5 IDs only when the public

  ID really exists. Requested completion: future, <= 1 year, required

  except ATK. Inactive/unknown location 409.



TASK-04.03 Printing Request \& Private File Upload: DONE

\- Files optional (PRD §8) but printing needs description or a file.

\- multer disk storage to a private temp dir (random names, limits on

  files/size/fields/parts, early Content-Length refusal, temp files

  removed on response close); payload field = same strict JSON.

\- file-validation: extension + declared MIME + file-type detection must

  agree (OOXML via [Content\_Types].xml; zip/docm/html/exe refused) ->

  415; size 413; count/unexpected field 400; names sanitized (basename,

  no control chars, <= 200).

\- StorageService (put/download/delete/exists) + local adapter

  (apps/api/.local-storage/, exact .gitignore rule, keys orders/<32 hex>,

  traversal-proof, exclusive create). STORAGE\_PROVIDER only "local",

  refused in production; UPLOAD\_MAX\_FILES (5, cap 10),

  UPLOAD\_MAX\_FILE\_SIZE (10 MiB, cap 25 MiB), aggregate 25 MiB.

\- Compensation: files stored before the transaction and deleted on any

  later failure; failed deletion logged with keys only.

\- Retention job deferred (no completion workflow yet).



TASK-04.04 ATK Order Request: DONE

\- 1-20 distinct products, quantity 1-99; product active + active category

  + AVAILABLE else 409 per item; server snapshot of name/description/

  price/subtotal; estimatedTotal bounded to INTEGER; finalTotal null.



TASK-04.05 Laptop Service Request: DONE

\- DROP\_OFF / PICKUP; pickup address required for PICKUP, refused for

  DROP\_OFF; future handover time; distance/fee never from the client.



TASK-04.06 Software Installation Request: DONE

\- licenseAcknowledged: true required; canonical SOFTWARE\_LICENSE\_NOTE

  stored by the server.

\- Verified so far: API unit 152, DB 193 (orders-submit 22, files 19,

  types 14, tracking 11 + Phase 01-03 suites); no temp dirs left.



TASK-04.07 Guest Tracking \& Member Order History: DONE

\- GET /api/v1/orders/track/:publicId in the session-free public section

  with its own rate limit (60 / 15 min / IP): exact ID (normalized),

  malformed 400, unknown 404 "Order not found", DTO = publicId, type,

  status, createdAt, requestedCompletionAt, location name, timeline

  (status + time). No customer data, description, files, prices, ids,

  actors. Cache-Control no-store.

\- GET /api/v1/account/orders (page, pageSize <= 50; meta page, pageSize,

  total, totalPages; newest first) and /account/orders/:publicId (lookup

  by publicId AND userId; foreign/guest orders 404), MEMBER only.

  Member detail: snapshot, description, location, items, laptop/software

  details, totals, file name/MIME/size, timeline; never storage keys,

  admin notes or actors.



TASK-04.08 Order Forms, Receipt \& WhatsApp Handoff: DONE

\- react-hook-form 7.89.0 (React 19 peer OK); order forms on /printing,

  /atk, /laptop-service, /software-installation (replacing the Phase-02

  NextStepNotice, removed); shared CustomerFields (member prefill from the

  profile, never written back), WIB datetime inputs, accessible controls.

\- Receipt: Public Order ID (copy button), type, PRD status label,

  requested completion (WIB), estimated total, "Lacak pesanan" (ID passed

  in router state, not the URL), WhatsApp link only when

  BusinessSettings.whatsappNumber is set (wa.me digits, message with the

  public ID only, never auto-opened).

\- /track-order (explicit submit), /account/orders (pagination),

  /account/orders/:publicId; nav "Lacak Pesanan"; account page links to

  history.

\- API client: FormData bodies without manual Content-Type; orders error

  copy for 400/403/409/413/415/429/503.

\- Verified: web lint/typecheck/build clean; web tests 200.



TASK-04.09 Order Security, Validation \& E2E: DONE

\- E2E API: isolated storage <tmp>/maba-printing-e2e-storage and

  <tmp>/maba-printing-e2e-uploads (exact-path guarded), recreated per run;

  `e2e:fixtures:clean` removes all test-DB orders (removeAllOrders,

  asserted), accounts, sessions, E2E fixtures and E2E files.

\- Playwright (Chromium) +4 order journeys: guest printing with a PDF ->

  receipt (WhatsApp link with public ID only) -> track (normalized ID,

  404 for unknown, no customer/file data); member ATK (profile prefill,

  UNAVAILABLE not selectable, estimate) -> history -> detail; guest laptop

  pickup + software (acknowledgement); POST /orders without CSRF 403.

  Responsive check covers /track-order and /account/orders.

\- Docs: apps/api/.env.example (STORAGE\_PROVIDER, UPLOAD\_\* now read),

  README status/environment/E2E notes. Known issues: KI-015 extended

  (order limiters), KI-018 retention job deferred, KI-019 production

  storage / no malware scanning, KI-020 no idempotency key.

\- Dev API smoke: starts with storage root apps/api/.local-storage/

  (created empty, git-ignored); tracking 404; POST /orders w/o CSRF 403.

\- Verified: format, lint, typecheck, build clean; npm test 366 (api 152,

  web 200, shared 14); test:db 193; Playwright 17 (corrected in

  TASK-04.10: earlier recorded as 21); test DB, test and E2E storage

  empty afterwards.



TASK-04.10 Phase 04 Final Verification: PASS (2026-10-21)

\- Independent re-verification; no product fixes. Evidence and findings in

  docs/ai/TASK\_04.10.md.

\- Git scope clean; zero migrations; 6 migrations identical; dev/test

  status clean, no drift, test DB rebuilt.

\- format, lint, typecheck, build clean; npm test 366; test:db 193;

  Playwright 17; live API 32/32 on the test DB.

\- Dev DB fingerprint identical to the Phase-04 baseline; development

  storage empty; test DB and test/E2E storage empty afterwards.

\- Findings: LOW memory count correction (Playwright 17, not 21); LOW

  KI-012, KI-013, KI-015, KI-018, KI-019, KI-020, Phase-04 uncommitted;

  INFO public ID may appear in 500-error log paths, invalid submissions

  count toward the rate limit, file-less printing requests allowed with a

  description.



Phase 04 human acceptance (2026-10-21): APPROVED

\- Phase 04 verification PASS accepted; Phase 04 ACCEPTED / COMPLETE.

\- Findings carried forward unchanged (not fixed at closure): KI-012,

  KI-013 LOW / deferred; KI-014 MITIGATED; KI-015 in-process rate limits

  (auth + orders) LOW; KI-016 website hosting headers LOW; KI-017

  accepted Google linking decision; KI-018 30-day file retention cleanup

  deferred; KI-019 production object storage / malware scanning

  deferred; KI-020 no idempotency key for order submission LOW.

\- Phase-04 work not yet committed (owner action).



\## Phase 05 — Admin Operations \& Order Management (ACCEPTED / COMPLETE)



Baseline: Phase 04 committed (9175253), clean tree, only .env.example

files tracked, 6 migrations unchanged. Dev data baseline (2026-10-21,

created by the owner): users 1 (no ADMIN), locations 2, services 7,

products 5, settings 1, orders 1, order\_files 1 (1 file in

apps/api/.local-storage), payments 0, audit 0; md5 (users, locations,

services, products, orders) fc87c294b95097f84fa555591e6403d8.



TASK-05.01 Admin Access \& Authorization Foundation: DONE (2026-10-21)

\- Shared admin-api.ts: admin paths, ORDER\_STATUS\_TRANSITIONS +

  canTransition, payment methods/statuses + labels, pickup fee policy

  (pickupFeeFor: <= 5 km free, else ceil(km - 5) x Rp2.000), limits,

  Admin DTOs.

\- /api/v1/admin router (session + CSRF section): router-level

  resolvePrincipal + requireRole('ADMIN') — 401 signed out, 403 MEMBER,

  inactive/demoted Admin loses access at once. Admin rate limits:

  mutations 300 / 15 min (GET exempt), downloads 200 / 15 min.

\- admin/audit.ts: recordAudit (same transaction), stable action codes and

  entity types, changes() diff helper.

\- Provisioning: `npm run admin:create` (scripts/admin-create.ts,

  DATABASE\_URL; ADMIN\_EMAIL / ADMIN\_NAME / ADMIN\_PASSWORD from env;

  `--promote` for an existing MEMBER, role only, no reactivation; existing

  ADMIN unchanged; prints only the outcome). No HTTP admin creation.

\- Web: /admin/login (email + password via POST /auth/login, Admin role

  required to enter, no Google), RequireAdmin guard (loading / login

  redirect with safeAdminRedirectPath / MEMBER denial / error),

  AdminLayout shell + nav, public header "Admin" link for ADMINs.

\- Tests: API admin-access 10, web admin-access 18.



TASK-05.02..05.08 — API (2026-10-21; web pages follow in the same tasks)

\- Admin order module (src/admin/admin-order.\*): GET /admin/dashboard

  (groupBy status counts, pending payment confirmations, 5 recent;

  bounded query count), GET /admin/orders (page, pageSize <= 50, status,

  type, locationId, paymentStatus incl. "no payment = UNPAID", exact

  publicId; newest first), GET /admin/orders/:publicId (operational DTO:

  snapshot, member name/email, items, extensions, pricing, notes,

  payment with confirming Admin name, file metadata with IDs, timeline

  with actor names, allowedTransitions; no hashes/Google IDs/keys).

\- Commands (strict bodies, one transaction with audit):

  PATCH …/status {fromStatus, toStatus}: approved machine only (409

  "Status change not allowed"), stale/concurrent change 409 "Order status

  has changed" via conditional updateMany; completedAt on COMPLETED;

  history row with Admin actor; rollback if the audit insert fails.

  PATCH …/pricing {estimatedTotal?, finalTotal?, distanceKm?}: INTEGER

  Rupiah; distanceKm only for laptop PICKUP, pickupFee = 0 up to 5 km

  else ceil(km - 5) x 2000; item snapshots unchanged.

  PATCH …/notes {adminNotes}: <= 5000 plain text; audit change kind only.

  PATCH …/payment {method, status, amount}: one lazily created Payment;

  confirmedById/At set on entering PAID, kept while PAID, cleared on

  leaving PAID.

\- Download GET …/files/:fileId/download: file of that order, not deleted,

  StorageService stream, res.attachment (content-disposition encoding),

  stored MIME, nosniff, private no-store, audit ORDER\_FILE\_DOWNLOADED

  (file id, size), 200 / 15 min limiter; 404 for foreign/deleted/missing.

\- Retention (src/admin/file-retention.ts + `npm run files:cleanup`):

  COMPLETED and completedAt <= now - 30 days, deletedAt null; deletedAt

  set after deletion (missing object = deleted); failures keep the row,

  logged by file id; idempotent; refuses NODE\_ENV=production (local

  storage only). No scheduler.

\- Catalog/locations/settings (src/admin/admin-catalog.\*): list (incl.

  inactive), create, update for product/service categories, products,

  services, locations; PUT /admin/locations/:id/services/:serviceId

  {isAvailable} (LocationService upsert); no DELETE routes; audit

  \*\_CREATED/UPDATED/DEACTIVATED/REACTIVATED, LOCATION\_SERVICE\_

  AVAILABILITY\_UPDATED; FIXED services need a price (create and update);

  opening hours validated (all 7 days, <= 4 sorted non-overlapping

  HH:mm ranges, note) in the existing JSON shape; image refs https URL

  or root-relative path only. GET/PATCH /admin/settings upserts id = 1;

  social links http(s), platform keys [a-z0-9\_-]; audit field names +

  small before/after (never publicInfo text); public settings reflect

  changes immediately.

\- Test cleanup (test DB only) now also deletes admin\_audit\_logs before

  test accounts (audit rows reference their actor).

\- Verified: API unit 152, DB 308 (admin-orders 62, file-retention 6,

  admin-catalog 37, admin-access 10 + earlier suites).



TASK-05.02..05.08 — Web (2026-10-21): DONE

\- Admin pages /admin (dashboard: open-status counts linking to filtered

  queue, pending payment confirmations, recent orders), /admin/orders

  (filters in the URL, exact ID search, pagination), /admin/orders/

  :publicId (status buttons for allowed transitions only; pricing with

  pickup-fee preview; payment; internal notes; downloads via API links;

  retained files marked deleted; page-level notice for success and 409

  conflicts, forms remount with fresh data), /admin/products,

  /admin/services (KI-013 naming warning), /admin/locations (structured

  opening-hours editor, optimistic per-location service toggles),

  /admin/settings (sends only changed fields so legacy values never block

  saves; refreshes public settings).

\- Shared: pickupFeeFor, canTransition tests.



TASK-05.09 Admin Security, Audit \& E2E: DONE (2026-10-21)

\- Fixes found in this pass: CORS preflight now allows PUT (location

  service toggle cross-origin); settings form sent unchanged legacy

  values (bare storage-key QRIS ref) that the new validation rejected —

  now sends changed fields only; admin tables `relative` so sr-only

  header labels cannot widen the page at 360 px.

\- E2E: synthetic Admin provisioned by the E2E API (test DB only);

  fixture cleanup also removes catalog rows under E2E categories and all

  audit rows (test DB only). Playwright +4 admin journeys: member denied

  (UI + API 403); guest order -> admin login with safe redirect ->

  download (attachment name) -> pricing -> notes -> SUBMITTED..COMPLETED

  -> payment PAID by Admin E2E -> public tracking "Pesanan Selesai"

  without notes/prices -> admin PATCH without CSRF 403; product created

  and public at once, location service toggle persisted (cross-origin

  PUT), social link shown in the footer, then restored; admin pages at

  360 px without horizontal overflow.

\- Operator CLIs smoke-tested against the TEST database: admin:create

  (created / already-admin / missing variable; no password printed),

  files:cleanup (0 eligible).

\- Docs: README (status, Admin section, operator commands, not-yet list),

  apps/api/.env.example (ADMIN\_\* operator variables, files:cleanup).

  Known issues: KI-018 MITIGATED (scheduler + production storage remain),

  KI-015 extended (admin limiters), new KI-021 (QRIS image configuration

  only).

\- Verified: format, lint, typecheck, build clean; npm test 397 (api 152,

  web 229, shared 16); test:db 308; Playwright 21; test DB and test/E2E

  storage empty afterwards.



TASK-05.10 Phase 05 Final Verification: PASS (2026-10-21)

\- Independent re-verification; no fixes. Evidence in docs/ai/TASK\_05.10.md.

\- Git scope clean, no dependency or migration changes; dev/test migration

  status clean, test DB rebuilt; format/lint/typecheck/build clean;

  npm test 397, test:db 308, Playwright 21; live Admin API 35/35 with

  audit rows verified; dev DB fingerprint and dev storage unchanged.

\- Findings: LOW KI-012, KI-013, KI-015, KI-016, KI-019, KI-020, KI-021,

  KI-018 mitigated (no scheduler), Phase-05 uncommitted; INFO catalog

  lists capped at 500, Admin accounts via operator command only, pickup

  fee per started km, Content-Length from metadata, synthetic E2E admin

  credential.



Phase 05 human acceptance (2026-10-22): APPROVED

\- Phase 05 verification PASS accepted; Phase 05 ACCEPTED / COMPLETE.

\- Human-approved business rule (2026-10-22) — laptop pickup fee:

  \- distance <= 5 km: Rp0

  \- distance > 5 km: ceil(distanceKm - 5) x Rp2,000

  \- each started additional kilometre is charged as one full additional

    kilometre

  \- no Maps API; the Admin supplies/records the operational distance

  Accepted for the MVP unless a future explicit business decision changes

  it. Interprets PRD §11 "Rp2.000 per additional km" (frozen PRD not

  edited); implemented by pickupFeeFor in packages/shared/src/admin-api.ts.

\- Findings carried forward unchanged (not fixed at closure): KI-012,

  KI-013 LOW / deferred (Admin UI warns about KI-013); KI-014 MITIGATED;

  KI-015 in-process rate limits (auth, orders, admin) LOW; KI-016 website

  hosting headers LOW; KI-017 accepted Google linking decision; KI-018

  MITIGATED (cleanup engine implemented, production scheduling

  deferred); KI-019 production object storage / malware scanning

  deferred; KI-020 no idempotency key for order submission LOW; KI-021

  QRIS image configured/stored but not shown to customers.

\- Phase-05 work not yet committed (owner action).



\## Phase 06 — Remaining MVP Experience \& Customer Payment UX (AUTONOMOUSLY COMPLETED / VERIFIED)



Baseline: Phase 05 committed (aca6d83), clean tree, only .env.example

files tracked, 6 migrations unchanged, test DB isolation intact, dev

storage 1 file (human-created). Noted: a stray tracked file named

"git diff" (captured `git diff --stat` output from the Phase-01 commit, no

secrets) — removal scheduled for the Phase-09 release-candidate hygiene.



TASK-06.01 Remaining MVP Gap Audit: DONE (2026-10-22)

\- Gaps: customer QRIS display (KI-021), member payment state, duplicate

  submissions (KI-020), unbounded catalog lists (KI-012), name-keyword

  service mapping (KI-013). Production DB/deployment/smoke (PRD §32) are

  Phases 07-09. Decisions recorded in docs/ai/PHASE\_06.md.



TASK-06.02 Customer Payment Information Contract: DONE (2026-10-22)

\- Shared safeImageRef (packages/shared/src/image-ref.ts): one definition

  of browser-safe image references (https URL with host, no credentials,

  no whitespace/backslash; root-relative path without //, /\ or ..),

  used by the API (QRIS publishing, Admin imageRef validation) and the web

  (resolveImageRef). Also closes "/\host" protocol-relative paths that

  bypassed the old web check.

\- PublicSettingsDto.qrisImageRef (safe refs only; legacy storage keys ->

  null). MemberOrderDetailDto.payment {method, status, amount} | null

  (never payment ID, confirming Admin or confirmation time). Guest

  tracking DTO unchanged.



TASK-06.03 / 06.04 Static QRIS and Payment Status UX: DONE (2026-10-22)

\- PaymentInfo component: Cash / QRIS instructions, QRIS image (alt text,

  fixed size, hidden if it fails to load), manual-confirmation notice

  ("tidak berubah otomatis"), WhatsApp hand-off with the Public Order ID.

  Shown on the receipt, the member order detail (with payment status in

  text: Belum dibayar / Menunggu konfirmasi / Lunas, method, amount) and

  the tracking page (instructions only, no payment state; hidden for

  CANCELLED/COMPLETED). Hidden instructions for PAID or CANCELLED orders.



TASK-06.05 Order Idempotency (KI-020): DONE (2026-10-22)

\- Additive infrastructure migration 20261022011511\_order\_submission\_keys

  (key\_hash PK, order\_id unique FK, user\_id FK, request\_hash, created\_at;

  hex CHECKs). Applied to dev with `prisma migrate deploy` after a pg\_dump

  backup (scratchpad); dev data fingerprint otherwise unchanged.

\- POST /orders accepts Idempotency-Key ([A-Za-z0-9\_-]{16,128}); replay of

  the same request by the same submitter -> 200 + Idempotent-Replayed with

  the original receipt, checked before files are stored; key row written

  in the order transaction; concurrent duplicates -> exactly one order

  (PK conflict -> files compensated -> replay); different request or

  different owner -> 409 without order data; 24-hour expiry (expired rows

  pruned in the transaction); no key -> previous behavior. CORS allows the

  header.

\- Web: key per distinct submission (request + file metadata), reused on

  resend after an error, renewed after success or change; network-error

  copy reassures that resending creates no duplicate.

\- Tests: 13 DB tests (replay JSON/multipart, guest new session, conflict,

  member binding, expiry, concurrency x2, malformed keys, no key); web

  key-reuse test.



TASK-06.06 Public Catalog Pagination (KI-012): DONE (2026-10-22)

\- GET /products and /services: page/pageSize (default/max 100), meta

  {count, page, pageSize, total, totalPages}; web fetchCatalog reads pages

  in order (cap 20). Locations unpaginated by design.



TASK-06.07 Service Business-Line Mapping (KI-013): DONE (2026-10-22)

\- Shared SERVICE\_LINES / serviceLinesForCategory; Admin services page shows

  "Tampil di halaman: ..." per category or an unmatched warning. KI-013

  MITIGATED; business-line column remains a human decision.



TASK-06.08 Customer UX / Accessibility / Error Hardening: DONE (2026-10-22)

\- Audit of public, auth, order, tracking, account and payment views:

  labels/aria-describedby, focus targets, skip link, reduced motion,

  text status labels were already sound. Fixed: a 401 from an account or

  Admin query now re-checks the session so guards redirect to login

  (session expiry); load errors explain 401/403/404/429 specifically;

  network-error copy for orders explains safe resending; Admin and member

  pages carry robots noindex (PRD §27) and public/robots.txt disallows

  /admin and /account.



TASK-06.09 Full MVP Integration E2E: DONE (2026-10-22)

\- e2e/mvp-journey.spec.ts (+3): lost response (request committed,

  connection reset) -> resend returns the same Public Order ID, receipt

  shows the static QRIS (synthetic PNG via Playwright route) and the

  manual-confirmation notice, tracking shows instructions without payment

  state; member laptop pickup -> Admin distance 7.3 km (fee Rp6.000),

  final total, CONFIRMED, QRIS PAID -> member sees Lunas, fee and amount,

  no Admin identity, no QRIS once paid; guest legal software request ->

  tracking without private data. E2E settings QRIS ref is now a website

  path. Playwright 24 passed.

\- Known issues: KI-012 RESOLVED, KI-013 MITIGATED, KI-020 RESOLVED,

  KI-021 RESOLVED.



TASK-06.10 Phase 06 Independent Verification: PASS (2026-10-22)

\- No fixes. Evidence in docs/ai/TASK\_06.10.md: git scope; previous 6

  migrations identical + 1 additive; dev/test status, test rebuild, no

  drift; gates clean; npm test 449 (api 159, web 248, shared 42), test:db

  324, Playwright 24; live API 19/19; dev DB/storage unchanged; test

  DB/storage empty.

\- Findings: F-1 LOW flaky pre-existing Admin E2E toggle step (reload

  before the PUT completes; 2 of 6 runs under load) -> Phase 07 test

  stabilization; F-2 LOW single 529 kB web chunk; F-3 LOW idempotency key

  lost on page reload; F-4 LOW KI-013 needs a human decision.



\## Phase 07 — Security, Reliability \& Production Hardening (AUTONOMOUSLY COMPLETED / VERIFIED)



Baseline: Phase 06 checkpoint commit 8a46464, clean tree.



TASK-07.01 Threat Model \& Regression Baseline: DONE (2026-10-22)

\- docs/SECURITY.md: assets, actors, 16 attack surfaces with mitigations and

  code references, residual risks. Found: SameSite=Lax is hard-coded

  (KI-022, Phase 08). Fixed TASK-06.10 F-1: the Admin E2E toggle step now

  waits for the PUT response before reloading.



TASK-07.02 Rate Limiting (KI-015): DONE (2026-10-22)

\- Migration 20261022015824\_rate\_limit\_counters (additive; key PK, hits,

  reset\_at, CHECK hits >= 0); PostgresRateLimitStore (atomic upsert,

  decrement, reset, opportunistic prune); RATE\_LIMIT\_STORE (production

  default postgres); one store per limiter prefix. 7 DB tests incl. two

  app instances sharing one budget and 40 concurrent increments.



TASK-07.03 Website Security Headers (KI-016): DONE (2026-10-22)

\- apps/web/hosting/security-headers.ts + vite preview plugin;

  playwright.preview.config.ts + e2e-preview spec (production build, 10

  routes, no CSP violations/console errors, immutable assets);

  `npm run test:e2e:preview -w @maba-printing/web`.



TASK-07.04 Storage Boundary (KI-019): DONE (2026-10-22)

\- storage-factory.ts (single adapter choice; server and CLI use it);

  reusable contract suite src/test/storage-contract.ts (exact bytes, no

  overwrite, idempotent delete, missing download rejects, invalid keys

  rejected everywhere) run against the local adapter.



TASK-07.05 Malware-Scanning Boundary (KI-019): DONE (2026-10-22)

\- uploads/file-scanner.ts: none and clamav (clamd zINSTREAM, 64 KiB

  chunks, timeout, zPING readiness); scan after content validation and

  before storage; infected -> 422 files.N, unavailable -> 503, nothing

  stored, no order; UPLOAD\_SCANNER required in production; web copy for

  422. Tests with a fake clamd server (clean/infected/large/error/refused/

  timeout/ping) and DB tests.



TASK-07.06 Retention Scheduling Contract (KI-018): DONE (2026-10-22)

\- CLI moved to src/cli/files-cleanup.ts (built to dist/cli); advisory lock

  (DB-tested across connections); one JSON summary line; exit codes;

  storage factory. Smoke-tested on the test DB.



TASK-07.07 Logging, Readiness \& Diagnostics: DONE (2026-10-22)

\- observability/logger.ts (JSON lines, LOG\_LEVEL, secret-looking fields

  dropped); request-log middleware (route template only, never concrete

  paths/IDs; probes at debug); error handler, compensation, session store

  and startup log through it; GET /api/v1/readiness (database 2 s,

  storage, scanner ping; 503 without details); health unchanged.



TASK-07.08 Backup / Restore / Migration Procedures: DONE (2026-10-22)

\- docs/BACKUP\_RESTORE.md and docs/OPERATIONS.md (probes, log events,

  operator commands, scheduling, migrate deploy flow, rollback, rate

  limits, scanning, routine checks); docs/DEPLOYMENT.md started (headers,

  storage and scanner requirements). Restore rehearsal on a disposable

  database: seeded test DB dumped, restored into

  maba\_printing\_restore\_check, fingerprints and migration history

  identical, migrate status up to date, disposable DB dropped, test DB

  rebuilt empty. `npm run check:migrations` (manifest of applied migration

  hashes; tamper test fails as expected).



TASK-07.09 Security \& Reliability Regression: DONE (2026-10-22)

\- Admin area lazy-loaded (React Router lazy; separate admin-pages chunk

  47 kB; main chunk 483 kB / 149 kB gzip, no size warning); loading

  fallback; test setup warms the chunk.

\- Verified: format, lint, typecheck, build; npm test 493 (api 192, web

  259, shared 42); test:db 335; Playwright 24 (after build+unit+DB, the

  F-1 sequence); preview E2E 2; check:migrations OK.

\- Known issues: KI-015 RESOLVED, KI-016 MITIGATED, KI-018 MITIGATED

  (contract), KI-019 OPEN (boundaries ready, provider pending), KI-022

  added.



TASK-07.10 Phase 07 Independent Verification: PASS (2026-10-22)

\- No fixes. Evidence in docs/ai/TASK\_07.10.md: committed migrations

  unchanged + 1 additive; no drift; gates clean; npm test 493, test:db

  335, Playwright 24 (x2), preview E2E 2; live two-process checks

  (shared rate limits, readiness, scanner fail-closed, production guard);

  dev DB/storage unchanged; test DB empty.

\- Findings: F-1 LOW package.json description encoding; F-2 LOW

  admin-create not yet a built CLI; KI-022 MEDIUM (Phase 08).



\## Next Action



Final autonomous run: Phase 07 verified; create the Phase-07 checkpoint

commit, then start Phase 08 (Production Infrastructure \& Deployment

Readiness).

