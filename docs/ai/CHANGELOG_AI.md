\# MABA PRINTING — AI Development Changelog



This document records implementation work

performed with AI assistance.



Do not use this file as a replacement for Git history.



\---



\## PRE-IMPLEMENTATION



Status:

COMPLETE



Completed:



\- Product discovery

\- PRD v1.0

\- Technical Architecture v1.0

\- AI development workflow



Production code changed:



None.



\---



\## TASK-00.01 — Repository Initialization



Date: 2026-10-20



Status:

COMPLETED



Changes:



\- Renamed spec and AI-memory documents to the underscored

  names referenced by all documents (user approved; content

  unchanged, verified by checksum)

\- Created apps/web, apps/api, packages/shared (.gitkeep only)

\- Created private root package.json with workspaces

  apps/\* and packages/\* and delegating root scripts

\- Created .gitignore, .env.example (names only), README.md

\- Ran npm install (generated package-lock.json, no dependencies)



Git:

Not initialized (user decision; see KI-002).

\[Correction at closure, 2026-10-20: the deliberate project-local

Git deferral is tracked as KI-004. KI-002 was reworded during

recovery and now describes the parent home-directory Git

repository risk.\]



Production code changed:



None.



\---



\## TASK-00.01 — Recovery



Date: 2026-10-20



Trigger:

Independent verification returned FAIL.



Findings addressed:



\- F-1 (MEDIUM, blocking): .gitignore rules storage/ and

  uploads/ matched directories at any depth and would hide

  future source code. Removed both rules; no replacement

  storage rule added (storage location not yet decided).

\- F-2 (LOW): the same rules were scope expansion; resolved

  by the F-1 removal.

\- F-3 (LOW): workspace globs confirmed using a scratchpad

  copy with sample workspace packages; recorded in

  PROJECT\_STATE.md.

\- F-4 (LOW): KI-002 reworded to describe the parent

  home-directory Git repository risk; deferred project-local

  Git initialization recorded as KI-004.

\- F-5 (LOW): PROJECT\_STATE.md records that root

  build/test/lint/typecheck scripts were executed and exit 1

  because no workspace package.json exists yet.



Files changed:

.gitignore, docs/ai/PROJECT\_STATE.md, docs/ai/CURRENT\_TASK.md,

docs/ai/CHANGELOG\_AI.md, docs/ai/KNOWN\_ISSUES.md



Status:

COMPLETED



Production code changed:



None.



\---



\## TASK-00.01 — Re-Verification and Closure



Date: 2026-10-20



Re-verification:

PASS (F-1 fixed; requirements satisfied; no blocking defect).



Acceptance:

Formally accepted by human approval. TASK-00.01 CLOSED.



Documentation changes:



\- Recorded re-verification PASS and closure in

  PROJECT\_STATE.md, CURRENT\_TASK.md, CHANGELOG\_AI.md

\- Added correction note to the TASK-00.01 Git line

  (deferral tracked as KI-004)

\- Recorded re-verification finding R-1 as KI-005 (LOW,

  non-blocking) in KNOWN\_ISSUES.md



Production code changed:



None.



\---



\## TASK-00.02 — React + Vite + TypeScript Foundation



Date: 2026-10-20



Status:

COMPLETED (awaiting human acceptance)



Changes:



\- apps/web initialized as @maba-printing/web from official

  create-vite 9.3.1 react-ts template (generated in a

  scratchpad, foundation files copied in)

\- Demo content and template oxlint removed; minimal neutral

  App shell ("MABA PRINTING" + foundation message)

\- Scripts: dev, build, typecheck, preview

\- Root npm install updated package-lock.json

\- apps/web/.gitkeep removed

\- README.md status lines updated to reflect the frontend

  foundation



Dependencies introduced:

react, react-dom, vite, @vitejs/plugin-react, typescript,

@types/react, @types/react-dom, @types/node



Verification:

typecheck PASS, build PASS, render check PASS, preview PASS,

workspace PASS; lint/tests NOT\_APPLICABLE.



Production code changed:



Frontend foundation shell only; no product features.



\---



\## TASK-00.03 — Express + TypeScript Foundation



Date: 2026-10-20



Status:

COMPLETED (awaiting human acceptance)



Changes:



\- apps/api initialized as @maba-printing/api (ESM, nodenext)

\- src/app.ts (createApp, GET /api/v1/health only) and

  src/server.ts (temporary port 3000)

\- Scripts: dev, typecheck, build, start

\- Root package-lock.json updated by npm

\- apps/api/.gitkeep removed

\- README.md status lines updated for the backend foundation



Dependencies introduced:

express; dev: typescript, @types/node, @types/express, tsx



Verification:

typecheck PASS, build PASS, compiled start PASS, health

HTTP 200 + {"status":"ok"} PASS, tsx dev PASS, frontend

unaffected PASS; lint/tests NOT\_APPLICABLE.



Production code changed:



Backend foundation with one technical health endpoint only;

no product features.



\---



\## TASK-00.04 — Shared Package Foundation



Date: 2026-10-20



Status:

COMPLETED (awaiting human acceptance)



Changes:



\- packages/shared initialized as @maba-printing/shared

  (ESM, nodenext, declarations to dist/, single "exports"

  entry, empty public API)

