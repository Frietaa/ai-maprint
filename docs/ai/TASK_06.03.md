# TASK-06.03 — Static QRIS Customer Experience

Phase: 06 — Remaining MVP Experience & Customer Payment UX

## Objective
Show the owner-configured static QRIS where customers need it.

## Source Requirements
PRD §18, §22; ADR-008, ADR-023.

## Implementation Scope
PaymentInfo component (QRIS image with alt text, Cash option, manual-confirmation notice, WhatsApp hand-off) on the receipt, the member order detail and the tracking page.

## Authorization / Security Rules
Image only from a safe reference; no automatic verification claims.

## Business Rules
Shown only when configured; otherwise Cash/WhatsApp guidance only. Not shown for PAID or CANCELLED member orders.

## Exclusions
Image upload, gateway, polling.

## Testing
Component/page tests: configured/missing/unsafe QRIS, copy, alt text.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and affected Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A needed domain migration, a test-DB/storage guard failure, private-data exposure, or a security regression.
