# TASK-07.06 — Retention Scheduling Integration Boundary (KI-018)

Phase: 07 — Security, Reliability & Production Hardening

## Objective
A provider-neutral invocation contract for the retention cleanup.

## Source Requirements
Architecture §37; KI-018.

## Implementation Scope
Cleanup command uses the storage factory, a PostgreSQL advisory lock (overlapping runs exit cleanly), one JSON summary line and documented exit codes; scheduling guidance (daily) for the chosen host.

## Business Rules
Retention rule unchanged: COMPLETED + 30 days.

## Testing
DB tests for the lock; command smoke on the test database.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A needed domain migration, a security reduction, a test-DB/storage guard failure, or secret exposure.
