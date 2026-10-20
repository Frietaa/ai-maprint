# PHASE-01 / TASK-01.03 — Catalog Schema

## Status

NOT_STARTED

## Objective

Implement the persistent catalog foundation for MABA PRINTING.

This task introduces:

- service categories;
- services;
- service availability per location;
- product categories;
- products;
- catalog pricing/availability primitives.

This is schema + migration work only.

Do not implement catalog APIs, frontend pages, admin forms, ordering logic or
business workflows.

---

## Frozen Product Requirements

MABA PRINTING has four primary service/product lines:

1. document printing;
2. laptop service;
3. ATK/stationery products;
4. software installation.

Catalog data must remain editable by Admin in later phases.

Business/catalog data must not be hardcoded into application source.

---

## Required Models

Implement:

- ServiceCategory
- Service
- LocationService
- ProductCategory
- Product

Use only additional enums/fields that are necessary to express approved
requirements.

Do not introduce speculative catalog entities.

---

## Pricing

The approved service pricing modes are:

- FIXED
- REQUIRES_CONFIRMATION

Create a reusable Prisma/database enum:

PriceType

with exactly:

- FIXED
- REQUIRES_CONFIRMATION

Money is stored as integer Rupiah.

Do not use floating-point money columns.

---

## ServiceCategory

Provide the minimum fields necessary for an editable service category.

Expected concepts:

- UUID id;
- name;
- optional description;
- active/inactive state;
- createdAt;
- updatedAt.

Do not hardcode the four business lines as database enum values if they are
intended to remain admin-editable catalog data.

Do not create category seed records in this task.

---

## Service

Provide the minimum approved service catalog representation.

Expected concepts:

- UUID id;
- category relationship;
- name;
- optional description;
- PriceType;
- nullable fixed/base price;
- active/inactive state;
- createdAt;
- updatedAt.

Rules:

- money is integer Rupiah;
- services requiring confirmation may have no fixed price;
- fixed-price services need a price invariant, but database-level cross-field
  constraint hardening may be finalized in TASK-01.06;
- do not implement price calculation logic here.

Do not create type-specific request fields on Service.

Laptop complaints, printing files and software-installation request details
belong to order/request models, not the service catalog model.

---

## LocationService

Represent availability of a service at a location.

This must form the approved many-to-many relationship:

Location
    ↕
LocationService
    ↕
Service

Requirements:

- prevent duplicate location/service pairs;
- allow availability to be toggled without deleting catalog records;
- preserve Location and Service as independent entities.

Use either:

- a composite primary/unique key;

or

- a UUID row plus an intrinsic unique constraint;

choose the smallest maintainable representation and document the decision.

Do not add distance/pickup-fee logic here.

---

## ProductCategory

Provide the minimum editable ATK product-category representation.

Expected concepts:

- UUID id;
- name;
- optional description;
- active/inactive state;
- createdAt;
- updatedAt.

Do not seed actual categories in this task.

---

## Product

Provide the persistence model for ATK products.

Expected concepts:

- UUID id;
- category relationship;
- name;
- optional description;
- price;
- availability/stock state;
- active/inactive state;
- createdAt;
- updatedAt.

### Product Price

ATK uses fixed-price estimates.

Store price as integer Rupiah.

Do not add floating-point monetary types.

Do not implement checkout totals.

### Stock / Availability

MVP stock requirement is binary:

- AVAILABLE
- UNAVAILABLE

Do not introduce numeric inventory quantities unless explicitly approved.

Choose either:

- a two-value enum;

or another schema representation that preserves exactly this binary domain.

Document the choice.

Keep stock availability separate from active/inactive catalog lifecycle if
needed:

- unavailable = temporarily not orderable;
- inactive = catalog item intentionally removed from normal display.

---

## Naming

Continue the established convention:

- PascalCase Prisma models;
- camelCase Prisma fields;
- snake_case database tables/columns via explicit mapping.

Maintain consistency with TASK-01.02.

---

## Relationships

Allowed relationships in this task:

