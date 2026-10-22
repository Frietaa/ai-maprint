\# MABA PRINTING — Known Issues



\## Open Issues



\### KI-002 — Parent Home-Directory Git Repository



ID: KI-002

Title: A Git repository exists at the user home directory and

encloses the project

Severity: Medium

Status: MITIGATED (2026-10-20, TASK-00.02 inspection: a

project-local repository now exists, so Git commands inside the

project resolve to maba-printing/.git; the home-directory

repository itself still exists)

Discovered In: TASK-00.01 context inspection

Description: C:\\Users\\Fathir\\.git exists (branch master,

0 commits, no remote). Because maba-printing/ has no Git

repository of its own, Git commands run inside the project

resolve to this home-directory repository, which reports the

entire user home (personal files, NTUSER.DAT, AppData) as

untracked.

Impact: Any git add/commit run from the project before a

project-local repository exists would target the home-directory

repository and could capture personal files.

Recommended Action: Do not run git add/commit in the project

until a project-local repository exists (see KI-004). Whether to

keep or remove the home-directory repository is the owner's

decision, outside project scope.



(Revised during TASK-00.01 recovery: originally described the

absence of a project repository as the issue; that absence is a

deliberate deferral, now tracked as KI-004.)



\### KI-003 — Escaped Markdown in docs/ai Files



ID: KI-003

Title: AI-memory documents contain literal backslash escapes

Severity: Low

Status: OPEN

Discovered In: TASK-00.01 context inspection

Description: docs/ai/\*.md contain literal escapes (\\#, \\\_,

\\---), so headings and lists do not render as Markdown.

Impact: Readability only; content is intact.

Recommended Action: Remove escapes in a separate approved

documentation cleanup.



\### KI-005 — .gitignore Output Rules Match at Any Depth



ID: KI-005

Title: build/, dist/ and logs/ rules match directories at any depth

Severity: Low

Status: OPEN (non-blocking)

Discovered In: TASK-00.01 re-verification (finding R-1)

Description: Unanchored rules ignore same-named directories

anywhere, e.g. apps/web/src/build/config.ts,

apps/web/src/dist/x.ts, apps/api/src/logs/logger.ts.

Impact: A future source directory named build, dist or logs

would be silently excluded from version control. No such

directory exists in the approved structure.

Recommended Action: When a future tooling task (e.g. TASK-00.02,

00.03 or 00.06) establishes actual build/log output paths,

consider anchoring these rules to those paths, or avoid naming

source directories build, dist or logs.

Note (TASK-00.06): eslint.config.mjs ignores (\*\*/dist/,

\*\*/build/, ...) and .prettierignore (dist/, build/, ...) use the

same any-depth matching, so such a source directory would also

be skipped by lint and format checks.



\### KI-006 — Shared Package Build Order



ID: KI-006

Title: Root scripts build/typecheck @maba-printing/shared last

Severity: Low

Status: RESOLVED (TASK-00.09, 2026-10-20)

Why resolved: packages/shared now has conditional exports

(types -> dist d.ts, development -> src/index.ts, default ->

dist). Dev and test runtimes (Vite dev server, Vitest, api

`tsx watch --conditions=development`) load shared from source,

so they never need dist/. Production paths (`npm run build`,

then node/vite output) use dist/, and the root build runs

shared -> api -> web explicitly (tsc -b references also build

shared first).

Clean-state evidence: after `npm run clean` (no dist/), with

temporary real imports of shared in api and web: root dev served

api health 200 and web served shared's source module 200 with

dist/ still absent; root test, typecheck, build and start:api

all passed. Before the change, the same import failed with

ERR\_MODULE\_NOT\_FOUND.



Previous status: PARTIALLY\_RESOLVED (TASK-00.05, 2026-10-20)

TypeScript part resolved: apps/api and apps/web reference

packages/shared via project references, so tsc -b builds shared

first regardless of root workspace order (verified from a clean

state with a temporary consumer probe).

Remaining (owned by TASK-00.09): runtime/dev runners (node

dist/server.js, tsx, Vite dev server) resolve shared's built

dist/, which does not exist on a clean checkout until shared is

built.

Discovered In: TASK-00.04 verification

Description: Consumers resolve @maba-printing/shared through its

