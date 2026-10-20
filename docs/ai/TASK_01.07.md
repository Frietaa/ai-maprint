# PHASE-01 / TASK-01.07 — Seed & Development Data

## Status

NOT_STARTED

## Objective

Create the deterministic local-development seed foundation for MABA PRINTING.

The seed must provide enough synthetic data to support upcoming persistence,
API and testing work without introducing real customer information or
production assumptions.

This task owns development seed data only.

It does NOT implement application features.

---

## Principles

Seed data must be:

- synthetic;
- deterministic;
- repeatable;
- safe for local development;
- minimal but representative;
- compatible with all current database constraints.

Do not seed real personal/customer/business information.

Do not treat development seed data as production configuration.

---

## Seed Scope

Provide representative data for the currently implemented foundational
catalog/location/business models.

Expected categories:

- BusinessSettings singleton;
- Locations;
- ServiceCategory;
- Services;
- LocationService availability;
- ProductCategory;
- Products.

A small synthetic Member/Admin user may be seeded only if genuinely useful
for upcoming development and if done safely.

Do NOT seed historical customer orders merely to make the database look busy.

Order-related probe/fixture data belongs to tests or later feature-specific
development where needed.

---

## Business Settings

Seed exactly one BusinessSettings row:

id = 1

Use clearly synthetic/local-development values.

Examples may include:

- development business name;
- placeholder WhatsApp number;
- placeholder logo/image references;
- empty or synthetic social links.

Do not use a real business phone number, QRIS payload, secret or credential.

The database remains the authoritative runtime source for mutable operational
settings.

---

## Locations

Seed a small number of synthetic locations sufficient to exercise:

- multiple locations;
- active/inactive behavior if useful;
- openingHours JSON structure.

Prefer 2 representative locations.

Use obviously fictional addresses.

Do not imply that the addresses are real MABA PRINTING branches.

Opening-hours data must follow the documented intended JSON shape.

---

## Service Categories

Represent the approved business service lines without hardcoding them into
database enums.

Seed representative editable categories such as:

- Printing
- Laptop Service
- Software Installation

ATK belongs to ProductCategory rather than requiring a ServiceCategory unless
the approved schema/source explicitly models it there.

Use stable seed identities or deterministic lookup fields so rerunning the seed
does not create duplicates.

---

## Services

Seed only a few representative services sufficient to exercise:

- FIXED pricing;
- REQUIRES_CONFIRMATION pricing;
- service active state;
- location-specific availability.

Examples must remain generic and synthetic.

Do not attempt to define the final MABA PRINTING service catalog.

All values remain Admin-editable later.

---

## LocationService

Create representative availability relationships.

Requirements:

- valid location/service pairs only;
- no duplicates;
- at least one service available at more than one location if useful;
- at least one unavailable relation may be included to exercise the flag.

Do not delete/recreate rows unnecessarily on rerun.

---

## Product Categories

Seed a small representative ATK category set.

Examples may include:

- Writing Tools
- Paper
- Notebooks

Keep names synthetic/generic and editable.

Do not overpopulate categories.

---

## Products

Seed representative ATK products sufficient to exercise:

- fixed integer-Rupiah price;
- AVAILABLE state;
- UNAVAILABLE state;
- active/inactive distinction;
- optional imageRef where useful.

Use synthetic generic products rather than actual commercial inventory.

Do not introduce numeric stock quantities.

---

## User Seed Decision

A persistent User may be seeded only if necessary for upcoming development.

If seeded:

- use clearly synthetic identity;
- no real person;
- no real email;
- no plaintext production password;
- never seed a real Google identity;
- do not create Guest users.

If password authentication is not implemented yet, prefer leaving passwordHash
null rather than inventing an authentication workflow solely for seed data.

Do not create an Admin account that could accidentally be reused outside local
development.

Document the decision either way.

---

## Orders

Do NOT seed orders by default.

Reason:

- order lifecycle features are not implemented yet;
- deterministic catalog/location seed is enough for Phase 01;
- orders are better created by tests/feature flows when those behaviors exist.

