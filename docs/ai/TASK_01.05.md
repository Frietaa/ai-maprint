# PHASE-01 / TASK-01.05 — Payment, History, Files Metadata & Audit Schema

## Status

NOT_STARTED

## Objective

Complete the remaining core persistence structures for the MABA PRINTING MVP:

- payment state;
- order status history;
- order file metadata;
- admin audit log;
- business settings foundation.

This is schema + migration work only.

Do not implement payment processing, uploads, cleanup jobs, admin APIs,
status-transition logic or frontend features.

---

## Source Requirements

Remain consistent with the approved PRD and Architecture.

Frozen payment methods:

- CASH
- QRIS_STATIC

Frozen payment statuses:

- UNPAID
- PENDING_CONFIRMATION
- PAID

Static QRIS must never automatically mark an order paid.

Admin confirms payment later in application logic.

---

# 1. Payment

## Required Enums

Create:

### PaymentMethod

Exactly:

- CASH
- QRIS_STATIC

### PaymentStatus

Exactly:

- UNPAID
- PENDING_CONFIRMATION
- PAID

Do not add gateway-specific values.

---

## Payment Model

Create a Payment persistence model associated with Order.

For MVP, prefer one current payment record per order unless the existing
source of truth clearly requires multiple payment attempts.

Expected concepts:

- UUID id;
- unique order relationship;
- payment method;
- payment status;
- nullable amount;
- nullable paidAt;
- optional admin confirmation reference if justified;
- createdAt;
- updatedAt.

### Amount

Use integer Rupiah.

Do not use floating-point money.

Amount may be nullable until the final price is known.

Non-negative enforcement may be finalized in TASK-01.06.

### QRIS

Do not store QRIS binary/image content in Payment.

QRIS image/configuration belongs to business configuration/storage references.

Do not implement auto-confirmation, gateway webhook or transaction provider
fields.

---

# 2. Order Status History

Create OrderStatusHistory.

Every persisted status change can later be represented by a history row.

Expected concepts:

- UUID id;
- orderId;
- nullable fromStatus;
- toStatus;
- nullable changedByUserId;
- createdAt.

`fromStatus` may be null for the initial recorded status.

Reuse the existing OrderStatus enum.

Do not create a second status enum.

### Actor

`changedByUserId` may be nullable because not every status history entry
necessarily originates from an Admin.

Database schema cannot guarantee that the referenced User has ADMIN role.

Role enforcement belongs to authorization/service logic.

### Lifecycle

Do not implement allowed-transition rules here.

Approved transitions remain:

SUBMITTED → CONFIRMED | CANCELLED
CONFIRMED → IN_PROGRESS | CANCELLED
IN_PROGRESS → READY | CANCELLED
READY → COMPLETED

COMPLETED and CANCELLED are terminal.

Application/service logic will enforce them later.

---

# 3. Order File Metadata

Create OrderFile metadata persistence only.

Expected concepts:

- UUID id;
- orderId;
- randomized/private storage key;
- original filename;
- MIME type;
- file size in bytes;
- createdAt;
- optional deletedAt if useful for lifecycle tracking.

Requirements:

- never store file bytes in PostgreSQL;
- never store a public URL as the authoritative storage identifier;
- storage key must support private object/local-storage abstraction;
- preserve original filename only as metadata;
- do not log or persist document contents.

The approved candidate file formats include:

- PDF
- DOCX
- PPTX
- XLSX
- JPG
- JPEG
- PNG

Do NOT enforce this list as a database enum.

File type/size/count validation belongs to upload/service logic and remains
configurable.

---

## File Retention

Requirement:

Files become eligible for deletion 30 days after an Order reaches COMPLETED.

Do not implement:

- cleanup scheduler;
- retention job;
- file deletion;
- storage provider.

Avoid duplicating a calculated retention timestamp unless there is a strong
persistence reason.

`Order.completedAt` is already available for future retention calculation.

---

# 4. Admin Audit Log

Create AdminAuditLog.

Expected concepts:

- UUID id;
- admin/user actor reference;
- action;
- target/entity type;
- nullable target/entity id;
- optional structured metadata;
- createdAt.

Keep this model generic enough to record future administrative changes such
as:

- order status change;
- final price update;
- payment confirmation;
- product availability;
- service availability;
- business-setting changes.

Do not create a separate audit table for each feature.

### Actor

Audit rows should reference a persistent User.

The database cannot enforce `role = ADMIN` through a normal foreign key.

Application authorization will enforce actor eligibility.

### Metadata

If JSONB is used:

- it must be optional;
- it must not encourage storage of passwords, tokens, uploaded document
  content or other secrets.