\- Root package-lock.json updated by npm (workspace link only)

\- packages/shared/.gitkeep removed

\- README.md structure line updated

\- KNOWN\_ISSUES.md: added KI-006 (shared build order)



Dependencies introduced:

None new; dev dependency typescript ~6.0.3 declared (deduped).



Verification:

typecheck PASS, build PASS, entry point PASS, web/api still

PASS, root workspace PASS; lint/tests NOT\_APPLICABLE.



Production code changed:



None (empty shared entry point only).



\---



\## TASK-00.05 — TypeScript Configuration



Date: 2026-10-20



Status:

COMPLETED (awaiting human acceptance)



Changes:



\- Added tsconfig.base.json (common policy, explicit strict)

\- shared/api/web configs extend it; environment settings kept

  per workspace

\- Project references: api and web reference shared (composite)

\- Build info files moved inside dist/ for shared and api

\- Scripts: shared build tsc -b; api build tsc -b; api

  typecheck builds shared first, then tsc --noEmit

\- KNOWN\_ISSUES.md: KI-006 PARTIALLY\_RESOLVED

\- README.md structure lists tsconfig.base.json



Dependencies introduced:

None.



Verification (from clean generated-output state):

all typecheck/build PASS, root typecheck/build PASS, consumer

reference probe PASS, api health PASS; lint/tests NOT\_APPLICABLE.



Production code changed:



None (configuration and scripts only).



\---



\## TASK-00.06 — Code Quality



Date: 2026-10-20



Status:

COMPLETED (awaiting human acceptance)



Changes:



\- Added eslint.config.mjs, .prettierrc.json, .prettierignore

\- Root scripts: lint (eslint .), format, format:check;

  workspace lint scripts

\- apps/web/src/App.tsx: Prettier line wrap (no behavior change)

\- KNOWN\_ISSUES.md: KI-005 notes the same any-depth pattern in

  ESLint/Prettier ignores



Dependencies introduced (root, dev only):

eslint, @eslint/js, typescript-eslint, eslint-plugin-react-hooks,

eslint-plugin-react-refresh, globals, prettier,

eslint-config-prettier



Verification:

all lint PASS, format:check PASS, violation probes caught,

clean-state typecheck/build PASS, render/health unchanged;

tests NOT\_APPLICABLE.



Production code changed:



Formatting only (App.tsx line wrap).



\---



\## TASK-00.07 — Environment Configuration



Date: 2026-10-20



Status:

COMPLETED (awaiting human acceptance)



Changes:



\- Split root .env.example into apps/api/.env.example

  (server-only) and apps/web/.env.example (VITE\_\* public);

  root .env.example removed; inventory unchanged

\- Added apps/api/src/config/env.ts (loadConfig, readRequired)

\- apps/api/src/server.ts: optional .env loading via

  process.loadEnvFile; port from loadConfig() (fallback 3000)

\- README.md: Local Environment section



Dependencies introduced:

None.



Verification:

ignore/trackable PASS, PORT cases PASS, startup scenarios PASS,

no secret logged PASS, web boundary PASS, clean-state

typecheck/build/lint/format PASS; tests NOT\_APPLICABLE.



Production code changed:



API startup configuration only (port from environment).



Correction (human-requested, before closure):

Root .env.example restored as the canonical reference inventory

