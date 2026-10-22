# TASK-08.07 — CI Pipeline

Phase: 08 — Production Infrastructure & Deployment Readiness

## Objective
Automated verification on every push and pull request.

## Source Requirements
Architecture §55.

## Implementation Scope
.github/workflows/ci.yml: npm ci, format, lint, typecheck, unit tests, check:migrations, prisma validate, DB tests and fresh reconstruction on an ephemeral PostgreSQL service, build, Playwright (dev + production-build preview); synthetic secrets only. Root `npm run verify` as the local equivalent.

## Authorization / Security Rules
No production database or secrets; least-privilege workflow permissions.

## Testing
Workflow YAML parses; `npm run verify` passes locally.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A provider decision that blocks unrelated work, secret exposure, or a security reduction.