built dist/ ("exports": "./dist/index.js"). Root

`npm run build --workspaces` runs in workspace order: api, web,

then shared.

Impact: None today (nothing imports shared). Once web or api

imports shared, a clean checkout's root typecheck/build would

fail until shared is built first.

Recommended Action: Address in TASK-00.05 (TypeScript

configuration) or TASK-00.09 (unified scripts), e.g. build

shared first or use TypeScript project references.



\### KI-007 — No Local PostgreSQL Instance



ID: KI-007

Title: PostgreSQL is not available on the development machine

Severity: Medium

Status: RESOLVED (2026-10-20, TASK-01.01 closure prerequisite,

human-approved Docker use). Local development PostgreSQL 17

(official postgres:17 image, server 17.11) runs via

compose.dev.yml on 127.0.0.1:5432 with the named volume

maba-printing\_postgres-data. Prisma connected using

apps/api/.env (db execute SELECT 1, app getPrisma() query).

Ongoing dependency: a new machine needs Docker running, an

apps/api/.env with DATABASE\_URL, and `npm run db:start`.

No OS-level PostgreSQL is installed.

Previous status: OPEN (blocked database-dependent verification)

Discovered In: TASK-01.01

Description: No psql/postgres binaries on PATH, no postgres\*

Windows service, and nothing listening on port 5432. Docker

Desktop is installed but was not used (requires approval).

Impact: Prisma validate/generate and all Phase-00 checks work,

but migrations (TASK-01.02 onwards), connectivity checks and

database tests cannot run until a PostgreSQL instance and a

local apps/api/.env DATABASE\_URL exist.

Recommended Action: Owner decides between a native PostgreSQL

install or an approved Docker-based PostgreSQL for development,

then sets DATABASE\_URL in apps/api/.env (never committed).



\### KI-008 — Case-Sensitive Email Uniqueness



ID: KI-008

Title: users.email unique index is case-sensitive

Severity: Low

Status: RESOLVED (database: TASK-01.06, 2026-10-20; application:

TASK-03.02, 2026-10-21). Unique expression index users\_email\_lower\_key on

lower(email) rejects case-only duplicates; registration, login and Google

Sign-In normalize emails with one helper (normalizeEmail: trim +

lowercase). A violation of the index maps to 409 (DB test).

Previous status: OPEN (non-blocking)

Discovered In: TASK-01.02 database verification

Description: The users\_email\_key unique index compares email

text exactly, so "A@example.test" and "a@example.test" can both

be stored (confirmed with a rolled-back probe).

Impact: Without normalization, one person could end up with two

accounts that differ only by letter case.

Recommended Action: The authentication task must normalize

emails (e.g. trim + lowercase) before lookup and storage;

TASK-01.06 may additionally add a case-insensitive unique index

(e.g. on lower(email)) if approved.



\### KI-009 — Migration File Line Endings vs Prisma Checksums



ID: KI-009

Title: migration.sql line endings may change on Windows checkout

Severity: Low

Status: RESOLVED (TASK-01.09, 2026-10-20)

Evidence: (1) Against the disposable maba\_printing\_test database,

Prisma 7.10.1 `migrate status` / `migrate dev` accepted CRLF copies

of all applied migrations without a modification warning, while a

control copy with a real content change was reported as "modified

after it was applied", so the checksum check ignores CRLF-only

differences. (2) In a scratch Git repository with

core.autocrlf=true, a Windows checkout turned an LF migration into

CRLF without .gitattributes, and kept it LF with the rule; a CRLF

file added under the rule was normalized to LF. The working-tree

migration files are LF and byte-identical to the applied

checksums (sha256 matches \_prisma\_migrations).

Mitigation added: .gitattributes rule

apps/api/prisma/migrations/\*\*/\*.sql text eol=lf (migration SQL

only). Applied migration files were not rewritten.

Previous status: OPEN (to verify; non-blocking now)

Discovered In: TASK-01.02

Description: Prisma generated migration.sql with LF endings; this

repository runs with core.autocrlf=true, so a later checkout may

produce CRLF. Prisma records a checksum per applied migration;

whether that checksum is line-ending independent was not

verified.

Impact: If not independent, `prisma migrate dev` on another

checkout could report the applied migration as modified.

Recommended Action: In TASK-01.09 (database developer workflow),

