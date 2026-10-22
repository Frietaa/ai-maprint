# TASK-05.02 — Admin Dashboard & Order Queue

Phase: 05 — Admin Operations & Order Management

## Objective
Operational overview and a filterable order queue.

## Source Requirements
PRD §20; Architecture §13, §47 (pagination, efficient queries).

## Implementation Scope
`GET /admin/dashboard` (status counts via groupBy, pending payment
confirmations, 5 recent orders); `GET /admin/orders` with page/pageSize
(≤ 50), status, type, locationId, paymentStatus, exact publicId; queue DTO
(publicId, type, status, customer name, location, requested completion,
totals, payment status, createdAt). Web `/admin` and `/admin/orders`.

## Authorization / Security Rules
ADMIN only; strict query validation; no description/files in list rows.

## Business Rules
Newest first with deterministic tie-break.

## Exclusions
Analytics, reports, free-text customer search.

## Testing
Counts with fixtures, query count bound, pagination, each filter, exact ID,
invalid filters 400, MEMBER 403.

## Verification
API/web suites green.

## Project Memory
Dashboard semantics, filters.

## Stop Conditions
A needed schema migration, a guard failure, or a security regression.
