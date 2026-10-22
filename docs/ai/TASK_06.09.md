# TASK-06.09 — Full MVP Integration E2E

Phase: 06 — Remaining MVP Experience & Customer Payment UX

## Objective
Representative customer journeys across the four business lines on the test database and storage.

## Source Requirements
PRD §29; Architecture §48.

## Implementation Scope
Playwright: guest printing (file) → receipt with QRIS → track; member ATK → history → detail with payment; laptop pickup → Admin pricing/status/payment → member sees safe state; software (legal acknowledgement) → track; lost-response retry returns the same order.

## Authorization / Security Rules
Synthetic data only; test DB and E2E storage; fixtures cleaned.

## Testing
Full Playwright suite green; test DB and storage empty afterwards.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and affected Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A needed domain migration, a test-DB/storage guard failure, private-data exposure, or a security regression.
