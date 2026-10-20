# PHASE-02 / TASK-02.02 — Public API Contract Foundation

## Status

NOT_STARTED

## Objective

Create the explicit, implementation-independent public contract and the
backend plumbing (validation, errors, response shapes, CORS) that the four
public read endpoints will share.

## Scope

- `packages/shared`: public DTO types (`PublicSettingsDto`, `LocationDto`,
  `OpeningHours`, `ServiceCategoryDto`, `ServiceDto`, `ProductCategoryDto`,
  `ProductDto`), response envelope types (`ApiItemResponse`,
  `ApiListResponse`, `ApiErrorResponse`), the public enum value lists
  (`PRICE_TYPES`, `PRODUCT_AVAILABILITIES`), and a dependency-free
  `parseOpeningHours(value: unknown)` normalizer.
- `apps/api`: Zod as a direct dependency; error classes
  (`ValidationError`, `NotFoundError`) and a centralized error handler; JSON
  404 for unknown `/api` routes; a query-validation helper; mapping functions
  from repository records to DTOs; an explicit CORS allowlist middleware
  driven by `FRONTEND_URL`; `createApp` accepting an injectable database
  accessor so tests can supply the test database / a transaction client.

## Requirements

- `packages/shared` imports nothing from Prisma, Express, React, Node or the
  browser.
- DTOs are mapped explicitly; no Prisma object or generated enum crosses the
  HTTP boundary; no `isActive`, timestamps, or QRIS data in public DTOs.
- Error shape `{ message, errors? }` with `errors` as
  `{ field: string[] }`; 500 responses never contain error details; errors
  are logged server-side without secrets.
- Unknown query keys are validation errors (no `activeOnly` escape hatch).
- UUID query values validated with Zod.
- CORS: only origins listed in `FRONTEND_URL` (comma-separated, normalized to
  origins) receive `Access-Control-Allow-Origin`; never `*`; no credentials;
  only `GET`/`OPTIONS` allowed.
- `GET /api/v1/health` unchanged and still database-independent.
- No pagination framework; collections report `meta.count`.

## Exclusions

No feature endpoint yet (they arrive in 02.03–02.06), no authentication, no
rate limiting, no response framework beyond small helpers.

## Verification

- Unit tests: opening-hours normalizer (valid, split shift, closed day,
  missing day, malformed input), DTO mappers (field allow-list, social-link
  URL filtering), query validation (valid UUID, invalid UUID, unknown key,
  repeated key), error handler (404 JSON, 500 without internals), CORS
  (allowed origin echoed, other origin not, no wildcard).
- Root typecheck, build, lint, format check, `npm test`, `npm run test:db`.

## Project Memory

Record contract decisions (envelope, `data: null` settings semantics,
error format, CORS variable), dependencies, and tests.

## Stop Condition

Stop the task when verification passes; continue to TASK-02.03.
