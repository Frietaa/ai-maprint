# PHASE-01 / TASK-01.08 — Data Access / Prisma Integration

## Status

NOT_STARTED

## Objective

Establish the backend persistence-access pattern for MABA PRINTING using the
existing Prisma foundation.

This task connects application-side backend code cleanly to Prisma without
implementing public APIs or business workflows.

The goal is to prove a maintainable data-access boundary that future Services
and Controllers can consume.

---

## Architecture Direction

Approved backend direction:

Route
→ Middleware
→ Validator
→ Controller
→ Service
→ Repository when justified
→ Prisma
→ PostgreSQL

Repository abstraction is NOT mandatory for every model.

Do not create generic CRUD abstractions or one repository per database table.

---

## Current Database Foundation

The database currently contains persistence models for:

- Users
- Locations
- ServiceCategories
- Services
- LocationServices
- ProductCategories
- Products
- Orders
- OrderItems
- type-specific service requests
- Payments
- OrderStatusHistory
- OrderFiles
- AdminAuditLogs
- BusinessSettings

Development seed data currently exists for:

- BusinessSettings
- Locations
- catalog entities

Users and Orders are intentionally not seeded.

---

# 1. Prisma Client Ownership

Review and preserve the existing centralized Prisma client foundation.

Requirements:

- Prisma Client remains API/backend-only;
- apps/web must never import Prisma;
- packages/shared must never import Prisma;
- avoid creating independent PrismaClient instances throughout the app;
- connection configuration remains centralized;
- DATABASE_URL remains server-only.

If the existing `getPrisma()` implementation already satisfies this cleanly,
do not rewrite it merely for style.

---

# 2. Data Access Boundary

Create a small explicit repository/data-access layer under the API source.

Suggested location:

`apps/api/src/repositories/`

or another location consistent with the existing backend structure.

Do not use:

- generic BaseRepository;
- generic CRUD framework;
- reflection/meta-programming;
- unnecessary interfaces with only one implementation.

Prefer simple typed functions/modules/classes.

---

# 3. Repository Scope

Implement repositories only for data that has an already-approved near-term
read path.

Required repository areas:

- BusinessSettings
- Locations
- Services / service catalog
- Products / product catalog

Do NOT create repositories yet for:

- Users
- Orders
- Payments
- Files
- Audit logs

Those should be introduced when their actual application use cases exist.

---

# 4. BusinessSettings Repository

Provide the minimum read capability needed by the future:

GET /api/v1/public/settings

Expected capability:

- read singleton row id = 1.

Do not:

- implement API DTO mapping;
- create HTTP endpoints;
- implement admin updates;
- use environment fallback here.

If no row exists, return a clear nullable/not-found data result rather than
silently fabricating operational data.

BusinessSettings remains the authoritative mutable runtime source.

---

# 5. Location Repository

Provide data access for future public location reads.

Expected capabilities:

- list locations with explicit active-state filtering;
- retrieve one location by id when needed.

Do not hardcode:

- addresses;
- business hours;
- WhatsApp numbers.

Do not parse/validate openingHours JSON here.

Repository responsibility is persistence access, not business validation.

---

# 6. Service Catalog Repository

Provide data access suitable for future public service catalog behavior.

Expected capabilities should support retrieving:

- services;
- their category;
- active state;
- pricing information;
- location availability where useful.

Avoid N+1 query patterns.

Use Prisma relation selection/include deliberately.

Do not add business logic such as:

- calculating final prices;
- enforcing order rules;
- deciding pickup fees.

Do not expose Prisma entities as permanent public API DTO contracts.

---

# 7. Product Catalog Repository

Provide data access suitable for future ATK catalog reads.

Expected data should support:

- product;
- category;
- integer-Rupiah price;
- availability;
- active state;
- optional image reference.

Avoid N+1 query patterns.

Do not implement stock quantities.

Do not calculate order totals.

---

# 8. Public vs Admin Filtering

Repositories are data-access components, not authorization layers.

Do not bake an irreversible assumption into them that every caller is public.

Prefer explicit filtering parameters or clearly named read methods.

Examples:

- public-facing active-only query;
- unrestricted/internal query may be added later if actually needed.

Do not implement Admin features in this task.

---

# 9. Prisma Type Leakage

Do not publish Prisma-generated types through public API contracts.

Internal repositories may naturally use Prisma-generated input/result types
where useful.

But:

- packages/shared must not depend on Prisma;
- frontend must not import Prisma-generated types;
- future API DTOs remain separate contracts.

---

# 10. Dependency Injection / Testability

Repository functions should be usable with:

- the normal Prisma Client;
- a transaction-scoped Prisma client where future multi-step operations need
  it.

Do not introduce a dependency-injection framework.

Prefer lightweight explicit dependency passing.

If a shared database-client type is useful, keep it API-internal.

Do not overengineer transaction abstractions before real transactional
services exist.

---

