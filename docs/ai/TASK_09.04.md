# TASK-09.04 — Data / Migration / Storage Regression

Phase: 09 — Release Candidate, Full Regression & Launch Readiness

## Objective
Prove database and storage integrity.

## Source Requirements
Architecture §21–§27, §34–§37, §50.

## Implementation Scope
Migration integrity, fresh reconstruction, dev/test status, no drift, constraints and indexes present, session table, seed idempotency (test DB), private storage roots, randomized keys, compensation, retention and deletedAt semantics, production adapter and scanner status.

## Business Rules
Release-candidate freeze: no feature expansion; only bug, test-stability, security, deployment and documentation fixes.

## Testing
Catalog queries of pg_constraint/pg_indexes on the test DB; DB suites.

## Verification
All suites green on the test database; dev data untouched.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A CRITICAL/HIGH defect that cannot be fixed safely, secret exposure, or a test-DB/storage guard failure.
