# PHASE 01 — Application & Data Foundation

## Status

PLANNED

## Objective

Establish the persistent application and domain-data foundation for
MABA PRINTING.

Phase 01 introduces PostgreSQL and Prisma and progressively implements the
approved data model without prematurely implementing application features.

---

## Source of Truth

All implementation must remain consistent with:

1. PRD_MABA_PRINTING_v1.0.md
2. ARCHITECTURE_MABA_PRINTING_v1.0.md
3. DECISIONS.md
4. MASTER_PROMPT.md
5. Project Memory
6. This phase specification
7. Active task specification

Do not reinterpret frozen product requirements without explicit approval.

---

## Planned Tasks

- TASK-01.01 — PostgreSQL & Prisma Foundation
- TASK-01.02 — Core Identity & Location Schema
- TASK-01.03 — Catalog Schema
- TASK-01.04 — Order Schema
- TASK-01.05 — Payment, History & Audit Schema
- TASK-01.06 — Database Constraints & Indexes
- TASK-01.07 — Seed & Development Data
- TASK-01.08 — Data Access / Prisma Integration
- TASK-01.09 — Database Testing & Developer Workflow
- TASK-01.10 — Phase 01 Final Verification

---

## Architecture Direction

Database:

PostgreSQL

ORM:

Prisma

Internal identifiers:

UUID

Money:

Integer Rupiah

Persistent timestamps:

UTC

Display timezone:

Asia/Jakarta / WIB

Application access direction:

Route
→ Middleware
→ Validator
→ Controller
→ Service
→ Repository when justified
→ Prisma
→ PostgreSQL

Repository abstraction is optional and must only be introduced where it adds
meaningful value.

---

## Database Scope

Phase 01 may establish persistence structures for:

- users;
- locations;
- service categories;
- services;
- location-service availability;
- product categories;
- products;
- orders;
- order items;
- type-specific service request extensions;
- order file metadata;
- payments;
- order status history;
- admin audit logs;
- business settings.

Exact implementation remains task-scoped.

---

## Phase Boundaries

Phase 01 does NOT implement complete:

- authentication flows;
- authorization flows;
- public catalog UI;
- order submission UI;
- file upload/storage behavior;
- payment workflow;
- WhatsApp workflow;
- admin dashboard;
- final frontend design;
- deployment.

Later phases consume the data foundation established here.

---

## Migration Rules

- Migrations must be reviewable.
- Do not casually rewrite applied migration history.
- Do not use destructive reset as a normal fix.
- Schema changes must match approved requirements.
- Database constraints should enforce important invariants where appropriate.
- Application validation does not replace database integrity.
- Use transactions for future multi-step operations where required.

---

## Data Safety

Never:

- connect tests to production;
- commit database credentials;
- log secrets;
- assume destructive migrations are harmless;
- seed real personal/customer information.

Development and test data must be synthetic.

---

## Phase Verification

Phase 01 ends with an independent verification checkpoint.

The checkpoint must inspect actual migrations, schema, constraints,
development workflow and database tests rather than trusting prior reports.

---

## Stop Rule

Each task must stop at its own scope boundary.

Do not automatically begin the next task.