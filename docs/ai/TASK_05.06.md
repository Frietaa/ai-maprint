# TASK-05.06 — Authorized Private File Access & Retention Foundation

Phase: 05 — Admin Operations & Order Management

## Objective
Admin-only document download and the 30-day retention cleanup.

## Source Requirements
PRD §9; Architecture §34, §37, §41; ADR-013/014; KI-018, KI-019.

## Implementation Scope
Download endpoint via StorageService streaming; `cleanupExpiredOrderFiles`
service + `npm run files:cleanup` CLI; web download buttons.

## Authorization / Security Rules
ADMIN only; file must belong to the order and not be deleted; attachment
disposition, stored MIME, nosniff, no-store; no storage key/path in any
response or log; audit ORDER_FILE_DOWNLOADED (file id, size); download rate
limit; production local-storage guard unchanged.

## Business Rules
Eligible = order COMPLETED and completedAt ≤ now − 30 days, deletedAt null.
deletedAt set only after deletion succeeds (missing object = deleted);
failures logged with counts/ids, retried next run.

## Exclusions
Scheduler, malware scanning, member downloads.

## Testing
Download headers/content, foreign file 404, deleted file 404, missing
object 404, MEMBER 403, audit; retention day 29/30/31, non-completed
skipped, deleted skipped, failure leaves deletedAt null, rerun idempotent.

## Verification
API suites green; test storage only.

## Project Memory
KI-018 → MITIGATED (scheduler remains deployment-owned).

## Stop Conditions
A needed schema migration, a guard failure, or a security regression.
