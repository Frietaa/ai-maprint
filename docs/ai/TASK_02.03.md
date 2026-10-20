# PHASE-02 / TASK-02.03 — Public Settings Vertical Slice

## Status

NOT_STARTED

## Objective

Deliver `GET /api/v1/public/settings` end to end and introduce server-state
fetching in the frontend, so the public shell shows database-authoritative
business information.

## Scope

Backend:

- route → controller → `settings.service` → existing
  `findBusinessSettings` repository → Prisma.
- Response `{ data: PublicSettingsDto }` when the row exists;
  `{ data: null }` (HTTP 200) when settings are not configured. No fabricated
  values, no env fallback.

Frontend:

- TanStack Query introduced here: one `QueryClient` with conservative
  defaults, provider in the app root.
- One native-fetch API client (`apiGet`) that builds the URL from
  `VITE_API_BASE_URL` (empty → same origin, served by the Vite dev proxy),
  parses JSON, detects non-2xx, and normalizes failures into one `ApiError`
  (network / http / invalid response).
- `useSettingsQuery`; the header logo and footer use `businessName` with a
  static fallback display name; footer shows configured public information
  and the WhatsApp number as text when present.
- Vite dev proxy for `/api` to the local API.

## Requirements

- Public DTO excludes QRIS image, ids, timestamps.
- `socialLinks` only exposes http(s) URLs.
- Logo uses `logoRef` only when it is a safe image reference (https URL or
  root-relative path); otherwise the text mark.
- Settings failures never crash the shell (fallback name shown).
- No WhatsApp number or business name hardcoded as live data.
- No WhatsApp deep link (deferred to the WhatsApp phase).

## Exclusions

QRIS display, settings mutation, admin, deep links, env fallback.

## Verification

- API tests (no DB): service/controller with injected repository data;
  DB-backed API test on `maba_printing_test` (row present / absent).
- Frontend tests: API client error normalization; shell renders business
  name from the query, falls back on error/null.
- Root typecheck, build, lint, format, `npm test`, `npm run test:db`.

## Project Memory

Record TanStack Query version/defaults, API client behavior, settings
semantics.

## Stop Condition

Stop when verification passes; continue to TASK-02.04.