verify the behavior safely and, if needed, add a .gitattributes

rule such as `*.sql text eol=lf` for prisma/migrations. Never

resolve a checksum warning with a database reset.



\### KI-010 — pg Deprecation Warning from Prisma Adapter



ID: KI-010

Title: pg warns about concurrent client.query() calls

Severity: Low

Status: MONITORING — NOT\_REPRODUCED (2026-10-20, TASK-01.10

verification): the warning did not appear in the database tests or

in two targeted reproductions on maba\_printing\_test (nested

creates inside an interactive transaction, including an order with

items, laptop request, payment and status history; rolled back).

No dependency was changed. Recheck when real order-creation

transactions are implemented, and before any pg 9 / adapter

upgrade.

Previous status: OPEN (non-blocking; third-party)

Discovered In: TASK-01.04 Prisma Client probe

Description: A nested create inside a Prisma interactive

transaction printed: "Calling client.query() when the client is

already executing a query is deprecated and will be removed in

pg@9.0". It comes from @prisma/adapter-pg 7.10.1 with pg 8.23.1,

not from project code. The operation succeeded.

Impact: None on pg 8. The declared range pg ^8.23.1 will not

install pg 9 automatically.

Recommended Action: Before any upgrade to pg 9, confirm a

compatible @prisma/adapter-pg release; recheck after Prisma

adapter updates.



\### KI-011 — Business Configuration Source of Truth

ID: KI-011

Title: WhatsApp number and business name can be configured in two

places

Severity: Low

Status: DECIDED (TASK-01.06, 2026-10-20, task-directed):

business\_settings is authoritative for mutable runtime

operational values (businessName, whatsappNumber, logoRef,

qrisImageRef, socialLinks). Environment variables may serve only

as a later deployment/bootstrap fallback where a task explicitly

requires one; frontend static configuration (brand.ts) must not

hold competing mutable copies (static visual branding only). No

settings API implemented. Not yet recorded as an ADR in

DECISIONS.md (protected document; owner may add it).

Previous status: OPEN (decision needed before the WhatsApp/branding phases)

Discovered In: TASK-01.05

Description: PRD 22 makes the WhatsApp number, business name,

logo, QRIS image and social links owner-editable, so they now

exist in business\_settings. The Architecture also lists a

server env variable WHATSAPP\_NUMBER (43) and a frontend

brand config file apps/web/src/config/brand.ts (44).

Impact: Without a rule, the number/name shown to customers could

differ depending on which source a feature reads.

Recommended Action: Before implementing WhatsApp deep links and

branding, decide the precedence (e.g. business\_settings is

authoritative, env WHATSAPP\_NUMBER only a bootstrap fallback,

brand.ts for static visual branding only) and record it in

DECISIONS.md if approved.



\### KI-012 — Public Catalog Lists Are Not Paginated



ID: KI-012

Title: GET /locations, /services and /products return all public rows

Severity: Low

Status: RESOLVED (TASK-06.06, 2026-10-22): GET /products and GET /services

take page/pageSize (default and maximum 100) and return meta {count, page,

pageSize, total, totalPages} with deterministic ordering, so every

response and query is bounded. The website keeps the whole-catalog UX by

reading the pages in order (at most 20 requests). GET /locations stays

unpaginated by design (a handful of physical locations).

Previous status: OPEN (deferred by Phase-02 plan)

Discovered In: TASK-02.02

Description: Architecture §47 says growing collections MUST support

pagination. The Phase-02 brief explicitly defers pagination because the

current catalog is small; list responses carry meta.count only.

Impact: None at current catalog size; an ATK catalog of hundreds of rows

would produce large responses.

Recommended Action: Add page/limit (meta.page, limit, total, totalPages

per Architecture §14) when catalog management (admin) can grow the

catalog, before production launch.



\### KI-013 — Service Pages Match Categories by Name



ID: KI-013

Title: /printing, /laptop-service and /software-installation select

service categories by name keywords

Severity: Low

Status: MITIGATED (TASK-06.07, 2026-10-22): the keyword mapping is one

shared definition (packages/shared/src/service-lines.ts) and the Admin

services page shows, under each category, which public service page shows

it, or warns that it matches none. Remaining: a schema-level business-line

