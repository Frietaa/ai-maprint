# TASK-04.07 — Guest Tracking & Member Order History

Phase: 04 — Order Submission, Private Files & Tracking

## Objective

Safe public tracking by exact Public Order ID and MEMBER order history and
detail.

## Source Requirements

PRD §16; Architecture §40, §47 (pagination), §19 (ownership).

## Scope

- `GET /orders/track/:publicId` (public router, no session lookup):
  malformed 400, unknown 404 "Order not found", rate-limited 429.
- `GET /account/orders?page=&pageSize=` (default 10, max 50; meta page,
  pageSize, total, totalPages) and `GET /account/orders/:publicId`
  (lookup by publicId AND userId; others' orders 404), MEMBER only.

## Business Rules

Newest first; snapshots shown as submitted.

## Security Requirements

Tracking DTO without customer data, description, files, prices, internal
IDs or actors; member DTOs without storage keys, admin notes or actor IDs.

## Exclusions

Search, enumeration, file download.

## Testing

DB tests: tracking fields allow-list, malformed/unknown, rate limit, member
list paging/ordering/isolation, detail ownership, profile/catalog changes
do not alter history, 401/403.

## Verification

API suites green.

## Project Memory

DTO allow-lists and pagination.

## Stop Conditions

None beyond phase rules.
