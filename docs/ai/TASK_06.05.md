# TASK-06.05 — Order Idempotency / Duplicate-Submission Protection

Phase: 06 — Remaining MVP Experience & Customer Payment UX

## Objective
Resolve KI-020: a retried submission after a lost response returns the original order instead of creating a second one.

## Source Requirements
Architecture §33, §36, §50, §61; KNOWN_ISSUES KI-020.

## Implementation Scope
Additive migration order_submission_keys; Idempotency-Key header (validated); replay lookup before storing files; key row written in the order transaction; replay 200 + Idempotent-Replayed; conflicting reuse 409; 24-hour expiry; web client key per distinct submission, reused on retry.

## Authorization / Security Rules
Store only a SHA-256 hash of the key; bind the key to the submitting member (guest keys are capabilities like the Public Order ID); replay returns only the receipt DTO; CSRF and rate limits unchanged.

## Business Rules
No key = previous behavior. Same key + same request = same order. Same key + different request or different owner = 409. Concurrent duplicates: exactly one order; files of the losing request are compensated.

## Testing
DB tests: replay JSON and multipart (no extra files stored), conflict, other member, expiry, concurrency, invalid header; web tests: key reuse on retry and renewal on change; migration fresh-reconstruction.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and affected Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
If the migration would have to change domain tables or applied migrations.
