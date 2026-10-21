# TASK-04.02 — Core Order Submission & Public Order IDs

Phase: 04 — Order Submission, Private Files & Tracking

## Objective

`POST /api/v1/orders` creates SUBMITTED orders for Guests and MEMBERs
atomically with an initial status-history row.

## Source Requirements

PRD §13, §15, §26; Architecture §28, §33, §42; ADR-005.

## Scope

- Order router mounted in the session-backed section: rate limit → CSRF
  (app level) → principal → body (JSON ≤ 64 kB) → controller → service.
- Service: member association (MEMBER only; ADMIN treated as guest),
  active-location check, deadline check (future, ≤ 1 year), snapshot,
  public ID with bounded collision retry, one transaction for order +
  extension + items + history.
- Receipt DTO: publicId, type, status, createdAt, requestedCompletionAt,
  estimatedTotal.

## Business Rules

Server owns publicId, status, userId, totals and history. History row
`fromStatus null → SUBMITTED`, actor = member id or null.

## Security Requirements

Strict schema rejects userId/status/publicId/prices/adminNotes/role; CSRF
required for guests too; separate submission rate limit; no internal IDs in
responses.

## Exclusions

Payment, admin transitions, idempotency keys.

## Testing

DB tests: guest, member, snapshot preserved after profile change,
privileged-field rejection, ID shape, collision retry, history row,
rollback on failure, inactive/unknown location, past deadline, CSRF, rate
limit, ADMIN not linked.

## Verification

All API suites green; no partial rows after failures.

## Project Memory

Identity, history-actor and rate-limit decisions.

## Stop Conditions

Atomicity cannot be achieved with Prisma transactions.
