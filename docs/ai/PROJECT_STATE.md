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



Phase 00 accepted by human approval (2026-10-20). Phase 01 has

NOT started.



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

\- PostgreSQL setup

\- Prisma setup

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

(initialized by the owner; branch master, no commits yet).

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



\## Next Action



Phase 00 accepted. TASK-00.10 findings V-1, V-2, V-3 addressed at

closure. Await Phase 01 planning; do not start Phase 01 without

explicit instruction.

