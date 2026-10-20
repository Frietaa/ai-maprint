# PHASE-01 / TASK-01.04 — Order Schema

## Status

NOT_STARTED

## Objective

Implement the persistent order/request foundation for MABA PRINTING.

This task introduces:

- core order records;
- order items;
- type-specific request extensions where justified;
- customer snapshot fields;
- order lifecycle status;
- public tracking identifier foundation.

This is schema + migration work only.

Do not implement order APIs, submission flows, tracking pages, pricing logic,
WhatsApp behavior or admin workflows.

---

## Frozen Requirements

Orders may originate from:

- guest consumers;
- registered members.

Guest consumers do NOT require a users row.

Registered orders may reference a User.

Every order must preserve the customer's submitted information even if the
user profile later changes.

Orders may belong to a selected business Location.

The approved lifecycle is:

- SUBMITTED
- CONFIRMED
- IN_PROGRESS
- READY
- COMPLETED
- CANCELLED

Status-transition enforcement belongs to the application/service layer and
later database hardening where appropriate.

---

## Required Models / Enums

Implement the minimum approved persistence foundation for:

- Order
- OrderItem
- LaptopServiceRequest
- SoftwareInstallationRequest

Create required enums for:

- OrderStatus
- OrderType

Printing-specific extension should only be created if actual approved fields
require it.

Do not invent a PrintingRequest table merely for symmetry.

---

## OrderType

Represent the four approved order/request domains:

- PRINTING
- ATK
- LAPTOP_SERVICE
- SOFTWARE_INSTALLATION

Use exactly those domain concepts unless existing source-of-truth naming uses
a clearly established equivalent.

Do not introduce additional order types.

---

## OrderStatus

Create exactly:

- SUBMITTED
- CONFIRMED
- IN_PROGRESS
- READY
- COMPLETED
- CANCELLED

Default new orders to SUBMITTED.

Do not implement transition validation in this task.

---

## Order Model

Expected concepts:

- UUID internal id;
- unique publicId;
- nullable userId;
- nullable locationId;
- order type;
- customer snapshot;
- description / general request notes;
- requested completion/deadline;
- status;
- estimated total;
- final total;
- admin notes;
- completedAt;
- createdAt;
- updatedAt.

### Internal ID

Use UUID.

### Public ID

Public order tracking must not expose internal UUIDs.

Persist a unique random public identifier suitable for values such as:

`MP-2026-A7K92D`

Requirements:

- unique;
- not sequential;
- not derived directly from internal UUID;
- generation algorithm itself belongs to later service/application logic.

The database field must support the approved public-ID format.

Do not generate IDs in SQL unless Architecture explicitly requires it.

---

## Guest / Member Relationship

`userId` must be nullable.

Meaning:

- null = guest order;
- populated = registered member order.

Do not create guest users.

Use conservative referential behavior.

Historical orders must not disappear if an account is deactivated.

---

## Location Relationship

`locationId` may be nullable unless the approved source of truth explicitly
requires location selection for every order type.

Avoid cascade deletion.

Historical orders must remain meaningful if a location is later deactivated.

---

## Customer Snapshot

Persist the consumer-submitted identity/contact snapshot on the order.

Expected concepts include:

- customer name;
- customer contact / WhatsApp;
- optional customer email where appropriate.

These fields are independent of the linked User profile.

Do not normalize away the original submitted snapshot.

Admin must not overwrite original consumer fields in later workflows.

---

## Description / Deadline

Provide:

- general request description;
- requested completion/deadline field.

Choose nullable/required state according to approved requirements and actual
cross-order applicability.

Use timezone-aware timestamp storage for deadlines.

Do not implement validation such as "deadline must be future" here unless it
is an intrinsic database invariant justified now.

---

## Money

Store:

- estimatedTotal
- finalTotal

as nullable integer Rupiah.

They must not use floating-point types.

Final price is admin-controlled in later application logic.

Do not implement calculation behavior.

Non-negative money checks may be finalized in TASK-01.06.

---

## Admin Notes

Provide a separate nullable `adminNotes` field.

Do not create a mechanism that overwrites the original request description.

---

## completedAt

Nullable timestamp.

Do not automatically derive it from status at the database layer in this task.

Application logic later owns synchronization of COMPLETED status and timestamp.

---

## OrderItem

OrderItem represents catalog/item snapshots attached to an order.

Expected concepts:

- UUID id;
- order relationship;
- nullable product reference;
- nullable service reference where justified;
- item name snapshot;
- item description/details snapshot where useful;
- quantity;
- unit price snapshot;
- subtotal snapshot;
- timestamps if justified.

Do not force every order type to have OrderItems.

Examples:

- ATK likely uses product-backed items;
- service orders may or may not use service-backed items.

Historical order data must remain understandable if catalog records later
change or are deactivated.

Therefore store snapshot information rather than relying solely on live
catalog names/prices.

