# TASK-08.08 — Deployment Smoke & Rollback Procedures

Phase: 08 — Production Infrastructure & Deployment Readiness

## Objective
Non-destructive post-deployment checks and a rollback plan.

## Source Requirements
PRD §32; Architecture §54, §63.

## Implementation Scope
scripts/smoke.mjs (read-only: website, SPA routes, headers, health, readiness, public settings, locations, products, services, CORS for the website origin, Admin login page); DEPLOYMENT.md release, smoke and rollback sections.

## Business Rules
No orders, accounts, uploads or payments in production smoke tests.

## Testing
Smoke script against the local production build + E2E API.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A provider decision that blocks unrelated work, secret exposure, or a security reduction.
