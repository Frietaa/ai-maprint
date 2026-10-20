# PHASE-01 / TASK-01.06 — Database Constraints & Indexes

## Status

NOT_STARTED

## Objective

Harden the existing MABA PRINTING PostgreSQL schema with database constraints
and indexes that protect stable data invariants and expected access paths.

This task covers the schema created in:

- TASK-01.02
- TASK-01.03
- TASK-01.04
- TASK-01.05

Do not introduce new business-domain features.

---

# 1. Hardening Principle

Use PostgreSQL constraints for invariants that are:

- intrinsic to the stored value;
- stable across application workflows;
- inexpensive to enforce;
- understandable from the database itself.

Do NOT force workflow rules into triggers merely because PostgreSQL can do it.

Application/service logic remains responsible for rules requiring:

- cross-table business interpretation;
- authorization;
- workflow sequencing;
- external state;
- complex domain behavior.

---

# 2. Money Constraints

All whole-Rupiah money values must reject negative numbers where negative
values have no valid business meaning.

Review all existing money fields.

Expected examples include:

- Service price
- Product price
- Order estimatedTotal
- Order finalTotal
- OrderItem unitPrice
- OrderItem subtotal
- Laptop pickup/delivery fee
- Payment amount

Add CHECK constraints equivalent to:

value IS NULL OR value >= 0

for nullable monetary fields.

Required non-null Product price must satisfy:

price >= 0

Do not change money columns to floating point.

Do not silently change INTEGER money storage.

---

# 3. Service Pricing Invariant

The approved PriceType values are:

- FIXED
- REQUIRES_CONFIRMATION

Enforce:

FIXED service
→ price must be present

A REQUIRES_CONFIRMATION service may have a nullable price.

Do not require REQUIRES_CONFIRMATION price to be null, because an indicative
or later configured value may still be useful unless source-of-truth forbids
it.

Keep application validation as well in future service/admin features.

---

# 4. OrderItem Quantity

Order item quantity must be:

quantity > 0

Reject:

- zero;
- negative values.

Do not introduce fractional quantities.

---

# 5. OrderItem Catalog Reference Integrity

An OrderItem may represent:

- a Product-backed snapshot;
- a Service-backed snapshot;
- a custom snapshot with no live catalog reference.

It must NOT reference both a Product and a Service simultaneously.

Enforce an invariant equivalent to:

NOT (
  product_id IS NOT NULL
  AND service_id IS NOT NULL
)

Both null remains valid.

---

# 6. Laptop Service Constraints

Review the actual TASK-01.04 schema before writing constraints.

Where fields exist:

### Distance

Nullable distance must satisfy:

distance >= 0

### Pickup / Delivery Fee

Nullable fee must satisfy:

fee >= 0

### Pickup Address

If the existing handover-method enum/value explicitly contains PICKUP,
enforce that PICKUP requires a non-empty pickup address only if it can be done
with a simple stable row-level CHECK.

Do not invent an enum/value that does not already exist.

If whitespace-only validation would make the SQL disproportionately complex,
document what remains for application validation.

Do not implement the Rp2,000/km calculation in PostgreSQL.

---

# 7. Payment Constraints

Payment amount:

amount IS NULL OR amount >= 0

Do not implement payment workflow using CHECK constraints.

In particular, do not attempt to encode all combinations of:

- UNPAID
- PENDING_CONFIRMATION
- PAID
- confirmedBy
- confirmedAt

unless an invariant is unquestionably intrinsic and already approved.

Payment transition/confirmation logic belongs to application services.

---

# 8. Order File Constraints

File size must be:

size_bytes > 0

Do not constrain:

- MIME type to a database enum;
- filename extensions;
- upload counts.

Those remain configurable application rules.

---

# 9. Business Settings Singleton

The BusinessSettings design is a singleton row with:

id = 1

Enforce this at database level.

Use a simple CHECK constraint equivalent to:

id = 1

Do not create triggers.

Do not seed the row merely to test the constraint.

A temporary transaction/probe may be used and rolled back or cleaned up.

---

# 10. Email Case-Insensitive Uniqueness

Address KI-008.

Current database uniqueness is case-sensitive.

The final system must not allow persistent users such as:

User@example.com
user@example.com

to coexist.

Add a PostgreSQL case-insensitive uniqueness mechanism based on normalized
email comparison.

Preferred direction:

unique index on lower(email)

unless actual existing schema/tooling establishes a better PostgreSQL-native
solution.

Do not introduce CITEXT solely for this requirement unless clearly justified.

Preserve future application normalization:

trim + lowercase before persistence.

Database protection is defense-in-depth and does not replace application
normalization.

Do not modify previously applied migration files.

---

# 11. Index Review

Consult ARCHITECTURE_MABA_PRINTING_v1.0.md §26 and the actual schema.

Add the approved indexes that are still missing.

At minimum review expected access paths involving:

- foreign-key lookups;
- order listing/filtering;
- order ownership;
- location order queries;
- status history;
- order files;
- audit logs;
- catalog/category relationships.

Known deferred candidates include:

- services.category_id
- products.category_id
- location_services.service_id

Do not duplicate indexes already provided by:

- primary keys;
- unique constraints;
- existing migration indexes.

Do not create speculative indexes on every column.

Every new index must have a clear expected query/access purpose.

---

# 12. Wrong-Type Order Extensions

Review the known invariant:

- LaptopServiceRequest should correspond to LAPTOP_SERVICE Order.
- SoftwareInstallationRequest should correspond to SOFTWARE_INSTALLATION
  Order.

Do NOT add a PostgreSQL trigger by default.

This invariant crosses table boundaries and is expected to be enforced by
future Service-layer logic.

