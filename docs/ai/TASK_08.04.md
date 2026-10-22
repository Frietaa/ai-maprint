# TASK-08.04 — API Container Image

Phase: 08 — Production Infrastructure & Deployment Readiness

## Objective
A reproducible, minimal, non-root API image usable by container hosts.

## Source Requirements
Architecture §52, §53.

## Implementation Scope
apps/api/Dockerfile (multi-stage, npm ci, build, production dependencies only, non-root user, HEALTHCHECK, no secrets), .dockerignore; migration target.

## Authorization / Security Rules
No .env, local storage or test files in the image.

## Testing
docker build; run the image against the test database: health/readiness, refusal of NODE_ENV=production with local storage.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A provider decision that blocks unrelated work, secret exposure, or a security reduction.
