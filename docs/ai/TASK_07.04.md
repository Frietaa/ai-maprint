# TASK-07.04 — Object Storage Adapter Boundary (KI-019)

Phase: 07 — Security, Reliability & Production Hardening

## Objective
Make adding the production object-storage adapter a one-place change with a defined contract.

## Source Requirements
Architecture §34, §36, §41; KI-019.

## Implementation Scope
createStorageFromConfig factory used by the API and operator commands; reusable storage contract test suite; documented adapter requirements (private bucket, no public ACLs, server-side access only, encryption at rest, lifecycle/versioning, credentials via environment, migration path from local).

## Authorization / Security Rules
Production guard for the local adapter stays.

## Testing
Contract suite against the local adapter.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A needed domain migration, a security reduction, a test-DB/storage guard failure, or secret exposure.
