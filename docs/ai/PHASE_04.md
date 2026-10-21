# PHASE 04 — Order Submission, Private Files & Tracking

## Status

ACCEPTED / COMPLETE (human-approved 2026-10-21; verification PASS)

## Objective

A consumer — Guest or signed-in MEMBER — can submit one of the four approved
request types (Printing, ATK, Laptop Service, Software Installation), receives
a high-entropy Public Order ID and a receipt, may continue the discussion via
an order-specific WhatsApp deep link, can later track the order at
`/track-order`, and — as a MEMBER — sees their own order history and detail.

New orders stay `SUBMITTED`; Admin processing (status changes, pricing,
payment, file download, retention cleanup) belongs to a later phase.

---

## Source of Truth

1. docs/PRD_MABA_PRINTING_v1.0.md (frozen)
2. docs/ARCHITECTURE_MABA_PRINTING_v1.0.md (frozen)
3. docs/ai/DECISIONS.md (ADR-005 guest orders, ADR-009 status, ADR-012
   upload, ADR-013 retention, ADR-014 private files)
4. docs/ai/MASTER_PROMPT.md
5. Project Memory
6. This phase specification
7. The active TASK_04.xx.md

Relevant frozen requirements: PRD §8–§17 (business lines, files, unified
order, status labels, history, tracking, WhatsApp), §19, §26, §28;
Architecture §8 (routes), §13 (endpoints), §22 (IDs), §23 (time), §24
(money), §28–§38 (order aggregate, snapshots, pickup fee, pricing,
transactions, file storage, upload pipeline, compensation, retention,
WhatsApp), §40–§41 (tracking, download), §42, §47.

---

## Planned Tasks

- TASK-04.01 — Order Architecture, Contracts & Persistence Access
- TASK-04.02 — Core Order Submission & Public Order IDs
- TASK-04.03 — Printing Request & Private File Upload
- TASK-04.04 — ATK Order Request
- TASK-04.05 — Laptop Service Request
- TASK-04.06 — Software Installation Request
- TASK-04.07 — Guest Tracking & Member Order History
- TASK-04.08 — Order Forms, Receipt & WhatsApp Handoff
- TASK-04.09 — Order Security, Validation & E2E
- TASK-04.10 — Phase 04 Final Verification (independent; no fixes)

---

## Key Decisions

### Schema

Zero migrations: the Phase-01 schema (Order, OrderItem,
LaptopServiceRequest, SoftwareInstallationRequest, OrderFile,
OrderStatusHistory) already models everything. No PrintingRequest table,
no file-type enum, no print-option columns.

### API

```text
POST /api/v1/orders                      Guest or MEMBER; CSRF; rate-limited
GET  /api/v1/orders/track/:publicId      public, exact ID, rate-limited
GET  /api/v1/account/orders?page&pageSize   MEMBER only, newest first
GET  /api/v1/account/orders/:publicId    MEMBER only, own orders (else 404)
```

One `POST /orders` endpoint with a discriminated body on `type`:
`application/json` for every type, or `multipart/form-data` (field
`payload` = the same JSON, field `files` = documents) — files are accepted
for PRINTING only. Strict validation rejects client-supplied `userId`,
`status`, `publicId`, prices, totals, `adminNotes`, `role`, distance/fee.

### Identity

- Signed-in MEMBER → `userId` set; history actor = the member.
- Guest → `userId` null; history actor null.
- Signed-in ADMIN → treated like a guest (not linked, no member-history
  semantics); the admin experience is a later phase.
- The customer snapshot (name, WhatsApp, optional email) is always stored on
  the order and never derived from or synced with the profile.

### Public Order ID

`MP-<YYYY>-<13 chars>` — year in Asia/Jakarta, 13 Crockford base-32
characters (no I, L, O, U) from `crypto.randomBytes` = 65 random bits;
21 characters, fits `varchar(32)`. Unique index is the final defense;
bounded retry (5 attempts) on an actual collision; the generator is
injectable for tests. One parser (trim + uppercase + strict pattern) for
tracking and member detail; no partial or wildcard lookups.

### Status labels (PRD §14)

SUBMITTED "Menunggu Konfirmasi", CONFIRMED "Pesanan Diterima",
IN_PROGRESS "Sedang Dikerjakan", READY "Siap/Selesai", COMPLETED
"Pesanan Selesai", CANCELLED "Dibatalkan".

