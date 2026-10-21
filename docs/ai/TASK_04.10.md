# TASK-04.10 — Phase 04 Final Verification

Phase: 04 — Order Submission, Private Files & Tracking

## Objective

Independently verify the actual repository, database and storage state of
Phase 04 and return exactly one verdict: PASS, FAIL or BLOCKED.

## Source Requirements

All Phase-04 requirements; PHASE_04.md.

## Scope

Inspect and re-run only. No repairs, refactors, dependency or behavior
changes. The AI does not mark Phase 04 human-accepted.

## Business Rules

Verdict PASS only if every check passes (LOW findings may be deferred).

## Security Requirements

Review privacy of DTOs, file handling, storage scope, logs and bundle.

## Exclusions

Fixes of any kind.

## Testing

1. Git: only Phase-04 paths on top of 8968244; no tracked secrets or
   storage files; migrations unchanged (zero new).
2. Migration status dev/test, test DB rebuild, no drift.
3. format, lint, typecheck, build.
4. Unit, DB and Playwright suites.
5. Live API on the test DB: order submission for all four types (incl.
   files), tracking, member history/detail, error statuses, headers.
6. Security review (DTO allow-lists, storage keys, upload validation,
   logs, bundle).
7. Dev DB fingerprint and development storage unchanged; test DB and test
   storage empty afterwards.
8. Documentation consistency.

## Verification

Record evidence and verdict in this file and Project Memory.

## Project Memory

Status "verification PASS/FAIL — awaiting human acceptance".

## Stop Conditions

STOP after the verdict. Do not begin Phase 05.

---

## Result (2026-10-21)

Verdict: **PASS** — human-accepted 2026-10-21. No fixes were made to the
product during this task. Only the verification script (session
scratchpad) was adjusted: it ran into the default submission rate limit
(10 per 15 minutes per IP), so the live checks were split into two batches
against fresh API processes and the 11th submission was asserted to be 429.

| # | Check | Result |
|---|-------|--------|
| 1 | Git: HEAD 8968244; 38 modified, 63 new, 1 deleted (NextStepNotice) — all Phase-04 scope; only `.env.example` tracked; no storage files tracked; protected docs unchanged | PASS |
| 2 | Zero new migrations; 6 migrations sha256-identical; dev `migrate status` up to date, no drift; test DB dropped + rebuilt from migrations, no drift | PASS |
| 3 | format:check, lint, typecheck, build, prisma validate | PASS |
| 4 | npm test 366 (api 152, web 200, shared 14); test:db 193; Playwright 17 | PASS |
| 5 | Live API on maba_printing_test: 32/32 (all four types incl. multipart PDF, 415 disguised HTML, files on ATK 400, 409 unavailable product / inactive location, privileged fields 400, past deadline 400, CSRF 403, submission 429, tracking safe DTO / 404 / 400 / no session, member history + detail + ownership 404 + 401) | PASS |
| 6 | Security review: no any/ts-ignore/TODO; no Prisma in controllers; storage keys only in repository/service; no download route or static serving; logs carry keys/categories only; no web-storage use; bundle free of secrets (`storageKey` hits are React Router ScrollRestoration); exact .gitignore rule | PASS |
| 7 | Dev DB fingerprint (md5 c36a1131…, counts 1/2/7/5/1/0/0, migrations 6) identical to the Phase-04 baseline; development storage empty; test DB, test and E2E storage empty afterwards | PASS |
| 8 | README, env examples, Project Memory consistent (one count corrected, see findings) | PASS |

Findings (non-blocking):

- LOW (documentation): the TASK-04.09 Project Memory entry stated
  "Playwright 21"; the actual suite is 17 (13 from Phase 03 + 4 order
  journeys). Corrected in PROJECT_STATE with this verdict.
- LOW KI-015 (in-process rate limits, now incl. orders), KI-018 (retention
  job deferred), KI-019 (production storage, no malware scanning), KI-020
  (no idempotency key); KI-012, KI-013 carried; Phase-04 work uncommitted.
- INFO: the request path (which may contain a Public Order ID) appears in
  server-side logs of unexpected 500 errors only.
- INFO: invalid submissions count toward the submission rate limit (by
  design: the limiter runs before validation).
- INFO: printing requests may have no files when a description is given
  (PRD §8 "optional files").
