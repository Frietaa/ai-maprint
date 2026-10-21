# TASK-04.04 — ATK Order Request

Phase: 04 — Order Submission, Private Files & Tracking

## Objective

ATK purchase requests from real products with server-side snapshots and
totals.

## Source Requirements

PRD §10 (binary availability, snapshots), Architecture §24, §30, §32.

## Scope

Items `{ productId, quantity }` (1–20 distinct products, quantity 1–99);
products re-read inside the order transaction; snapshot name, description,
unit price, subtotal; `estimatedTotal` = sum; INTEGER overflow guard.

## Business Rules

Product must exist, be active, in an active category and AVAILABLE; else
409 with per-item field errors. No stock decrement or reservation.
`finalTotal` null.

## Security Requirements

No client-supplied name/price/subtotal/availability accepted.

## Exclusions

Cart, checkout, payment, numeric stock.

## Testing

DB tests: snapshot values, totals, unavailable/inactive/hidden-category
product 409, duplicate products 400, quantity bounds, overflow guard,
history snapshot after catalog change.

## Verification

API suites green.

## Project Memory

Item limits and conflict semantics.

## Stop Conditions

None beyond phase rules.
