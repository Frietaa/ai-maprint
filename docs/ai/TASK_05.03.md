# TASK-05.03 — Order Detail & Status Transitions

Phase: 05 — Admin Operations & Order Management

## Objective
Full Admin order detail and safe status changes.

## Source Requirements
PRD §14, §15, §20; Architecture §29, §33.

## Implementation Scope
`GET /admin/orders/:publicId`; `PATCH /admin/orders/:publicId/status
{fromStatus, toStatus}`; shared transition map; web detail page with only
the allowed next statuses.

## Authorization / Security Rules
ADMIN + CSRF; actor from the session; customer snapshot untouched.

## Business Rules
Approved transitions only; completedAt on COMPLETED; conditional update on
the expected status → 409 on stale or concurrent change; history + audit
(ORDER_STATUS_UPDATED) in the same transaction; terminal states immutable.

## Exclusions
Customer notifications.

## Testing
Every allowed transition, invalid ones (SUBMITTED→READY/COMPLETED,
READY→CANCELLED, COMPLETED/CANCELLED→any), stale fromStatus 409, two Admins
racing, history actor, audit row, completedAt, rollback on audit failure.

## Verification
API/web suites green.

## Project Memory
State machine and concurrency strategy.

## Stop Conditions
A needed schema migration, a guard failure, or a security regression.