Do not implement calculation logic.

---

## Quantity

Use a positive integer representation.

Database enforcement of quantity > 0 may be finalized in TASK-01.06.

Do not add fractional quantities unless explicitly approved.

---

## Catalog References

OrderItem may reference existing Product and/or Service where useful.

References should be nullable where historical or custom request behavior
requires snapshots without a live catalog entity.

Use conservative referential actions.

Do not cascade-delete order history when catalog entries are deleted or
deactivated.

---

## LaptopServiceRequest

Create a type-specific extension linked one-to-one with Order.

Expected concepts:

- orderId;
- complaint/problem description;
- handover date;
- desired completion date;
- pickup/drop-off requirement;
- manually determined distance;
- manually determined delivery fee;
- address/details where needed.

Relevant frozen rule:

- pickup <= 5 km: free;
- > 5 km: Rp2,000 per additional km.

Do NOT implement the fee calculation yet.

No Maps API.

Distance and delivery fee may be nullable until Admin confirms them.

Do not create a separate delivery engine.

---

## SoftwareInstallationRequest

Create a one-to-one extension linked with Order.

Expected concepts:

- orderId;
- requested software / requirement description;
- license/customer responsibility note where persistence is actually useful.

Do not model illegal/cracked software.

The system only supports legal licensed/free/open-source software.

Do not implement licensing verification logic.

---

## Printing

Do not create a PrintingRequest extension unless there are approved printing-
specific persistent fields beyond:

- order description;
- file metadata (later task);
- general order fields.

The approved requirement intentionally avoids a mandatory detailed print-
options form.

---

## Relations

Allowed in this task:

User
  1 -> many Orders

Location
  1 -> many Orders

Order
  1 -> many OrderItems

Product
  1 -> many nullable OrderItem references

Service
  1 -> many nullable OrderItem references

Order
  1 -> optional LaptopServiceRequest

Order
  1 -> optional SoftwareInstallationRequest

Do not introduce:

- payments;
- order files;
- order status history;
- admin audit logs.

Those belong to TASK-01.05.

---

## Referential Actions

Historical order records are high-value data.

Prefer RESTRICT / SET NULL over destructive cascading where appropriate.

Deleting a User, Location, Product or Service must not erase order history.

One-to-one extension rows may use cascade delete from Order only if the design
is explicitly justified because they have no meaning without the parent order.

Document the decision.

---

## Naming

Continue:

- PascalCase Prisma models;
- camelCase Prisma fields;
- snake_case database names.

Remain consistent with existing migrations.

---

## Migration

Create one migration for the order foundation.

Suggested name:

order_foundation

Use review-before-apply workflow:

1. validate schema;
2. create migration without applying;
3. inspect SQL;
4. confirm local target;
5. apply migration.

No reset.

---

## SQL Review

Confirm migration includes only intended:

- order/order-status/order-type enums;
- orders table;
- order_items table;
- laptop_service_requests table;
- software_installation_requests table;
- approved indexes/constraints/FKs.

No DROP/TRUNCATE/DELETE.

No changes to previous migration SQL.

---

## Database Verification

After migration verify:

1. migration status PASS;
2. orders table exists;
3. order_items exists;
4. extension tables exist;
5. OrderStatus enum values exact;
6. OrderType values exact;
7. publicId uniqueness exists;
8. guest order can exist with null userId;
9. member order can reference a User;
10. customer snapshot fields persist independently;
11. nullable catalog references behave correctly;
12. composite/one-to-one extension uniqueness is enforced;
13. order history survives safe parent-reference scenarios according to chosen
    referential actions;
14. money fields are integer-compatible;
15. no unrelated tables were added.

Use synthetic temporary probes where useful.

Remove probe data afterwards.

---

## Scope Protection

Do NOT implement:

- order routes/controllers/services;
- status-transition logic;
- public tracking endpoint;
- WhatsApp links;
- payment;
- order status history;
- order files/upload;
- admin workflows;
- price calculation;
- pickup fee calculation;
- frontend order forms;
- auth changes;
- seed data.

---

## Existing Known Issues

KI-008:
out of scope.

KI-009:
do not modify previously applied migration files.

Catalog hardening deferred to TASK-01.06 remains deferred.

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
11. Existing Playwright test PASS.
12. API health PASS.
13. No DATABASE_URL exposure.
14. No destructive reset.
15. No out-of-scope feature implementation.

---

## Project Memory

Record:

- enums/models introduced;
- snapshot strategy;
- publicId persistence decision;
- OrderItem reference strategy;
- type-specific extension strategy;
- referential actions;
- migration name;
- verification results;
- any new known issues.

Do not begin TASK-01.05.

---

## Completion Status

Use:

- COMPLETED
- BLOCKED
- FAILED_VERIFICATION
- AWAITING_APPROVAL

---

## Stop Condition

STOP after TASK-01.04.

Do not begin TASK-01.05.