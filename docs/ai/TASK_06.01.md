# TASK-06.01 — Remaining MVP Gap Audit

Phase: 06 — Remaining MVP Experience & Customer Payment UX

## Objective
Compare the PRD MVP boundary (§30, §32) with the accepted implementation and list what customer-facing work remains.

## Source Requirements
PRD §3, §16–§18, §22, §27–§30, §32; Architecture §47; KNOWN_ISSUES.

## Implementation Scope
Read-only audit of routes, DTOs, pages and Known Issues; record gaps and the Phase-06 decisions in PHASE_06.md.

## Business Rules
Gaps found: customer QRIS display (KI-021), member payment state, duplicate submissions (KI-020), unbounded catalog lists (KI-012), name-keyword service mapping (KI-013). Production DB/deployment/smoke (PRD §32) belong to Phases 07–09.

## Exclusions
Code changes.

## Testing
None (audit).

## Verification
format, lint, typecheck, build; unit, DB (test database only) and affected Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A needed domain migration, a test-DB/storage guard failure, private-data exposure, or a security regression.
