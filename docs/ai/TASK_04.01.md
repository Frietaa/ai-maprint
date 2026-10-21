# TASK-04.01 — Order Architecture, Contracts & Persistence Access

Phase: 04 — Order Submission, Private Files & Tracking

## Objective

Lay the order foundation without endpoint behavior: shared contracts, the
Public Order ID utility, validators, the order repository, the order service
skeleton and safe DTO mappers.

## Source Requirements

PRD §13–§16; Architecture §12 (layers), §22 (IDs), §28–§30, §33; PHASE_04.md
"Key Decisions".

## Scope

- packages/shared: order types/statuses, Indonesian status labels (PRD §14),
  handover methods, order limits, API paths, request and response DTOs,
  paginated envelope.
- API: `public-id.ts` (generate + parse), order validators (Zod,
  discriminated on `type`), `order.repository.ts` (use-case functions only,
  explicit selects), `order.service.ts` structure, `order-dto.mapper.ts`.
- Transaction helper usable with the shared client or a transaction client.

## Business Rules

Public ID `MP-<YYYY Asia/Jakarta>-<13 Crockford base-32>`, 65 random bits.
Parser: trim + uppercase + exact pattern.

## Security Requirements

Shared contracts contain no internal IDs, storage keys, admin notes or actor
IDs; no Prisma/Express/React in shared.

## Exclusions

No routes, no uploads, no UI.

## Testing

Unit tests: ID shape/alphabet/entropy source, Jakarta year, parser,
validators, mappers (no leaked fields).

## Verification

Zero migrations; lint, typecheck, unit tests; Phase-03 suites green.

## Project Memory

Contract and ID decisions.

## Stop Conditions

The existing schema cannot represent the approved order data.