Do not add full event-sourcing architecture.

---

# 5. Business Settings

Create the minimum persistence foundation for mutable business configuration.

The system must not hardcode configurable operational information such as:

- WhatsApp number;
- logo reference;
- QRIS image reference;
- social links;
- branding/configuration values.

Do not duplicate Location addresses/opening hours into this model.

Prefer a simple and maintainable representation.

Acceptable strategies include:

- typed singleton settings model;
- constrained key/value settings;
- small structured JSON fields.

Do not create an unbounded configuration framework.

Document the selected strategy.

Requirements:

- settings are editable later by Admin;
- no real operational values are seeded now;
- sensitive credentials must never belong here.

---

# 6. Referential Actions

Historical order/audit information must be protected.

Use conservative referential actions.

Deleting an Order must not accidentally erase audit/payment/history/file
metadata unless an explicit lifecycle design justifies it.

Since normal business behavior prefers deactivation over destructive delete,
do not rely on cascade deletion as the normal cleanup mechanism.

Document FK delete behavior.

---

# 7. Naming

Continue established conventions:

- PascalCase Prisma models;
- camelCase Prisma fields;
- snake_case database tables/columns.

Reuse existing enums where appropriate.

---

# 8. Migration

Create one meaningful migration.

Suggested name:

payment_history_files_audit

or concise equivalent.

Use the established workflow:

1. Prisma validate;
2. create migration without applying;
3. inspect SQL;
4. confirm local database;
5. apply migration;
6. regenerate Prisma Client.

Target only:

maba_printing_dev

Do not reset the database.

---

# 9. SQL Review

Confirm migration contains only intended:

- PaymentMethod enum;
- PaymentStatus enum;
- payments table;
- order_status_history table;
- order_files table;
- admin_audit_logs table;
- business_settings representation;
- required keys / intrinsic unique constraints / foreign keys.

No unexpected:

- DROP;
- TRUNCATE;
- DELETE;
- alteration of previously applied migration files.

If destructive SQL appears unexpectedly:

STOP.

---

# 10. Database Verification

After migration verify:

1. migration status PASS;
2. new tables exist;
3. PaymentMethod values exact;
4. PaymentStatus values exact;
5. payment ↔ order cardinality matches the selected design;
6. payment amount uses integer-compatible Rupiah storage;
7. status history uses existing OrderStatus enum;
8. status history supports nullable initial fromStatus;
9. order file metadata stores no binary file content;
10. randomized storage key can be persisted;
11. admin audit metadata works if JSONB was selected;
12. business settings representation behaves as designed;
13. previous schema remains intact;
14. no unrelated objects were created.

Temporary synthetic probes may be used.

Remove probe rows afterwards.

---

# 11. Scope Protection

Do NOT implement:

- payment gateway;
- QRIS API;
- payment webhook;
- automatic PAID status;
- cash workflow;
- admin payment controller;
- order status transition service;
- file upload;
- storage adapter;
- download endpoint;
- cleanup scheduler;
- audit middleware;
- admin dashboard;
- business-settings API;
- seed data.

---

# 12. Existing Known Issues

KI-008:
out of scope.

KI-009:
do not alter previous migration files.

KI-010:
do not upgrade pg or Prisma adapter solely because of the current warning.

Wrong-type order extension invariant:
do not introduce a database trigger in this task.

It is expected to be enforced in the future service layer unless a later
architecture review establishes a compelling database-level reason.

---

# 13. Regression Verification

Required:

1. Prisma validate PASS.
2. Prisma generate PASS.
3. Migration create/apply PASS.
4. Migration status PASS.
5. Direct database inspection PASS.
6. Root typecheck PASS.
7. Root build PASS.
8. Root lint PASS.
9. Root format check PASS.
10. Existing Vitest tests PASS.
11. Existing Playwright test PASS.
12. API health PASS.
13. no DATABASE_URL exposure to web.
14. no destructive reset.
15. no application feature implemented outside schema scope.

---

# 14. Project Memory

After successful implementation update:

- PROJECT_STATE.md
- CURRENT_TASK.md
- CHANGELOG_AI.md
- KNOWN_ISSUES.md when necessary.

Record:

- enums/models introduced;
- Payment cardinality strategy;
- status-history actor strategy;
- file-metadata strategy;
- audit strategy;
- business-settings representation;
- referential actions;
- migration name;
- verification results.

Do not begin TASK-01.06.

---

## Completion Status

Use:

- COMPLETED
- BLOCKED
- FAILED_VERIFICATION
- AWAITING_APPROVAL

---

## Stop Condition

STOP after TASK-01.05.

Do not begin TASK-01.06.