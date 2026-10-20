# PHASE-02 / TASK-02.04 — Locations Vertical Slice

## Status

NOT_STARTED

## Objective

Deliver `GET /api/v1/locations` and the `/locations` page with real database
data and robust opening-hours rendering.

## Scope

Backend:

- route → controller → `locations.service` → existing `listLocations`
  repository with `activeOnly: true` → Prisma.
- `{ data: LocationDto[], meta: { count } }`, deterministic ordering (name,
  id); `openingHours` normalized by the shared parser (malformed → null).
- No query parameters (any parameter → 400).

Frontend:

- `useLocationsQuery`; `/locations` page listing name, address and opening
  hours.
- `OpeningHours` component: Indonesian day labels (Senin … Minggu), closed
  days ("Tutup"), split shifts, optional note, "Jam buka belum tersedia" for
  missing/malformed data.
- Loading (non-disruptive skeleton), empty (useful Indonesian copy) and error
  (message + "Coba lagi" retry) states.

## Requirements

- Active locations only; no internal fields.
- No Maps API, distance or geolocation.
- No date/scheduling library.
- One malformed location never breaks the page.

## Exclusions

Location detail pages, maps, service availability per location (02.05),
location management.

## Verification

- API tests: DTO allow-list, active-only, ordering, unknown query → 400
  (DB-backed on `maba_printing_test`).
- Component tests: opening hours (split shift, closed day, note, malformed),
  page loading/empty/error/retry/success.
- Root typecheck, build, lint, format, `npm test`, `npm run test:db`.

## Project Memory

Record endpoint behavior, opening-hours rendering rules.

## Stop Condition

Stop when verification passes; continue to TASK-02.05.
