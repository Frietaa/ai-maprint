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

