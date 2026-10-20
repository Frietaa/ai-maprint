# PHASE-02 / TASK-02.05 — Services Catalog Vertical Slice

## Status

NOT_STARTED

## Objective

Deliver `GET /api/v1/services` and render the database-backed service catalog
on the three service-line pages: `/printing`, `/laptop-service`,
`/software-installation`.

## Scope

Backend:

- route → validator → controller → `services.service` → existing
  `listServices` repository (extended, not bypassed) → Prisma.
- Filters: `categoryId` (UUID), `locationId` (UUID: only services available
  at that active location). Unknown/invalid parameters → 400.
- `ServiceDto`: id, name, description, priceType, price, category
  `{ id, name, description }`, `availableLocationIds` (active locations where
  the service is available) — loaded in the same query (no N+1).

Frontend:

- `useServicesQuery`; one central price formatter (`formatPrice`) used by
  every price display.
- Service-line pages: short Indonesian explanation of the line (static
  product-line copy), then the relevant catalog. Category→page matching uses
  the returned category names (keyword match, e.g. "print"/"cetak",
  "laptop", "software"/"instal"); no database UUIDs in frontend code. If no
  category matches, the page shows the whole public catalog grouped by
  category with an explanatory note instead of hiding everything.
- Service card: category, name, description, price presentation,
  availability ("Tersedia di: …" using location names from the locations
  query).
- Software page states the legal-software policy (licensed, free,
  open-source, or customer-owned license). No ordering/request form; CTA is
  informational next-step text only. No WhatsApp ordering.

## Requirements

- Inactive services / inactive categories never returned.
- `FIXED` → Rupiah; `REQUIRES_CONFIRMATION` → "Konfirmasi harga"
  (indicative price → "mulai Rp …"); never null/NaN/enum labels.
- Loading / empty / error with retry.
- No schema migration for categories; record the name-matching limitation as
  a LOW known issue.

## Exclusions

Request forms, uploads, pickup fee, ordering, WhatsApp deep links.

## Verification

- API tests (DB-backed): DTO shape, active/category filtering, `categoryId`
  and `locationId` filters, availability ids, invalid UUID / unknown key →
  400, constant query count.
- Component tests: price formatting cases, category matching + fallback,
  service card availability, page states.
- Root typecheck, build, lint, format, `npm test`, `npm run test:db`.

## Project Memory

Record filters, DTO, matching strategy and its known limitation.

## Stop Condition

Stop when verification passes; continue to TASK-02.06.
