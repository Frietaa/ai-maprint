# TASK-08.01 — Deployment Architecture Decision Package

Phase: 08 — Production Infrastructure & Deployment Readiness

## Objective
Give the owner a concise, provider-neutral basis for the hosting decisions.

## Source Requirements
Architecture §53, §64; ADR-022; KI-001.

## Implementation Scope
docs/DEPLOYMENT.md: topology, same-site recommendation, decision matrix (frontend host, API host, managed PostgreSQL, object storage, scanner, scheduler, domain/DNS) with requirements and criteria, the decisions the owner must make. Also fix TASK-07.10 F-1 (package.json description encoding).

## Exclusions
Choosing, buying or configuring a provider.

## Testing
Docs consistency.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A provider decision that blocks unrelated work, secret exposure, or a security reduction.
