# TASK-05.09 — Admin Security, Audit & E2E

Phase: 05 — Admin Operations & Order Management

## Objective
Hardening pass and end-to-end proof of the Admin workflows.

## Source Requirements
PRD §21, §26, §29; Architecture §42, §46, §48.

## Implementation Scope
Admin mutation/download rate limits review, audit coverage review, log
review, E2E fixtures for an Admin (test DB only), Playwright: admin login,
member denial, order lifecycle to COMPLETED with pricing/payment/notes,
file download, catalog/location/settings edits reflected publicly,
responsive admin pages.

## Authorization / Security Rules
No privileged fields in public/member responses; CSRF on every admin
mutation; safe logs.

## Business Rules
As in 05.01–05.08.

## Exclusions
Load testing.

## Testing
Full unit, DB and E2E suites.

## Verification
Test DB and test/E2E storage empty afterwards; dev DB and dev storage
unchanged.

## Project Memory
Coverage and remaining limitations.

## Stop Conditions
A needed schema migration, a guard failure, or a security regression.