# 11. Transactions

Do not implement artificial transactions simply to demonstrate Prisma.

The existing seed transaction is sufficient proof of basic transaction
support.

This task may establish types/patterns that allow repositories to receive a
transaction client later.

Actual multi-step business transactions belong to future service
implementation.

---

# 12. Query Design

Queries introduced in this task must:

- use known indexes/access paths where relevant;
- avoid obvious N+1 behavior;
- request only data needed for their repository use case;
- use deterministic ordering where list ordering matters.

Do not prematurely optimize with raw SQL.

Prisma queries are preferred unless a demonstrated requirement requires
otherwise.

---

# 13. Runtime Integration

Do not make API startup depend on the database if no current HTTP route needs
database access yet.

The existing:

GET /api/v1/health

must remain a lightweight process health endpoint.

Do not turn `/health` into a database readiness endpoint.

A future readiness/database health endpoint may be designed separately.

---

# 14. Database Lifecycle

Ensure current API shutdown behavior remains safe.

If Prisma is instantiated by application runtime in this task, ensure normal
shutdown can disconnect cleanly without adding complex process management.

Do not add hidden global connection side effects merely by importing a
repository module.

---

# 15. Repository Verification

Verify repositories against the existing synthetic seed data.

At minimum prove:

### Business Settings

- singleton row can be read;
- configured synthetic development value is returned.

### Locations

- active locations can be queried;
- openingHours reaches the repository unchanged.

### Services

- service/category relationship is available;
- PriceType and nullable price are represented correctly;
- location availability can be queried without N+1 behavior.

### Products

- category relationship is available;
- AVAILABLE and UNAVAILABLE values are represented;
- active and inactive state can be distinguished;
- imageRef remains optional.

Do not make permanent database changes during repository verification.

---

# 16. Tests

Add focused backend tests for the repository layer.

These are database integration tests, not unit mocks.

Requirements:

- use the local development/test-safe database strategy currently approved;
- never connect to production;
- tests must not mutate seed baseline permanently;
- read-only tests are preferred for this task.

If a separate test database is required by the current Architecture but does
not yet exist, do not invent an unsafe workaround.

TASK-01.09 owns the full database-test workflow.

Therefore this task may use narrowly scoped local integration verification
while leaving final isolated test-database orchestration to TASK-01.09.

Accurately distinguish automated tests from manual/temporary verification.

---

# 17. No Generic Repository Pattern

Explicitly avoid designs such as:

- Repository<T>
- BaseRepository
- automatic CRUD generation
- model-name-driven repository factories

The database models do not all share the same domain behavior.

Prefer concrete repositories driven by actual use cases.

---

# 18. Scope Protection

Do NOT implement:

- GET /public/settings;
- GET /locations;
- GET /services;
- GET /products;
- controllers;
- service-layer business logic;
- authentication;
- authorization;
- Admin CRUD;
- order repository;
- order workflows;
- payments;
- uploads;
- frontend data fetching;
- TanStack Query;
- DTO contracts;
- API response mapping.

This task establishes persistence access only.

---

# 19. Existing Known Issues

KI-009:
Do not alter applied migration files.
Final safe line-ending/checksum verification belongs to TASK-01.09.

KI-010:
Do not upgrade pg/Prisma solely because of the warning.

KI-011:
BusinessSettings is authoritative for mutable operational values.

Do not implement environment fallback yet.

---

# 20. Regression Verification

Required:

1. Prisma validate PASS.
2. Prisma generate PASS.
3. Repository code typechecks.
4. Repository integration/read verification PASS.
5. No N+1 pattern introduced in the implemented queries.
6. Root typecheck PASS.
7. Root build PASS.
8. Root lint PASS.
9. Root format check PASS.
10. Existing Vitest tests PASS.
11. Existing Playwright smoke test PASS.
12. API health PASS.
13. Prisma remains API-only.
14. No DATABASE_URL exposed to web.
15. Seed baseline remains unchanged.
16. No migration/schema change unless a genuine defect is discovered.
17. No out-of-scope HTTP/application feature added.

---

# 21. Schema Rule

This task should normally create:

ZERO new migrations.

If repository implementation appears to require a schema change:

STOP and report the requirement.

Do not casually modify the schema merely to simplify a query.

---

# 22. Project Memory

After success update:

- PROJECT_STATE.md
- CURRENT_TASK.md
- CHANGELOG_AI.md
- KNOWN_ISSUES.md only when necessary.

Record:

- Prisma client ownership;
- repository structure;
- repositories introduced;
- dependency injection/client strategy;
- important query shapes;
- verification results;
- confirmation that no schema migration occurred.

Do not begin TASK-01.09.

---

## Completion Status

Use:

- COMPLETED
- BLOCKED
- FAILED_VERIFICATION
- AWAITING_APPROVAL

---

## Stop Condition

STOP after TASK-01.08.

Do not begin TASK-01.09.