# TASK-06.04 — Payment Status Customer Experience

Phase: 06 — Remaining MVP Experience & Customer Payment UX

## Objective
Members see the safe payment state of their own orders.

## Source Requirements
PRD §16, §18; Architecture §39.

## Implementation Scope
Member order detail payment section with Indonesian labels (Belum dibayar / Menunggu konfirmasi / Lunas), method and amount; text explains manual confirmation.

## Authorization / Security Rules
Ownership enforced by the existing member query; no Admin identity.

## Testing
DB test (payment visible to owner only, no confirmedBy); page tests for each status.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and affected Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A needed domain migration, a test-DB/storage guard failure, private-data exposure, or a security regression.
