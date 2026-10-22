# TASK-06.07 — Service Business-Line Mapping Hardening

Phase: 06 — Remaining MVP Experience & Customer Payment UX

## Objective
Make the KI-013 mapping one shared definition and visible to Admins.

## Source Requirements
PRD §2, §19; KI-013.

## Implementation Scope
Move keyword mapping to packages/shared; Admin services page shows the mapped business line per category and warns about unmapped categories.

## Business Rules
No schema change; the business-line column is a human decision.

## Testing
Shared unit tests; Admin page test for mapped/unmapped categories.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and affected Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A needed domain migration, a test-DB/storage guard failure, private-data exposure, or a security regression.
