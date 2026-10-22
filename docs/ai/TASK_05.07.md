# TASK-05.07 — Catalog, Services & Locations Management

Phase: 05 — Admin Operations & Order Management

## Objective
Admin management of the public catalog and locations.

## Source Requirements
PRD §10, §19, §22; Architecture §27.

## Implementation Scope
List/create/update for product categories, products, service categories,
services, locations; per-location service availability; web pages
`/admin/products`, `/admin/services`, `/admin/locations` with structured
opening-hours editor.

## Authorization / Security Rules
ADMIN + CSRF; strict validation before DB constraints; audit
PRODUCT_*/SERVICE_*/…_CATEGORY_*/LOCATION_*/LOCATION_SERVICE_AVAILABILITY_
UPDATED.

## Business Rules
No hard deletes (isActive); availability ≠ isActive; whole Rupiah; FIXED
needs a price; opening hours HH:mm, open < close, existing JSON shape;
KI-013 warning on service categories.

## Exclusions
Image upload, slugs, numeric stock.

## Testing
CRUD, validation, deactivation visible/hidden publicly, availability
toggle, audit, MEMBER 403.

## Verification
API/web suites green.

## Project Memory
Catalog lifecycle.

## Stop Conditions
A needed schema migration, a guard failure, or a security regression.