column is still the clean fix — a domain-model change that needs the

owner's approval.

Previous status: OPEN (accepted limitation of the current schema)

Discovered In: TASK-02.05

Description: service\_categories has no column tying a category to one of

the four business lines, and Phase 02 adds no schema migration. Pages

match category names against keywords (e.g. "print"/"cetak",

"laptop"/"komputer", "software"/"instal"/"aplikasi"). If no category

matches, the page shows the whole public service catalog with a note

instead of hiding it.

Impact: An admin-renamed category without any keyword (e.g. "Dokumen")

appears only through the full-catalog fallback.

Recommended Action: When catalog management is built (admin phase),

decide whether to add an explicit business-line field to

service\_categories (additive migration, needs approval) or document the

naming convention for the owner.



\### KI-014 — tsx watch Stalls When the Prisma Client Is Imported



ID: KI-014

Title: `tsx watch` with a piped stdin never finishes loading the

generated Prisma client

Severity: Low

Status: MITIGATED (TASK-02.09)

Discovered In: TASK-02.09 (npm run dev verification)

Description: Under `tsx watch` with stdin as a pipe (as `concurrently`

provides in root `npm run dev`), importing apps/api/src/generated/prisma

never completes; plain `tsx`, `node --watch --import tsx` and a TTY

stdin work. Phase 00/01 dev servers never imported the client, so it

surfaced only when the API began serving database data.

Impact: Before the fix, `npm run dev` started the web app but the API

never listened.

Recommended Action: apps/api `dev` uses

`node --watch --conditions=development --import tsx src/server.ts`

(reload on change verified). Recheck `tsx watch` after tsx/Prisma

upgrades; no dependency change made.



\### KI-015 — Auth Rate Limits Use an In-Process Store



ID: KI-015

Title: express-rate-limit memory store is per API instance

Severity: Low

Status: RESOLVED (TASK-07.02, 2026-10-22): RATE\_LIMIT\_STORE=postgres (the

production default) keeps every limiter's counters in the additive table

rate\_limit\_counters (migration 20261022015824\_rate\_limit\_counters), updated

by one atomic upsert on the database clock, so all API instances share the

budgets and restarts do not reset them (DB-tested with two app instances

and concurrent increments). `memory` remains for development/tests.

Remaining deployment duty: set TRUST\_PROXY to the real proxy hop count.

Previous status: OPEN (accepted for the single-instance MVP; deployment phase)

Discovered In: TASK-03.09

Description: Sign-in failure (20 / 15 min), registration (10 / 15 min),

order submission (10 / 15 min) and order tracking (60 / 15 min; Phase 04)

and Admin mutations (300 / 15 min) and downloads (200 / 15 min; Phase 05)

limits per client IP use the library's default in-memory store.

Counters reset on restart and are not shared between instances.

Impact: With several API instances the effective limit multiplies.

Behind a proxy, TRUST\_PROXY must be set or all clients share one IP.

Recommended Action: At deployment, if more than one instance runs, use a

shared store (PostgreSQL/Redis) and set TRUST\_PROXY to the hop count.



\### KI-016 — Website Hosting Security Headers Not Yet Configured



ID: KI-016

Title: CSP and other headers for the web app (not the API) are a

deployment concern

Severity: Low

Status: MITIGATED (TASK-07.03, 2026-10-22): the website header policy is

defined once in apps/web/hosting/security-headers.ts (CSP without inline

script, API origin and Google Identity Services only; frame-ancestors

'none'; COOP same-origin-allow-popups; nosniff; Referrer-Policy;

Permissions-Policy; HSTS over HTTPS; immutable hashed assets), applied by

`vite preview` and verified against the production build by

`npm run test:e2e:preview` (no CSP violations). Remaining: the chosen host

must send the same headers (docs/DEPLOYMENT.md table).

Previous status: OPEN (deployment phase)

Discovered In: TASK-03.09

Description: The API now sends helmet headers (CSP default-src 'none',

frame-ancestors 'none', X-Frame-Options DENY, nosniff, no-referrer,

CORP same-site, HSTS in production). The SPA itself is served by the

future frontend host, whose headers are not configured yet.

Impact: None locally. In production the website should send a CSP that

allows Google Identity Services (accounts.google.com script/frame) and a