### Order rules

- Common: customer name ≤ 120, WhatsApp/contact (8–15 digits, ≤ 20 chars,
  same rule as the profile), optional email ≤ 254 (normalized), optional
  active location, requested completion (future instant, ≤ 1 year ahead;
  required except for ATK), description ≤ 5000.
- PRINTING: files are optional (PRD §8 "optional files") but a request
  needs a description or at least one file.
- ATK: 1–20 distinct products, quantity 1–99; every product active, in an
  active category and AVAILABLE (else 409); server snapshots name,
  description, unit price, subtotal; `estimatedTotal` = sum, bounded to
  PostgreSQL INTEGER; `finalTotal` stays null.
- LAPTOP_SERVICE: complaint, `DROP_OFF` | `PICKUP`, optional future handover
  time, pickup address required for PICKUP and rejected for DROP_OFF;
  distance and pickup fee stay null (Admin later; no Maps API).
- SOFTWARE_INSTALLATION: software name, optional requirements,
  `licenseAcknowledged: true` required; the server stores one canonical
  license statement in `license_note`.
- Service catalog rows are not linked (KI-013; no hardcoded IDs).
- Order + items + type extension + files metadata + initial history
  (`null → SUBMITTED`) are written in one transaction.

### Files

- Types (central policy): PDF, DOCX, PPTX, XLSX, JPG/JPEG, PNG. Extension,
  declared MIME (when meaningful) and detected content (`file-type`: magic
  bytes; OOXML via `[Content_Types].xml`) must agree; stored MIME is the
  detected canonical type.
- Limits: `UPLOAD_MAX_FILES` (default 5, max 10), `UPLOAD_MAX_FILE_SIZE`
  (default 10 MiB, max 25 MiB), aggregate 25 MiB, payload field ≤ 64 kB,
  few fields/parts. multer streams to a private temp directory (no RAM
  buffering); temp files are always deleted after the request.
- Errors: 413 size/aggregate, 415 type, 400 malformed/too many files.
- `StorageService` (put / download / delete / exists); local adapter rooted
  at `apps/api/.local-storage/` (exact ignore rule, not served anywhere);
  keys `orders/<32 hex>` from the CSPRNG; original filenames are sanitized
  display metadata only. `STORAGE_PROVIDER` accepts only `local`, which is
  refused in production (object storage is chosen at deployment).
- Compensation: files are stored before the DB transaction; any failure
  afterwards deletes them; a failed deletion is logged (keys only).
- Retention (delete 30 days after COMPLETED) is deferred: no completion
  workflow exists yet (known issue).

### Privacy of reads

- Tracking DTO: public ID, type, status, created/requested times, location
  name, timeline (status + time). No customer data, description, files,
  prices, internal IDs or actors.
- Member detail: own snapshot, description, location, items, type details,
  totals, file names/MIME/size, timeline — never storage keys, admin notes
  or actor IDs. Lookups use `publicId AND userId`.

### Security

CSRF on POST /orders (guest ordering included; fetching the token creates an
anonymous session only then), separate rate limits for submission and
tracking (in-process store, KI-015), bounded JSON (64 kB on /orders, 10 kB
elsewhere), Phase-03 headers, request IDs and safe logs; never log file
contents or names.

### Web

Order forms on `/printing`, `/atk`, `/laptop-service`,
`/software-installation` (React Hook Form), receipt with copyable Public
Order ID, tracking link and WhatsApp deep link built from
`BusinessSettings.whatsappNumber`, `/track-order`, `/account/orders`,
`/account/orders/:publicId`. Members get safe prefill; editing the order
snapshot never changes the profile.

---

## Out of Scope

Admin processing, status transitions, pricing/final total, payment, file
download routes, retention job, notifications, WhatsApp API, Maps, stock
reservation, carts/checkout, CAPTCHA, deployment.

## Stop Rule

Stop with AWAITING_APPROVAL or BLOCKED on: a needed migration, unsafe file
validation, destructive change to a non-test database, test-DB/test-storage
guard failure, material PRD/Architecture conflict, suspected secret or
private-file exposure, or an unfixable blocking verification failure.

Do not begin Phase 05.
