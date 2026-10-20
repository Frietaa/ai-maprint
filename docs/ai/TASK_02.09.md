# PHASE-02 / TASK-02.09 — Public Read Integration & E2E

## Status

NOT_STARTED

## Objective

Prove the complete path PostgreSQL → Prisma → repository → service →
controller → REST → fetch client → TanStack Query → React → browser with
deterministic automated tests.

## Scope

- DB-backed API integration tests (Supertest + `maba_printing_test`,
  per-test rollback) for all four public endpoints: success, safe DTO
  fields, filters, validation errors, active/inactive behavior, unavailable
  products.
- Component tests covering representative shell/loading/success/empty/error,
  price formatting, availability, opening hours (consolidated where already
  present; no duplicate trivial tests).
- Playwright Chromium E2E against a real API and the TEST database:
  - a dedicated E2E API process that refuses any database except
    `maba_printing_test` (existing guard), applies migrations, loads
    deterministic E2E fixtures (own ID prefix) and serves the API;
  - the web dev server pointed at it via `VITE_API_BASE_URL`, exercising the
    CORS allowlist (`FRONTEND_URL`);
  - global teardown removes the E2E fixtures so the test database returns to
    empty;
  - journey: Home → Locations → a service page → ATK, asserting visible
    database content (names, formatted prices, availability, opening hours).

## Requirements

- No automated test touches `maba_printing_dev`.
- Ordinary `npm test` stays database-independent.
- No reliance on the mutable development seed.
- Fixture cleanup is idempotent; setup cleans before inserting.

## Exclusions

New features, visual snapshot testing, cross-browser matrix.

## Verification

- `npm test`, `npm run test:db`, `npm run test:e2e` all pass; test database
  empty afterwards; development database fingerprint unchanged.
- Root typecheck, build, lint, format check.

## Project Memory

Record the E2E architecture, commands and test counts.

## Stop Condition

Stop when verification passes; continue to TASK-02.10.