COOP compatible with its popup (same-origin-allow-popups).

Recommended Action: Configure frontend hosting headers when the provider

is chosen (KI-001); keep VITE\_GOOGLE\_CLIENT\_ID origins registered in the

Google Cloud console.



\### KI-017 — No Account Linking Between Password and Google Sign-In



ID: KI-017

Title: A Google sign-in for an email that already has an account is

refused (409), not linked

Severity: Low

Status: ACCEPTED LIMITATION (conservative security decision,

TASK-03.06; confirmed with Phase 03 human acceptance 2026-10-21)

Discovered In: TASK-03.06

Description: Without email verification, ownership of a password

account's email is unproven; automatic linking on a verified Google

email would let whoever pre-registered that address keep access

(pre-account-takeover). Public Google Sign-In therefore links only by

existing googleId and never touches ADMIN accounts.

Impact: A member who registered with a password cannot also use Google

for the same email (they see "sudah terdaftar dengan cara masuk lain").

Registration (409) also reveals that an email is registered — inherent

to sign-up and rate-limited.

Recommended Action: Revisit together with email verification or an

authenticated "connect Google" action in a later phase.



\### KI-018 — Order File Retention Job Not Implemented



ID: KI-018

Title: Files of COMPLETED orders are not yet deleted after 30 days

Severity: Low

Status: MITIGATED (TASK-05.06, 2026-10-21; invocation contract TASK-07.06,

2026-10-22: `node dist/cli/files-cleanup.js` / `npm run files:cleanup`, one

JSON summary line, exit codes 0/1, PostgreSQL advisory lock against

overlapping runs, storage via the factory; schedule daily on the chosen

host, docs/OPERATIONS.md). Earlier: orders reach COMPLETED (sets

completedAt) through the Admin status machine, and the idempotent cleanup

(cleanupExpiredOrderFiles / `npm run files:cleanup`) deletes files at

completedAt + 30 days and records deletedAt. Remaining gap: no scheduler

runs it automatically (deployment-owned), and it supports the local

storage adapter only (KI-019).

Previous status: OPEN (deferred: needs the Admin order lifecycle)

Discovered In: TASK-04.03

Description: PRD §9 / ADR-013: files become eligible for deletion 30 days

after the order reaches COMPLETED (order\_files.deleted\_at records actual

removal). Phase 04 has no status workflow — every order stays SUBMITTED,

no completedAt is ever set — so a cleanup job would have nothing to do.

StorageService.delete exists; no fake schedule was created.

Impact: None yet (no order can complete).

Recommended Action: Implement an idempotent cleanup job with the Admin

order-status phase (set completedAt on COMPLETED) or deployment hardening.



\### KI-019 — Production File Storage Not Yet Available



ID: KI-019

Title: Only the local development storage adapter exists

Severity: Low

Status: OPEN — boundaries ready, provider pending (TASK-07.04/07.05,

2026-10-22). Storage: createStorageFromConfig is the single adapter choice

point, a reusable contract suite (src/test/storage-contract.ts) defines

the required behavior, and docs/DEPLOYMENT.md lists the private-store

requirements; the production guard for the local adapter stays until a

real private object store is implemented. Malware scanning: UPLOAD\_SCANNER

= clamav (self-hosted clamd, INSTREAM over TCP, infected -> 422, errors ->

503 fail-closed, readiness ping) or an explicit none; production refuses to

start without a value. Remaining owner decisions: object-storage provider

and whether to run clamd.

Previous status: OPEN (deployment phase; related to KI-001)

Discovered In: TASK-04.03

Description: StorageService has a local adapter (apps/api/.local-storage/,

git-ignored, never served). STORAGE\_PROVIDER accepts only "local" and the

API refuses to start with it when NODE\_ENV=production. Uploads are

validated by type, size and content signature but not scanned for

malware.

Impact: Production deployment needs an object-storage adapter first.

Recommended Action: Add a private object-storage adapter (and decide on

malware scanning) when the hosting provider is chosen.



\### KI-020 — No Idempotency Key for Order Submission



ID: KI-020

Title: A retried submission after a lost response creates a second order

Severity: Low

Status: RESOLVED (TASK-06.05, 2026-10-22): POST /orders accepts an

Idempotency-Key; the web client sends one per distinct submission and

