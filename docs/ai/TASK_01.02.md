# PHASE-01 / TASK-01.02 — Core Identity & Location Schema

## Status

NOT_STARTED

## Objective

Implement the first persistent MABA PRINTING domain schema:

- user identity foundation;
- business location foundation.

Create the first real Prisma migration against the approved local PostgreSQL
development database.

This task defines persistence only.

It does NOT implement authentication, authorization, account APIs, location
APIs or frontend features.

---

## Source Requirements

Remain consistent with the approved PRD and Architecture.

Relevant frozen requirements:

### User

A persistent user may represent:

- MEMBER
- ADMIN

Guest customers do NOT receive a permanent user row.

User requirements include:

- UUID internal identifier;
- role;
- name;
- unique email;
- nullable password hash for Google-only accounts;
- Google identity support;
- WhatsApp/contact value;
- active/inactive state;
- timestamps.

Public registration must never be able to create ADMIN accounts, but that
application rule belongs to a later authentication task.

### Location

MABA PRINTING supports multiple business locations.

A location must support:

- UUID internal identifier;
- location name;
- address;
- opening-hours information;
- active/inactive state;
- timestamps.

Service availability per location belongs to TASK-01.03 after services exist.

---

## User Role

Create a database-backed Prisma enum:

- MEMBER
- ADMIN

Do not add roles that are not approved by the Architecture.

Guest is NOT a database user role.

---

## User Model

Create the user persistence model with the minimum approved identity fields.

Expected concepts:

- id
- role
- name
- email
- password hash
- Google identity
- WhatsApp/contact
- active state
- created timestamp
- updated timestamp

Requirements:

### Identifier

Use PostgreSQL UUID-compatible storage.

The primary key must be generated automatically.

Do not use sequential public IDs.

### Email

Email must be unique.

Do not implement authentication normalization/business logic in this task.

Do not create public login/register code.

### Password

Password hash must be nullable because a Google-only member may have no local
password.

Never store a plaintext password.

No password hashing implementation belongs to this task.

### Google Identity

Provide a nullable unique Google identity field suitable for future verified
Google OAuth linkage.

Do not store Google passwords or access tokens.

Do not implement OAuth.

### WhatsApp

WhatsApp/contact information may be nullable at the persistence level unless
the approved source-of-truth explicitly requires it for every registered user.

Do not implement OTP.

### Active State

Support account deactivation without deleting historical identity.

Default new persistent users to active unless an approved requirement says
otherwise.

### Timestamps

Use created and updated timestamps.

Persist timestamps in a PostgreSQL-compatible form suitable for the project's
UTC persistence rule.

---

## Location Model

Create the location persistence model.

Expected concepts:

- id
- name
- address
- opening hours
- active state
- created timestamp
- updated timestamp

Requirements:

### Identifier

Use UUID primary keys.

### Opening Hours

Choose the smallest maintainable representation that preserves the ability to
represent business opening hours.

Do not implement a scheduling engine.

If JSON/JSONB is chosen, document the intended data shape and why it is
appropriate.

Do not hardcode actual business hours into the schema.

### Active State

Locations should be deactivated rather than destructively removed during
normal application operations.

Do not implement deletion APIs here.

### Service Availability

Do NOT create location-service relations yet.

That belongs to TASK-01.03 because service entities do not exist yet.

---

## Naming

Use consistent Prisma/database naming.

Follow the repository's existing Prisma conventions.

If Prisma model names use PascalCase while database tables use snake_case,
use explicit mapping consistently.

Avoid accidental mixed naming styles.

---

## Relationships

Do not create speculative relationships.

In particular:

- no orders yet;
- no services yet;
- no products yet;
- no payments;
- no audit log relationships;
- no authentication sessions.

Those belong to later tasks.

---

## Constraints

Implement constraints that are intrinsic to these models now, including:

- primary keys;
- unique email;
- unique Google identity when non-null.

Broader performance indexing and cross-domain constraint review belongs to
TASK-01.06.

Do not postpone essential uniqueness merely because TASK-01.06 exists.

---

## Migration

Create the first meaningful Prisma migration.

Migration must be clearly named, for example:

`core_identity_locations`

or another concise equivalent.

Before applying:

1. validate the Prisma schema;
2. inspect intended migration changes;
3. confirm the target is the LOCAL development database.

Apply only to:

`maba_printing_dev`

Never target production or another external database.

Do not use destructive reset as the normal migration path.

---

## Migration SQL Review

Inspect the generated SQL.

Confirm it creates only the intended:

- enum(s);
- users table;
- locations table;
- required keys/constraints/indexes.

No unrelated table or destructive statement should appear.

Report the important SQL objects created.

---

## Database Verification

After migration:

Verify against PostgreSQL that:

1. migration is recorded by Prisma;
2. users table exists;
3. locations table exists;
4. expected columns exist;
5. primary keys are UUID-compatible;
6. email uniqueness exists;
7. Google identity uniqueness exists;
8. defaults behave as intended;
9. timestamps are represented correctly;
10. no unexpected domain tables exist.

Use non-sensitive synthetic data only if a small insert/query probe is useful.

Remove temporary probe rows afterwards unless explicitly intended as seed
data.

Do not create seed data in this task.

---

## Prisma Client

Regenerate Prisma Client after schema changes.

Confirm the generated client exposes the new models/types.

Do not expose Prisma types directly as public API DTO contracts.

---

## Scope Protection

Do NOT implement:

- signup;
- login;
- logout;
- Google OAuth;
- sessions;
- password hashing;
- authorization middleware;
- user controllers/services;
- location endpoints;
- frontend forms/pages;
- services;
- products;
- orders;
- payments;
- uploads;
- admin functionality;
- seed data.

This task is schema + migration only.

---

## Regression Verification

Required:

1. Prisma schema validation PASS.
2. Prisma Client generation PASS.
3. Migration creation/application PASS.
4. Prisma migration status PASS.
5. Direct database schema inspection PASS.
6. API typecheck PASS.
7. Root typecheck PASS.
8. Root build PASS.
9. Root lint PASS.
10. Root format check PASS.
11. Existing Vitest tests PASS.
12. Existing Playwright test PASS.
13. API health check PASS.
14. No DATABASE_URL exposed to web.
15. No plaintext real credentials added.
16. No out-of-scope application feature added.

---

## Failure Handling

If migration generation/application produces unexpected destructive SQL:

STOP.

Do not accept or work around it silently.

If Prisma reports migration drift:

STOP and report it.

Do not automatically reset the database merely to eliminate drift.

If database connectivity disappears:

report the environment failure accurately.

---

## Project Memory

After successful implementation update:

- PROJECT_STATE.md
- CURRENT_TASK.md
- CHANGELOG_AI.md
- KNOWN_ISSUES.md when necessary.

Record:

- models introduced;
- enum introduced;
- migration name;
- relevant schema decisions;
- opening-hours representation;
- migration verification;
- database verification.

Do not begin TASK-01.03.

---

## Completion Status

Use:

- COMPLETED
- BLOCKED
- FAILED_VERIFICATION
- AWAITING_APPROVAL

---

## Stop Condition

STOP after TASK-01.02.

Do not begin TASK-01.03.