(same 16 variables; header changed to "reference only, not loaded

at runtime"). No runtime change.



\---



\## TASK-00.08 — Testing Foundation



Date: 2026-10-20



Status:

COMPLETED (awaiting human acceptance)



Changes:



\- Vitest tests: shared entry point, api health (Supertest),

  web App heading (React Testing Library + jsdom)

\- Playwright smoke test (Chromium) with own dev server

\- apps/web/vite.config.ts test block; src/test/setup.ts;

  playwright.config.ts

\- shared/api: tsconfig.build.json added (emit, excludes tests);

  tsconfig.json now no-emit incl. tests; references updated

\- Scripts: test, test:watch (all workspaces); test:e2e (web)

\- README.md: Testing section



Dependencies introduced (dev only):

vitest, supertest, @types/supertest, jsdom,

@testing-library/react, @testing-library/dom,

@testing-library/jest-dom, @playwright/test



Verification:

4 test layers PASS (1 test each), mutation checks PASS,

clean-state typecheck/build PASS, lint/format PASS, servers

stopped.



Production code changed:



None.



\---



\## TASK-00.09 — Unified Scripts \& Workspace Orchestration



Date: 2026-10-20



Status:

COMPLETED (awaiting human acceptance)



Changes:



\- packages/shared: conditional exports (development -> src)

\- apps/api dev script: tsx --conditions=development

\- Root scripts: dev, dev:web, dev:api, build (ordered),

  start:api, test:e2e, clean (existing typecheck/lint/format/

  format:check/test kept)

\- README.md: Commands section

\- KNOWN\_ISSUES.md: KI-006 RESOLVED



Dependencies introduced (root, dev only):

concurrently



Verification (from clean state, after npm ci):

typecheck/build/lint/format PASS, tests 3/3 PASS, E2E 1/1 PASS,

start:api health PASS, dev web+api PASS, KI-006 real-import

probe PASS, no leftover processes.



Production code changed:



None (package metadata and scripts only).



\---



\## TASK-00.10 — Phase 00 Final Verification



Date: 2026-10-20



Verdict:

PASS (awaiting human acceptance of Phase 00)



Scope:

Independent verification only; no fixes applied. Clean-state

typecheck/build, production API and web, root dev, lint, format,

Vitest 3/3, Playwright 1/1 (Chromium), environment/secret, Git,

Known Issues, documentation and scope audit.



Non-blocking findings recorded in CURRENT\_TASK.md (V-1 to V-3,

all LOW).



Production code changed:



None.



\---



\## PHASE 00 — Acceptance and Closure



Date: 2026-10-20



Status:

ACCEPTED / COMPLETE (human approval)



Closure housekeeping:



\- V-1: root clean script extended to remove test-results,

  playwright-report and coverage (verified safe)

\- V-2: PROJECT\_STATE "Current Stage" corrected

\- V-3: PROJECT\_STATE shared export/reference descriptions

  corrected; superseded TASK-00.05 wording marked

\- KNOWN\_ISSUES.md unchanged



Production code changed:



None.



Next:

Awaiting Phase 01 planning.



\---



\## TASK-01.01 — PostgreSQL \& Prisma Foundation



Date: 2026-10-20



Status:

COMPLETED (awaiting human acceptance); PostgreSQL connectivity

NOT verified (no instance available, KI-007)



Changes:



\- Prisma 7.10.1 + PostgreSQL foundation in apps/api: schema

  (no models), prisma.config.ts, getPrisma() lazy client

\- api scripts: postinstall/typecheck/build generate the client;

  db:\* scripts (also at root)

\- Generated client ignored by Git/ESLint/Prettier (anchored)

\- apps/api/.env.example: DATABASE\_URL documentation

\- KNOWN\_ISSUES.md: KI-007 (no local PostgreSQL)



Dependencies introduced (apps/api):

@prisma/client, @prisma/adapter-pg, pg; dev: prisma, @types/pg



Verification:

validate/generate PASS, clean-state typecheck/build PASS,

lint/format PASS, tests 3/3 + E2E 1/1 PASS, health PASS,

web exposure PASS; DB connectivity NOT\_RUN.



Production code changed:



apps/api/src/db/prisma.ts (not used by any route yet).



Closure prerequisite (human-approved Docker, 2026-10-20):

\- compose.dev.yml: local development PostgreSQL 17 (postgres:17,

  server 17.11), loopback port 5432, named volume, healthcheck

\- Root scripts db:start, db:stop, db:status

\- apps/api/.env.example local Docker URL comment; README local

  database section

\- Verified Prisma connectivity (db execute, getPrisma query);

  regression PASS

\- KNOWN\_ISSUES.md: KI-007 RESOLVED



\---



\## TASK-01.02 — Core Identity \& Location Schema



Date: 2026-10-20



Status:

COMPLETED (awaiting human acceptance)



Changes:



\- schema.prisma: enum UserRole; models User, Location

\- Migration 20261020125104\_core\_identity\_locations (reviewed

  with --create-only, then applied to local maba\_printing\_dev)

\- Prisma Client regenerated

\- KNOWN\_ISSUES.md: KI-008 (case-sensitive email uniqueness),

  KI-009 (migration line endings vs checksums, to verify)



Dependencies introduced:

None.



Verification:

validate/generate/migrate/status PASS, PostgreSQL inspection

PASS, rolled-back constraint and client probes PASS, clean-state

typecheck/build PASS, lint/format PASS, tests 3/3, E2E 1/1,

health PASS.



Production code changed:



Database schema and migration only; no endpoints or services.



\---



\## TASK-01.03 — Catalog Schema



Date: 2026-10-20



Status:

COMPLETED (awaiting human acceptance)



Changes:



\- schema.prisma: enums PriceType, ProductAvailability; models

  ServiceCategory, Service, LocationService (composite PK),

  ProductCategory, Product (incl. imageRef); Location

  back-relation (TASK-01.03)

\- Migration 20261020130233\_catalog\_foundation (reviewed with

  --create-only, applied to local maba\_printing\_dev)

\- Prisma Client regenerated



Dependencies introduced:

None.



Verification:

validate/generate/migrate/status PASS, PostgreSQL inspection

PASS, rolled-back SQL and client probes PASS, clean-state

typecheck/build PASS, lint/format PASS, tests 3/3, E2E 1/1,

health PASS.



Production code changed:



Database schema and migration only; no endpoints or services.



\---



\## TASK-01.04 — Order Schema



Date: 2026-10-20



Status:

COMPLETED (awaiting human acceptance)



Changes:



\- schema.prisma: enums OrderType, OrderStatus, HandoverMethod;

  models Order (publicId, customer snapshot, adminNotes),

  OrderItem (catalog snapshots), LaptopServiceRequest,

  SoftwareInstallationRequest (orderId PK); back-relations on

  User, Location, Service, Product

\- Migration 20261020132657\_order\_foundation (reviewed with

  --create-only, applied to local maba\_printing\_dev); all FKs

  ON DELETE RESTRICT

\- Prisma Client regenerated

\- KNOWN\_ISSUES.md: KI-010 (pg deprecation warning via adapter)



Dependencies introduced:

None.



Verification:

validate/generate/migrate/status PASS, PostgreSQL inspection

PASS, rolled-back guest/member/snapshot/RESTRICT probes PASS,

client probe PASS, clean-state typecheck/build PASS, lint/format

PASS, tests 3/3, E2E 1/1, health PASS.



Production code changed:



Database schema and migration only; no endpoints or services.



\---



\## TASK-01.05 — Payment, History, Files Metadata \& Audit Schema



Date: 2026-10-20



Status:

COMPLETED (awaiting human acceptance)



Changes:



\- schema.prisma: enums PaymentMethod, PaymentStatus; models

  Payment (one per order), OrderStatusHistory (reuses

  OrderStatus), OrderFile (metadata only), AdminAuditLog

  (generic, JSONB metadata), BusinessSettings (typed singleton)

\- Migration 20261020133802\_payment\_history\_files\_audit

  (reviewed with --create-only, applied to local

  maba\_printing\_dev); all FKs ON DELETE RESTRICT

\- Prisma Client regenerated

\- KNOWN\_ISSUES.md: KI-011 (WhatsApp/business-name source of

  truth)



Dependencies introduced:

None.



Verification:

validate/generate/migrate/status PASS, PostgreSQL inspection

PASS, rolled-back SQL and client probes PASS, clean-state

typecheck/build PASS, lint/format PASS, tests 3/3, E2E 1/1,

health PASS.



Production code changed:



Database schema and migration only; no endpoints or services.



\---



\## TASK-01.06 — Database Constraints \& Indexes



Date: 2026-10-20



Status:

COMPLETED (awaiting human acceptance)



Changes:



\- Migration 20261020135726\_database\_constraints\_indexes

  (reviewed with --create-only, applied to local

  maba\_printing\_dev): 11 indexes, 15 CHECK constraints and the

  unique lower(email) index (custom SQL; no triggers)

\- schema.prisma: @@index entries; comments naming the CHECKs

\- KNOWN\_ISSUES.md: KI-008 resolved at database level; KI-011

  decided (business\_settings authoritative)

\- Prisma Client regenerated



Dependencies introduced:

None.



Verification:

validate/generate/migrate/status PASS, empty schema-vs-database

diff, 25 invalid probes rejected and valid cases accepted (rolled

back), index inspection PASS, clean-state typecheck/build PASS,

lint/format PASS, tests 3/3, E2E 1/1, health PASS.



Production code changed:



Database migration and schema annotations only; no endpoints or

services.



\---



\## TASK-01.07 — Seed \& Development Data



Date: 2026-10-20



Status:

COMPLETED (awaiting human acceptance)



Changes:



\- apps/api/prisma/seed.ts: synthetic, idempotent local seed

  (business settings, 2 locations, service and ATK catalog,

  location availability); no users, no orders

\- prisma.config.ts: migrations.seed; db:seed scripts (api, root)

\- apps/api/tsconfig.json: include prisma/seed.ts

\- README: migrate + seed steps



Dependencies introduced:

None (tsx already present).



Verification:

seed run + reruns PASS with stable counts, convergence and

non-overwrite checks PASS, constraints validated, clean-state

typecheck/build PASS, lint/format PASS, tests 3/3, E2E 1/1,

health PASS.



Production code changed:



None (seed script, config and docs only).



\---



\## TASK-01.08 — Data Access / Prisma Integration



Date: 2026-10-20



Status:

COMPLETED (awaiting human acceptance)



Changes:



\- src/db/prisma.ts: DbClient type for repositories

\- src/repositories/: business-settings, location,

  service-catalog, product-catalog read repositories

\- src/repositories/repositories.db.test.ts: read-only DB

  integration tests (guarded to local maba\_printing\_dev)

\- package.json scripts: test:db (api, root); api test excludes

  \*.db.test.ts

\- README: test:db row in the commands table



Dependencies introduced:

None.



Verification:

test:db 10/10, constant query counts (no N+1), seed baseline

unchanged, clean-state typecheck/build PASS, lint/format PASS,

tests 3/3, E2E 1/1, health PASS. No schema change or migration.



Production code changed:



Backend data-access modules only; no routes or services.



\---



\## TASK-01.09 — Database Testing \& Developer Workflow



Date: 2026-10-20



Status:

COMPLETED (awaiting human acceptance)



Changes:



\- Test database maba\_printing\_test (same Docker server);

  TEST\_DATABASE\_URL in apps/api/.env.example and root

  .env.example

\- apps/api/scripts/test-database.ts (guard) and

  scripts/test-database.test.ts (guard unit tests)

\- apps/api/scripts/test-db.ts: prepare / rebuild (test DB only)

\- repositories.db.test.ts: test database, own fixtures, per-test

  rollback

\- Scripts: db:test:prepare, db:test:rebuild, test:db (api, root);

  apps/api/tsconfig.json includes scripts

\- .gitattributes: migration SQL eol=lf (KI-009 resolved)

\- README: development and test database workflows



Dependencies introduced:

None.



Verification:

test DB rebuilt from empty (5 migrations, no drift, schema

identical to dev), test:db 11/11 twice, normal tests 7/7, E2E 1/1,

clean-state typecheck/build PASS, lint/format PASS, health PASS,

development database unchanged.



Production code changed:



None (test tooling, configuration and docs only).



\---



\## TASK-01.10 — Phase 01 Final Verification



Date: 2026-10-20



Status:

VERIFICATION PASS (awaiting human acceptance)



Changes:



None to code, schema, migrations or databases (verification only;

test database rebuilt; one normal dev seed rerun). Project memory

updated with the result.



Findings:

F-1 MEDIUM Phase 01 work uncommitted; F-2 LOW README status stale;

F-3 LOW KI-010 not reproducible; INFO items in the report.



Production code changed:



None.



\---



\## PHASE 01 — Human Acceptance \& Closure



Date: 2026-10-20



Status:

ACCEPTED / COMPLETE (human-approved)



Changes:



\- README Development Status: Phase 00 COMPLETE, Phase 01

  COMPLETE / ACCEPTED; persistence foundation described; no

  product features claimed; API env note updated

\- KNOWN\_ISSUES.md: KI-010 MONITORING / NOT\_REPRODUCED (history

  kept)

\- PROJECT\_STATE.md / CURRENT\_TASK.md: Phase 01 accepted;

  awaiting Phase 02 planning



Open:

F-1 Phase 01 work not yet committed to Git (owner action).



Production code changed:



None.



\---



\## TASK-02.01 — Frontend App Shell, Routing \& Tailwind

Date: 2026-10-20

Status:
COMPLETED

Changes:
\- react-router 8.4.0, tailwindcss + @tailwindcss/vite 4.3.3 (web)
\- Public shell (header, accessible mobile nav, footer, logo), routes for
  the six public pages and NotFound
\- Routing/navigation tests; E2E smoke updated

Verification:
typecheck, build, lint, format, npm test (19), E2E 1/1 PASS.



\---



\## TASK-02.02 — Public API Contract Foundation

Date: 2026-10-20

Status:
COMPLETED

Changes:
\- packages/shared public DTO contracts + opening-hours normalizer
\- apps/api: zod 4.6.5; errors, error handler, JSON 404, CORS allowlist
  (FRONTEND\_URL), query validation, DTO mappers, response helpers,
  injectable createApp
\- Repositories extended with category description, availability ids,
  locationId and availability filters
\- KNOWN\_ISSUES: KI-012 (pagination deferred)

Verification:
typecheck, build, lint, format, npm test (57), test:db 11/11 PASS.



\---



\## TASK-02.03 — Public Settings Vertical Slice

Date: 2026-10-20

Status:
COMPLETED

Changes:
\- GET /api/v1/public/settings (route, controller, service, repository)
\- @tanstack/react-query 5.104.1; QueryClient, fetch API client,
  settings query, shell/footer from database settings
\- Vite /api dev proxy; shared DB test helper; API/DB/web tests

Verification:
typecheck, build, lint, format, npm test (80), test:db 16/16, E2E 1/1,
live API + proxy check PASS.



\---



\## TASK-02.04 — Locations Vertical Slice

Date: 2026-10-20

Status:
COMPLETED

Changes:
\- GET /api/v1/locations (active only, normalized opening hours)
\- /locations page with opening-hours renderer and shared
  loading/empty/error(retry) state components

Verification:
typecheck, build, lint, format, npm test, test:db 19/19 PASS.



\---



\## TASK-02.05 — Services Catalog Vertical Slice

Date: 2026-10-20

Status:
COMPLETED

Changes:
\- GET /api/v1/services with categoryId / locationId filters
\- Central price formatter; service catalog with category grouping,
  location filter, availability by location name
\- /printing, /laptop-service, /software-installation pages
\- KNOWN\_ISSUES: KI-013 (category matching by name)

Verification:
typecheck, build, lint, format, npm test, test:db 25/25 PASS.



\---



\## TASK-02.06 — Products / ATK Catalog Vertical Slice

Date: 2026-10-20

Status:
COMPLETED

Changes:
\- GET /api/v1/products with categoryId / availability filters
\- /atk catalog: category filter, availability badges, safe images with
  placeholder

Verification:
typecheck, build, lint, format, npm test (121), test:db 30/30, live
endpoint + responsive screenshot check PASS.



\---



\## TASK-02.07 — Homepage Composition \& Navigation

Date: 2026-10-20

Status:
COMPLETED

Changes:
\- Homepage sections (hero, business lines, steps, location preview,
  business info, CTA) driven by settings/locations APIs

Verification:
typecheck, build, lint, format, npm test (127) PASS; screenshots
reviewed.



\---



\## TASK-02.08 — Public UX States, Accessibility \& SEO

Date: 2026-10-20

Status:
COMPLETED

Changes:
\- Per-route titles/descriptions (PageMeta), index.html defaults
\- Focus management on navigation, stable mobile-menu label, heading
  structure checks; Indonesian error copy per error kind
\- Responsive/keyboard/404 Playwright tests

Verification:
typecheck, build, lint, format, npm test (150), E2E 6/6 PASS.



\---



\## TASK-02.09 — Public Read Integration \& E2E

Date: 2026-10-20

Status:
COMPLETED

Changes:
\- Full-stack Playwright E2E against maba\_printing\_test (E2E API server,
  deterministic fixtures, teardown, leftover cleanup in prepare)
\- Public journey, service-line, CORS/contract, responsive specs
\- apps/api dev script -> node --watch + tsx loader (KI-014)
\- README and env examples

Verification:
clean typecheck/build/lint/format PASS; npm test 150, test:db 30,
Playwright 9 PASS; dev DB unchanged.



\---



\## TASK-02.10 — Phase 02 Final Verification

Date: 2026-10-20

Status:
VERIFICATION PASS (awaiting human acceptance)

Changes:
None to code, schema or databases (verification only). Project memory,
PHASE\_02.md status and README status line updated with the result.

Findings:
LOW KI-012, KI-013, security middleware/logging deferred, Phase-02 work
uncommitted; INFO items in the report.

Production code changed:

None.



\---



\## PHASE 02 — Human Acceptance \& Closure

Date: 2026-10-20

Status:
ACCEPTED / COMPLETE (human-approved)

Changes:
\- PROJECT\_STATE.md / CURRENT\_TASK.md: Phase 02 accepted; awaiting
  Phase 03 planning
\- PHASE\_02.md status and README Development Status updated
\- Findings preserved: KI-012, KI-013 (LOW, deferred), KI-014
  (mitigated), security hardening (LOW, deferred)

Production code changed:

None.



\---



\## PHASE 03 — Authentication \& Identity (TASK-03.01..03.09)

Date: 2026-10-21

Status:
IMPLEMENTED (autonomous run; TASK-03.10 verification follows)

Changes:
\- docs/ai/PHASE\_03.md and TASK\_03.01..03.10.md created
\- Migration 20261020171603\_auth\_sessions (user\_sessions + expire index),
  UserSession model; applied to dev (no reset), test DB rebuilt
\- API: express-session + connect-pg-simple sessions, CSRF tokens,
  credentialed CORS, register / login / google / logout / me / csrf,
  account profile GET/PATCH (MEMBER), principal middleware (role and
  active state from DB), Argon2id (@node-rs/argon2), Google ID-token
  verification (google-auth-library), helmet, auth rate limits,
  X-Request-ID, 413 handling, safe error logs
\- Config: SESSION\_SECRET (>= 32, required) and DATABASE\_URL required at
  startup; TRUST\_PROXY; GOOGLE\_CLIENT\_ID; local dev secret written to
  the git-ignored apps/api/.env only
\- Shared: auth paths, CSRF header, roles, limits, auth/profile DTOs
\- Web: /login, /signup, /account, member guard, safe redirect, header
  account links, GIS button (when configured), credentialed API client
  with in-memory CSRF token
\- Tests: API unit 70, DB 127, web 166, shared 13, Playwright 13
\- Known issues: KI-008 resolved; KI-015, KI-016, KI-017 added

Production code changed:

Yes (Phase 03 scope only).



\---



\## PHASE 03 / TASK-03.10 — Phase 03 Final Verification

Date: 2026-10-21

Status:
VERIFICATION PASS (awaiting human acceptance)

Changes:
None to code, schema or databases (verification only; the test
database was rebuilt from migrations and left empty). Project memory,
PHASE\_03.md, TASK\_03.10.md result and README status updated.

Findings:
LOW KI-012, KI-013, KI-015, KI-016, KI-017 (accepted), Phase-03 work
uncommitted; INFO items in TASK\_03.10.md.

Production code changed:

None.



\---



\## PHASE 03 — Human Acceptance \& Closure

Date: 2026-10-21

Status:
ACCEPTED / COMPLETE (human-approved)

Changes:
\- PROJECT\_STATE.md / CURRENT\_TASK.md: Phase 03 accepted; awaiting
  Phase 04 planning
\- PHASE\_03.md status and README Development Status updated
\- Findings preserved: KI-012, KI-013 (LOW, deferred), KI-014
  (mitigated), KI-015, KI-016 (LOW, deployment), KI-017 (accepted
  conservative Google linking decision)

Production code changed:

None.



\---



\## PHASE 04 — Order Submission, Private Files \& Tracking (TASK-04.01..04.09)

Date: 2026-10-21

Status:
IMPLEMENTED (autonomous run; TASK-04.10 verification follows)

Changes:
\- docs/ai/PHASE\_04.md and TASK\_04.01..04.10.md created
\- No migrations (Phase-01 schema used as is)
\- Dependencies: multer 2.4.0, @types/multer 2.3.0, file-type 22.1.1
  (API); react-hook-form 7.89.0 (web)
\- Shared: order contracts, PRD status labels, Public Order ID parser,
  limits, paginated envelope
\- API: POST /orders (JSON or multipart; guest/member; CSRF; rate limit;
  single transaction with initial history; collision retry), private
  file validation by content + StorageService local adapter with
  compensation, GET /orders/track/:publicId, GET /account/orders and
  /account/orders/:publicId; STORAGE\_PROVIDER / UPLOAD\_\* configuration;
  .gitignore /apps/api/.local-storage/
\- Web: order forms on the four service pages, receipt + WhatsApp link,
  /track-order, /account/orders, /account/orders/:publicId, nav "Lacak
  Pesanan"; NextStepNotice removed
\- Tests: API unit 152, DB 193, web 200, shared 14, Playwright 21
\- Known issues: KI-015 extended; KI-018, KI-019, KI-020 added

Production code changed:

Yes (Phase 04 scope only).



\---



\## PHASE 04 / TASK-04.10 — Phase 04 Final Verification

Date: 2026-10-21

Status:
VERIFICATION PASS (awaiting human acceptance)

Changes:
None to code, schema, storage or the development database (verification
only; the test database was rebuilt from migrations and left empty).
Project memory, PHASE\_04.md, TASK\_04.10.md result recorded; the
Playwright count in PROJECT\_STATE corrected from 21 to 17.

Findings:
LOW KI-012, KI-013, KI-015, KI-018, KI-019, KI-020, Phase-04 work
uncommitted, memory count correction; INFO items in TASK\_04.10.md.

Production code changed:

None.



\---



\## PHASE 04 — Human Acceptance \& Closure

Date: 2026-10-21

Status:
ACCEPTED / COMPLETE (human-approved)

Changes:
\- PROJECT\_STATE.md / CURRENT\_TASK.md: Phase 04 accepted; awaiting
  Phase 05 planning
\- PHASE\_04.md status, TASK\_04.10.md acceptance and README Development
  Status updated
\- Findings preserved: KI-015, KI-018, KI-019, KI-020 and older issues

Production code changed:

None.



\---



\## PHASE 05 — Admin Operations \& Order Management (TASK-05.01..05.09)

Date: 2026-10-21

Status:
IMPLEMENTED (autonomous run; TASK-05.10 verification follows)

Changes:
\- docs/ai/PHASE\_05.md and TASK\_05.01..05.10.md created
\- No migrations, no new dependencies
\- Shared admin-api.ts (transitions, payment enums/labels, pickup fee,
  limits, Admin DTOs)
\- API /api/v1/admin/\* (ADMIN only, CSRF, generous rate limits):
  dashboard, order queue/detail, status machine with optimistic
  concurrency, pricing (pickup fee), notes, payment confirmation, file
  download, catalog/location/settings management; AdminAuditLog for every
  sensitive mutation in the same transaction; retention cleanup service
\- Operator commands: npm run admin:create, npm run files:cleanup
\- Web: /admin/login, Admin shell and guard, dashboard, orders, order
  detail, products, services, locations, settings; header Admin link
\- CORS preflight allows PUT
\- Tests: API unit 152, DB 308, web 229, shared 16, Playwright 21
\- Known issues: KI-018 mitigated, KI-015 extended, KI-021 added

Production code changed:

Yes (Phase 05 scope only).



\---



\## PHASE 05 / TASK-05.10 — Phase 05 Final Verification

Date: 2026-10-21

Status:
VERIFICATION PASS (awaiting human acceptance)

Changes:
None to code, schema, storage or the development database (verification
only; the test database was rebuilt from migrations and left empty).
Project memory, PHASE\_05.md and TASK\_05.10.md result recorded.

Findings:
LOW KI-012, KI-013, KI-015, KI-016, KI-019, KI-020, KI-021, KI-018
mitigated, Phase-05 work uncommitted; INFO items in TASK\_05.10.md.

Production code changed:

None.



\---



\## PHASE 05 — Human Acceptance \& Closure

Date: 2026-10-22

Status:
ACCEPTED / COMPLETE (human-approved)

Changes:
\- PROJECT\_STATE.md / CURRENT\_TASK.md: Phase 05 accepted; awaiting
  remaining-project planning
\- PHASE\_05.md status and decision record, TASK\_05.10.md acceptance and
  README Development Status updated
\- Human-approved business rule recorded: laptop pickup fee Rp0 up to
  5 km, else ceil(distanceKm - 5) x Rp2,000 (each started extra km in
  full; Admin-recorded distance; no Maps API)
\- Findings preserved: KI-018 mitigated, KI-021, KI-015, KI-016, KI-019,
  KI-020, KI-012, KI-013 and older issues

Production code changed:

None.



\---



\## PHASE 06 — Remaining MVP Experience \& Customer Payment UX (TASK-06.01..06.09)

Date: 2026-10-22

Status:
IMPLEMENTED (final autonomous run; TASK-06.10 verification follows)

Changes:
\- docs/ai/PHASE\_06.md and TASK\_06.01..06.10.md created
\- Shared safeImageRef, service-lines mapping, catalog page contract,
  idempotency constants, CustomerPaymentDto
\- API: QRIS published as a browser-safe reference; member payment state;
  Idempotency-Key on POST /orders (additive migration
  20261022011511\_order\_submission\_keys); paginated /products and
  /services; CORS allows Idempotency-Key
\- Web: PaymentInfo (receipt, tracking, member detail); idempotent
  resubmission; paged catalog reads; Admin category line mapping;
  session-expiry re-check; specific load errors; noindex + robots.txt
\- Tests: unit, DB (+ idempotency suite) and Playwright (+3 MVP journeys)
\- Known issues: KI-012, KI-020, KI-021 resolved; KI-013 mitigated

Production code changed:

Yes (Phase 06 scope only).



\---



\## PHASE 06 / TASK-06.10 — Phase 06 Independent Verification

Date: 2026-10-22

Status:
VERIFICATION PASS (autonomously completed / verified; checkpoint commit
follows)

Changes:
None to code, schema or data (verification only; test DB rebuilt and left
empty). TASK\_06.10.md result, PHASE\_06.md status and Project Memory
recorded.

Findings:
F-1 LOW flaky pre-existing Admin E2E toggle step; F-2 LOW bundle size;
F-3 LOW idempotency key per page load; F-4 LOW KI-013 human decision.

Production code changed:

None.



\---



\## PHASE 06 — Autonomous Checkpoint Commit

Date: 2026-10-22

Status:
AUTONOMOUSLY COMPLETED / VERIFIED

Changes:
\- Checkpoint commit 8a46464 "feat: complete Phase 06 customer experience"
  (after TASK-06.10 PASS); tree clean afterwards
\- Phase 07 planned: docs/ai/PHASE\_07.md, TASK\_07.01..07.10.md

Production code changed:

None (this entry).



\---



\## PHASE 07 — Security, Reliability \& Production Hardening (TASK-07.01..07.09)

Date: 2026-10-22

Status:
IMPLEMENTED (final autonomous run; TASK-07.10 verification follows)

Changes:
\- docs/ai/PHASE\_07.md and TASK\_07.01..07.10.md; docs/SECURITY.md,
  docs/OPERATIONS.md, docs/BACKUP\_RESTORE.md, docs/DEPLOYMENT.md (started)
\- Migration 20261022015824\_rate\_limit\_counters (additive) and
  PostgreSQL rate-limit store (RATE\_LIMIT\_STORE)
\- Website security-header policy + vite preview + production-build E2E
\- Storage factory and contract suite; malware-scanning boundary
  (UPLOAD\_SCANNER none|clamav); retention CLI in src/cli with advisory lock
\- Structured JSON logging (LOG\_LEVEL), request log, readiness endpoint
\- check:migrations manifest; Admin chunk code splitting; E2E flake fix
\- Known issues: KI-015 resolved, KI-016 mitigated, KI-018/KI-019 updated,
  KI-022 added

Production code changed:

Yes (Phase 07 scope only).



\---



\## PHASE 07 / TASK-07.10 — Phase 07 Independent Verification

Date: 2026-10-22

Status:
VERIFICATION PASS (autonomously completed / verified; checkpoint commit
follows)

Changes:
None to code, schema or data (verification only; test DB rebuilt and left
empty). TASK\_07.10.md result, PHASE\_07.md status and Project Memory
recorded.

Findings:
F-1 LOW package.json description encoding; F-2 LOW admin-create CLI not
built yet; KI-022 MEDIUM scheduled for Phase 08.

Production code changed:

None.



\---



\## PHASE 07 — Autonomous Checkpoint Commit

Date: 2026-10-22

Status:
AUTONOMOUSLY COMPLETED / VERIFIED

Changes:
\- Checkpoint commit 54ed7d8 "chore: complete Phase 07 production
  hardening" (after TASK-07.10 PASS); tree clean afterwards
\- Phase 08 planned: docs/ai/PHASE\_08.md, TASK\_08.01..08.10.md

Production code changed:

None (this entry).



\---



\## PHASE 08 — Production Infrastructure \& Deployment Readiness (TASK-08.01..08.09)

Date: 2026-10-22

Status:
IMPLEMENTED (final autonomous run; TASK-08.10 verification follows)

Changes:
\- docs/ai/PHASE\_08.md, TASK\_08.01..08.10.md; docs/DEPLOYMENT.md (full),
  docs/RELEASE\_CHECKLIST.md
\- SESSION\_COOKIE\_SAMESITE, production config warnings, website build
  check for https API URLs
\- Built operator CLIs (admin-create, files-cleanup), db:migrate:deploy and
  start:\* scripts
\- apps/api/Dockerfile (runtime + migrate), .dockerignore, runtime
  dependency pruning
\- .github/workflows/ci.yml; npm run verify / verify:e2e; npm run smoke
\- Env examples aligned; KI-022 resolved; KI-001 decision package

Production code changed:

Yes (Phase 08 scope only).



\---



\## PHASE 08 / TASK-08.10 — Phase 08 Independent Verification

Date: 2026-10-22

Status:
VERIFICATION PASS (autonomously completed / verified; checkpoint commit
follows)

Changes:
None to code, schema or data (verification only). TASK\_08.10.md result,
PHASE\_08.md status and Project Memory recorded.

Findings:
LOW CI not yet executed on GitHub; INFO items in TASK\_08.10.md.

Production code changed:

None.



\---



\## PHASE 08 — Autonomous Checkpoint Commit

Date: 2026-10-22

Status:
AUTONOMOUSLY COMPLETED / VERIFIED

Changes:
\- Checkpoint commit 308625f "chore: complete Phase 08 deployment
  readiness" (after TASK-08.10 PASS); tree clean afterwards
\- Phase 09 planned: docs/ai/PHASE\_09.md, TASK\_09.01..09.10.md

Production code changed:

None (this entry).



\---



\## PHASE 09 — Release Candidate (TASK-09.01..09.09)

Date: 2026-10-22

Status:
IMPLEMENTED (release-candidate freeze; TASK-09.10 final audit follows)

Changes:
\- docs/ai/PHASE\_09.md, TASK\_09.01..09.10.md
\- Removed the stray tracked file "git diff"
\- e2e/rc-regression.spec.ts (accessibility/responsive regression)
\- E2E API order limits raised for the shared localhost client
\- README rewritten; RELEASE\_CHECKLIST counts; KNOWN\_ISSUES release triage

Production code changed:

No (tests, test infrastructure and documentation only).