Record that decision clearly.

Only escalate if the Architecture explicitly mandates database enforcement.

---

# 13. Order Status Transitions

Do NOT implement database triggers for:

SUBMITTED → CONFIRMED / CANCELLED
CONFIRMED → IN_PROGRESS / CANCELLED
IN_PROGRESS → READY / CANCELLED
READY → COMPLETED

These are application/service-layer workflow rules.

The database enum already constrains valid status values.

---

# 14. Opening Hours

Do not add JSONB shape CHECK constraints for openingHours.

Its semantic shape will be validated by application-level Zod schemas when
location management is implemented.

Do not convert the representation during this task.

---

# 15. Business Settings Source-of-Truth Decision

Record KI-011 architecture decision:

Runtime operational settings stored in BusinessSettings are authoritative.

Examples:

- businessName
- whatsappNumber
- logoRef
- qrisImageRef
- socialLinks

Environment variables may serve only as deployment/bootstrap fallback where
later implementation explicitly requires one.

Frontend static configuration must not become a competing source of mutable
operational data.

Do not implement the public settings API in this task.

---

# 16. KI-009 Migration Line Endings

Do not modify previous migration files.

Do not normalize their line endings during this task.

KI-009 remains scheduled for safe verification in TASK-01.09.

If Prisma reports an applied migration checksum modification:

STOP.

Do not use:

prisma migrate reset

as a repair.

---

# 17. KI-010 Driver Warning

Do not upgrade:

- pg;
- Prisma;
- @prisma/adapter-pg

merely to suppress the warning.

No action is required unless compatibility is actually broken.

---

# 18. Migration Strategy

Create ONE new additive hardening migration.

Suggested name:

database_constraints_indexes

Use the established review-before-apply workflow:

1. confirm local target database;
2. validate Prisma schema;
3. create migration without applying where practical;
4. add/review required custom SQL constraints/indexes;
5. inspect complete SQL;
6. ensure previous migration files remain byte-identical;
7. apply only after review.

Target:

maba_printing_dev

Do not rewrite prior migrations.

Do not reset the database.

---

# 19. Custom SQL

Prisma schema may not represent every PostgreSQL feature required here,
including functional indexes and certain CHECK constraints.

Hand-written SQL inside the NEW migration is allowed.

Requirements:

- clear constraint/index names;
- deterministic SQL;
- PostgreSQL-compatible;
- additive changes only;
- comments where non-obvious;
- no application logic hidden in triggers.

Do not create a second ad-hoc SQL execution path outside migration history.

---

# 20. Migration SQL Review

Expected operations may include:

- ALTER TABLE ... ADD CONSTRAINT ... CHECK
- CREATE INDEX
- CREATE UNIQUE INDEX ... lower(email)

No unexpected:

- DROP TABLE
- DROP COLUMN
- TRUNCATE
- DELETE
- destructive type rewrite
- reset
- editing of previous migrations

If destructive SQL appears unexpectedly:

STOP.

---

# 21. Database Constraint Verification

Use synthetic probes to prove constraints actually reject invalid data.

At minimum verify appropriate examples:

### Email
Case-only duplicate email rejected.

### Service
FIXED + null price rejected.

### Money
Negative applicable monetary values rejected.

### Product
Negative price rejected.

### OrderItem
quantity = 0 rejected.

### OrderItem
product + service simultaneously rejected.

### Laptop
negative distance rejected.

### Files
sizeBytes <= 0 rejected.

### Settings
explicit id != 1 rejected.

Also verify valid corresponding values still succeed.

Use transactions/cleanup so no probe data remains.

---

# 22. Index Verification

Inspect PostgreSQL metadata.

Confirm:

- intended indexes exist;
- expression index for email exists if chosen;
- no unnecessary duplicate index was introduced;
- Architecture §26 expectations are satisfied or deviations documented.

Do not judge index success only from Prisma schema text.

---

# 23. Migration Integrity

After applying:

- Prisma migration status PASS;
- all earlier migrations remain unchanged;
- no drift warning;
- no checksum warning.

KI-009 remains OPEN unless its specific cross-checkout line-ending behavior is
actually tested safely.

Do not mark it resolved merely because local migration status passes.

---

# 24. Regression Verification

Required:

1. Prisma validate PASS.
2. Prisma generate PASS.
3. Migration creation/review PASS.
4. Migration apply PASS.
5. Migration status PASS.
6. Constraint probes PASS.
7. Index inspection PASS.
8. Root typecheck PASS.
9. Root build PASS.
10. Root lint PASS.
11. Root format check PASS.
12. Existing Vitest tests PASS.
13. Existing Playwright test PASS.
14. API health PASS.
15. no DATABASE_URL exposure.
16. no destructive reset.
17. no out-of-scope feature implementation.

---

# 25. Scope Protection

Do NOT implement:

- authentication;
- controllers/routes;
- repository layer;
- business services;
- order transition service;
- upload validation;
- payment workflow;
- pickup fee calculation;
- public settings API;
- frontend changes;
- seed data.

This task hardens persistence only.

---

# 26. Project Memory

After success update:

- PROJECT_STATE.md
- CURRENT_TASK.md
- CHANGELOG_AI.md
- KNOWN_ISSUES.md

Record:

- constraints added;
- indexes added;
- custom SQL decisions;
- KI-008 status;
- KI-011 decision;
- wrong-type extension decision;
- migration name;
- probe results.

Do not begin TASK-01.07.

---

## Completion Status

Use:

- COMPLETED
- BLOCKED
- FAILED_VERIFICATION
- AWAITING_APPROVAL

---

## Stop Condition

STOP after TASK-01.06.

Do not begin TASK-01.07.