reuses it when resending. A repeat by the same submitter returns the

original order (200, Idempotent-Replayed) without storing files again; a

different request or owner with the same key gets 409; concurrent

duplicates create exactly one order. Server-side record: additive table

order\_submission\_keys (hashes only, 24-hour window). Residual: reloading

the page between the attempts starts a new key.

Previous status: OPEN (accepted for MVP)

Discovered In: TASK-04.08

Description: The web form blocks double clicks while a request is pending,

but if the network fails after the server committed the order, the

customer may submit again and receive a second Public Order ID.

Impact: Possible duplicate SUBMITTED orders, resolved manually by the

business (WhatsApp / Admin).

Recommended Action: Consider a client-generated idempotency key when the

Admin order workflow exists.



\### KI-021 — QRIS Image Is Configuration Only



ID: KI-021

Title: The QRIS image reference is stored but not shown to customers

Severity: Low

Status: RESOLVED (TASK-06.02/06.03, 2026-10-22): public settings publish

the QRIS reference when it is browser-safe (https URL or website path; a

legacy storage key is published as null), and customers see it with

Cash/QRIS instructions and a manual-confirmation notice on the receipt,

the tracking page and the member order detail (with the member's payment

status). Still no upload for the image: the owner provides a hosted URL or

a website path (ADR-023).

Previous status: OPEN (accepted: no customer payment UI in scope yet)

Discovered In: TASK-05.08

Description: Admins can set BusinessSettings.qrisImageRef (https URL or

root-relative path) and confirm QRIS payments manually, but no customer

page displays the QRIS image and there is no upload for it. Older values

may be bare storage keys (e.g. the development seed); the settings form

leaves untouched values as they are.

Impact: Customers receive QRIS details through WhatsApp or at the counter.

Recommended Action: Add a customer payment view (and an image upload)

when the payment experience is planned.



\### KI-022 — Session Cookie SameSite Is Fixed to Lax



ID: KI-022

Title: The session cookie only works when website and API are same-site

Severity: Medium (deployment blocker for a cross-site topology)

Status: RESOLVED (TASK-08.02, 2026-10-22): SESSION\_COOKIE\_SAMESITE = lax

(default) | strict | none; "none" is accepted only with NODE\_ENV=production

and Secure cookies (the session manager refuses it otherwise); DB-tested

cookie attributes. docs/DEPLOYMENT.md recommends a same-site topology and

explains why cross-site cookies are unreliable.

Previous status: OPEN (to be addressed in Phase 08 deployment readiness)

Discovered In: TASK-07.01 threat-model review

Description: middleware/session.ts sets SameSite=Lax unconditionally. That

is correct for the preferred same-site topology (e.g. www.example.id and

api.example.id), but if the website and the API are deployed on different

sites (e.g. two provider subdomains), browsers do not send the cookie on

the website's API calls and sign-in silently fails.

Impact: A cross-site deployment would break member and Admin sessions.

Recommended Action: Make the cookie policy explicit configuration with a

safe default (Lax), allow None only together with Secure, document that

same-site deployment is strongly preferred (third-party cookie blocking).



\---



\## Deferred Technical Decisions



\### KI-001 — Production Hosting Provider



Status:

DEFERRED



Reason:



Free-tier availability, limits, pricing,

storage, and database policies may change.



Decision will be made near deployment.



Update (TASK-08.01, 2026-10-22): decision package ready in

docs/DEPLOYMENT.md section 2 (requirements, options, criteria for domain,

website host, API host, managed PostgreSQL, object storage, scanner,

scheduler, Google). Awaiting the owner's choice; the repository is

deployment-ready pending provider.



\### KI-004 — Project-Local Git Repository



Status:

RESOLVED (observed 2026-10-20 during TASK-00.02 inspection:

maba-printing/.git exists, initialized by the owner; no commits)



Original status:

DEFERRED



Reason:



Git initialization is not required by TASK-00.01 and was

explicitly deferred by the owner during TASK-00.01.



Architecture names Git as the version-control system; a

project-local repository should be initialized by a later

explicitly approved step before the first commit.



\---



\## Reporting Format



New issues must use:



ID:

Title:

Severity:

Status:

Discovered In:

Description:

Impact:

Recommended Action:

