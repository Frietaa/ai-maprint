# TASK-06.02 — Customer Payment Information Contract

Phase: 06 — Remaining MVP Experience & Customer Payment UX

## Objective
Shared, privacy-safe contracts for customer payment information.

## Source Requirements
PRD §16, §18, §22; Architecture §39, §40.

## Implementation Scope
PublicSettingsDto.qrisImageRef (safe references only, sanitized by the API); MemberOrderDetailDto.payment {method, status, amount} | null; shared helper for browser-safe image references used by both API and web.

## Authorization / Security Rules
Never expose payment ID, confirming Admin or confirmation time to customers; guest tracking DTO unchanged; unsafe refs (http, data:, javascript:, protocol-relative, bare storage keys) published as null.

## Business Rules
QRIS selection never implies PAID; Admin confirms manually.

## Testing
Mapper unit tests (safe/unsafe refs, payment allow-list); DB tests for public settings and member detail; tracking DTO unchanged.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and affected Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A needed domain migration, a test-DB/storage guard failure, private-data exposure, or a security regression.
