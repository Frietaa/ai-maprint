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

Status: RESOLVED at database level (TASK-01.06, 2026-10-20):

unique expression index users\_email\_lower\_key on lower(email)

rejects case-only duplicates (verified with a rolled-back probe).

Application normalization (trim + lowercase) is still required in

the authentication task; this index is defense in depth.

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

Status: OPEN (deferred by Phase-02 plan)

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

Status: OPEN (accepted limitation of the current schema)

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



\---



\## Deferred Technical Decisions



\### KI-001 — Production Hosting Provider



Status:

DEFERRED



Reason:



Free-tier availability, limits, pricing,

storage, and database policies may change.



Decision will be made near deployment.



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

