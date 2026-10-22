# TASK-06.06 — Public Catalog Pagination

Phase: 06 — Remaining MVP Experience & Customer Payment UX

## Objective
Bound GET /products and GET /services (KI-012) without breaking the website.

## Source Requirements
Architecture §14, §47; KI-012.

## Implementation Scope
page/pageSize query (default 100, max 100), meta {count, page, pageSize, total, totalPages}; deterministic ordering; web hooks read pages in sequence (bounded) so catalog pages and the ATK form keep working.

## Business Rules
Locations stay unpaginated (few physical locations).

## Testing
Validator tests; DB tests for pages, bounds and meta; web hook tests for multi-page reads.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and affected Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A needed domain migration, a test-DB/storage guard failure, private-data exposure, or a security regression.
