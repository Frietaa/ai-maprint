# TASK-07.08 — Backup / Restore / Migration Procedures

Phase: 07 — Security, Reliability & Production Hardening

## Objective
Documented and rehearsed recovery and migration procedures.

## Source Requirements
Architecture §50, §63.

## Implementation Scope
docs/BACKUP_RESTORE.md (pg_dump/pg_restore, object-storage versioning, settings and files, RPO/RTO undecided); docs/OPERATIONS.md (migration deploy flow, rollback guidance, operator commands); restore rehearsal on a disposable database.

## Authorization / Security Rules
Never restore over the development database; disposable database dropped afterwards.

## Testing
Restore rehearsal: dump test DB with synthetic seed, restore into a disposable DB, compare fingerprints.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A needed domain migration, a security reduction, a test-DB/storage guard failure, or secret exposure.
