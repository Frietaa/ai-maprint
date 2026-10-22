# TASK-08.05 — Production Database Readiness

Phase: 08 — Production Infrastructure & Deployment Readiness

## Objective
Guidance and settings for a managed PostgreSQL.

## Source Requirements
Architecture §21, §50, §63.

## Implementation Scope
TLS (sslmode), connection limits (Prisma pool + session pool), separate migration vs runtime roles, extensions (gen_random_uuid in PostgreSQL 13+), time zone UTC, session pruning, backups.

## Testing
Docs; migrate deploy on an empty database (test rebuild).

## Verification
format, lint, typecheck, build; unit, DB (test database only) and Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A provider decision that blocks unrelated work, secret exposure, or a security reduction.