ServiceCategory
    1 → many Service

Location
    1 → many LocationService

Service
    1 → many LocationService

ProductCategory
    1 → many Product

Do not create:

- orders;
- order items;
- users-to-products;
- users-to-services;
- payments;
- admin audit relationships;
- file relationships.

---

## Delete / Lifecycle Behavior

The product requirement prefers deactivation instead of destructive deletion.

Do not design normal application behavior around cascade-deleting catalog
history.

Choose foreign-key actions conservatively.

Avoid cascading deletes that could become dangerous once orders reference
catalog entities later.

Document any referential action that differs from Prisma defaults.

---

## Essential Constraints

Implement intrinsic constraints now, including:

- primary keys;
- required foreign keys;
- unique LocationService location/service pair.

Do not invent unique constraints on names unless required by the approved
Architecture.

Broader indexing and cross-field database constraints remain TASK-01.06.

---

## Migration

Create one meaningful migration for the catalog foundation.

Suggested name:

catalog_foundation

or equivalent.

Before applying:

1. validate Prisma schema;
2. generate migration with review-before-apply workflow;
3. inspect SQL;
4. confirm target is local `maba_printing_dev`.

Migration SQL must contain only intended catalog changes.

No destructive reset.

---

## SQL Review

Confirm the generated migration creates only the expected:

- pricing/availability enum(s);
- service_categories table;
- services table;
- location_services table;
- product_categories table;
- products table;
- foreign keys;
- intrinsic unique constraints/indexes.

Unexpected DROP/TRUNCATE/destructive operations:

STOP.

---

## Database Verification

After applying migration verify:

1. migration status PASS;
2. all five new tables exist;
3. previous users/locations schema remains intact;
4. enum values match approved requirements;
5. foreign keys are correct;
6. duplicate LocationService pairs are rejected;
7. product price is integer-compatible;
8. service price is integer-compatible and nullable where appropriate;
9. product stock domain contains only approved binary states;
10. active/inactive fields behave as intended;
11. no unrelated tables were created.

Use synthetic temporary probes if useful.

Remove probe data afterwards.

Do not create permanent seed data.

---

## Prisma Client

Regenerate Prisma Client.

Confirm new catalog models/types are generated.

Do not expose Prisma models as public API DTOs.

---

## Scope Protection

Do NOT implement:

- catalog controllers/routes;
- admin CRUD APIs;
- frontend catalog pages;
- product ordering;
- service request forms;
- actual stock quantities;
- discount/promotions;
- orders;
- payments;
- uploads;
- auth;
- seed data.

---

## Regression Verification

Required:

1. Prisma validate PASS.
2. Prisma generate PASS.
3. Migration create/apply PASS.
4. Migration status PASS.
5. Database inspection PASS.
6. Root typecheck PASS.
7. Root build PASS.
8. Root lint PASS.
9. Root format check PASS.
10. Existing Vitest tests PASS.
11. Existing Playwright smoke test PASS.
12. API health PASS.
13. No DATABASE_URL exposed to web.
14. No out-of-scope implementation.
15. No destructive reset used.

---

## Existing Known Issues

KI-008:
Do not resolve email case-insensitive uniqueness in this catalog task.

KI-009:
Do not rewrite previously applied migration files merely to alter line endings.

If Prisma reports a checksum/migration modification warning:

STOP and report it.

Do not reset the database.

---

## Project Memory

Update after successful implementation:

- PROJECT_STATE.md
- CURRENT_TASK.md
- CHANGELOG_AI.md
- KNOWN_ISSUES.md only if necessary.

Record:

- models/enums introduced;
- PriceType design;
- product availability representation;
- LocationService key strategy;
- referential-action decisions;
- migration name;
- SQL/database verification.

Do not begin TASK-01.04.

---

## Completion Status

Use:

- COMPLETED
- BLOCKED
- FAILED_VERIFICATION
- AWAITING_APPROVAL

---

## Stop Condition

STOP after TASK-01.03.

Do not begin TASK-01.04.