# PHASE-02 / TASK-02.06 — Products / ATK Catalog Vertical Slice

## Status

NOT_STARTED

## Objective

Deliver `GET /api/v1/products` and the `/atk` catalog page.

## Scope

Backend:

- route → validator → controller → `products.service` → existing
  `listProducts` repository (extended with an `availability` filter) →
  Prisma.
- Filters: `categoryId` (UUID), `availability` (`AVAILABLE` |
  `UNAVAILABLE`). Unknown/invalid parameters → 400.
- `ProductDto`: id, name, description, price, availability, imageRef,
  category `{ id, name, description }`.

Frontend:

- `useProductsQuery`; `/atk` page grouped by category with a category filter
  control (labelled, keyboard operable).
- Product card: name, description, Rupiah price (central formatter),
  availability badge with text ("Tersedia" / "Stok sedang kosong") — never
  color alone; image only for safe references (https URL or root-relative
  path), otherwise a neutral placeholder.
- Loading / empty / error with retry.

## Requirements

- Active products in active categories only; `UNAVAILABLE` stays visible and
  clearly marked.
- No cart, checkout, quantity selector, stock numbers, uploads or storage.
- No arbitrary external image fetching beyond https URLs configured in the
  database.

## Exclusions

Purchase request, ordering, product detail page, image upload.

## Verification

- API tests (DB-backed): DTO shape, active/category filtering, availability
  and category filters, invalid input → 400.
- Component tests: availability badge text, placeholder image, category
  filter, page states.
- Root typecheck, build, lint, format, `npm test`, `npm run test:db`.

## Project Memory

Record filters, availability presentation, image policy.

## Stop Condition

Stop when verification passes; continue to TASK-02.07.
