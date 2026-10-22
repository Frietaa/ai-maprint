# TASK-07.01 — Threat Model, Security Gap Audit & Regression Baseline

Phase: 07 — Security, Reliability & Production Hardening

## Objective
Document realistic threats and mitigations for the real attack surface and make the regression baseline reliable.

## Source Requirements
PRD §26; Architecture §19, §20, §42; TASK-06.10 finding F-1.

## Implementation Scope
docs/SECURITY.md (assets, actors, attack surfaces: public reads, auth, Admin, orders, tracking IDs, uploads, downloads, settings/QRIS refs, CORS, CSRF, sessions, rate limits, Google, retention, operator commands; mitigations with code references; residual risks). Fix the flaky Admin E2E toggle step (wait for the PUT before reloading).

## Business Rules
No security theater: every listed mitigation exists in code or is an explicit deployment requirement.

## Testing
Admin E2E spec repeated runs.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A needed domain migration, a security reduction, a test-DB/storage guard failure, or secret exposure.
