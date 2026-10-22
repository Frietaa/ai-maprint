# TASK-05.08 — Business Settings Management

Phase: 05 — Admin Operations & Order Management

## Objective
Owner-editable business configuration (DB-authoritative, KI-011).

## Source Requirements
PRD §22, §33; KI-011.

## Implementation Scope
`GET/PATCH /admin/settings` (singleton id = 1, upserted); web
`/admin/settings`; public settings cache invalidated after save.

## Authorization / Security Rules
ADMIN + CSRF; image refs https URL or root-relative path; social links
http/https only; no javascript:/data:/paths; audit BUSINESS_SETTINGS_UPDATED
(changed field names + small before/after, never full publicInfo).

## Business Rules
Bounded text; WhatsApp optional (8–15 digits).

## Exclusions
Logo/QRIS upload, customer QRIS display.

## Testing
Upsert, partial update, validation, public endpoint reflects change, audit.

## Verification
API/web suites green.

## Project Memory
Settings management.

## Stop Conditions
A needed schema migration, a guard failure, or a security regression.
