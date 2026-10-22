# TASK-05.05 — Payment Confirmation

Phase: 05 — Admin Operations & Order Management

## Objective
Manual payment recording and confirmation.

## Source Requirements
PRD §18; Architecture §39.

## Implementation Scope
`PATCH …/payment {method, status, amount}` (lazy single Payment row);
payment panel on the detail page.

## Authorization / Security Rules
ADMIN + CSRF; confirmedById/confirmedAt server-owned; no gateway.

## Business Rules
CASH / QRIS_STATIC; UNPAID / PENDING_CONFIRMATION / PAID; entering PAID sets
the confirmation, staying PAID keeps it, leaving PAID clears it; amount null
or whole Rupiah; audit PAYMENT_UPDATED with before/after.

## Exclusions
Customer payment UI, installments, gateway, webhooks.

## Testing
Create, update, confirm, re-save PAID, revert, confirmedById injection 400,
amount bounds, one row per order, audit.

## Verification
API/web suites green.

## Project Memory
Payment semantics.

## Stop Conditions
A needed schema migration, a guard failure, or a security regression.