If there is an exceptional reason to seed an order, STOP and request approval.

---

## Seed Implementation

Use Prisma's supported seed mechanism appropriate to the installed Prisma
version.

Keep seed logic in the backend/database area.

Do not put seed logic in:

- apps/web;
- packages/shared.

The seed script must:

- connect using the local API/database environment;
- fail clearly if DATABASE_URL is unavailable;
- close/disconnect cleanly;
- avoid multiple Prisma Client instances unnecessarily.

---

## Idempotency

Rerunning the seed must not create uncontrolled duplicates.

Use deterministic identifiers, unique keys, upsert logic or another
maintainable approach.

The seed should converge to the intended development baseline.

Do not rely on destructive database reset as the normal way to rerun it.

---

## Existing Data

Do not delete user-created/local development records merely to make seed
idempotent.

Prefer targeted upserts of seed-owned records.

If a destructive strategy appears necessary:

STOP and report it.

---

## Seed Ownership

Seed-owned rows should be identifiable through deterministic stable IDs or
other unique keys.

Do not add a `seed_data` flag column to production tables solely for this task.

Do not change production schema just to support seeding unless a genuine
schema defect is discovered.

---

## Constraint Compatibility

Seed data must satisfy all TASK-01.06 constraints:

- no negative money;
- FIXED services have price;
- positive item/file quantities where applicable;
- BusinessSettings id = 1;
- valid enums;
- valid location/service pairs;
- case-insensitive user email uniqueness if a user is seeded.

Do not disable constraints during seeding.

---

## Scripts

Add a clear database seed command.

Expected concept:

- `db:seed`

Integrate it consistently with the existing root/workspace command strategy.

Do not create destructive `db:reset-and-seed` as the normal workflow.

---

## README

Document the minimum development flow:

1. start PostgreSQL;
2. configure `apps/api/.env`;
3. apply migrations if needed;
4. run seed;
5. rerun seed safely.

Clarify that seeded values are synthetic local-development data.

---

## Verification

Required:

1. Prisma seed command runs successfully.
2. Rerunning seed succeeds without duplicate-key failures.
3. Row counts are stable after rerun.
4. BusinessSettings has exactly one row with id = 1.
5. Expected Locations exist.
6. Expected ServiceCategories/Services exist.
7. LocationService relationships are valid.
8. ProductCategories/Products exist.
9. AVAILABLE/UNAVAILABLE product state is represented.
10. Active/inactive distinction is represented where intentionally seeded.
11. All current database constraints remain satisfied.
12. No orders are seeded unless explicitly approved.
13. No real credentials/personal information are present.
14. Root typecheck PASS.
15. Root build PASS.
16. Root lint PASS.
17. Root format check PASS.
18. Existing Vitest tests PASS.
19. Existing Playwright test PASS.
20. API health PASS.

---

## Existing Known Issues

KI-009:
do not modify previous migration files.

KI-010:
do not upgrade Prisma/pg to suppress the current warning.

KI-011:
BusinessSettings remains authoritative for mutable operational settings.

Do not implement public settings API in this task.

---

## Scope Protection

Do NOT implement:

- catalog APIs;
- order APIs;
- auth;
- password hashing;
- admin login;
- public settings endpoint;
- frontend catalog;
- file upload;
- payment workflow;
- test fixture framework;
- deployment data.

This task creates development seed data only.

---

## Project Memory

After success update:

- PROJECT_STATE.md
- CURRENT_TASK.md
- CHANGELOG_AI.md
- KNOWN_ISSUES.md only if necessary.

Record:

- seed strategy;
- seeded entity groups;
- whether users were seeded;
- idempotency mechanism;
- rerun verification;
- row counts;
- commands/documentation changes.

Do not begin TASK-01.08.

---

## Completion Status

Use:

- COMPLETED
- BLOCKED
- FAILED_VERIFICATION
- AWAITING_APPROVAL

---

## Stop Condition

STOP after TASK-01.07.

Do not begin TASK-01.08.