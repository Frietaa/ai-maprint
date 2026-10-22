# PHASE 05 — Admin Operations & Order Management

## Status

ACCEPTED / COMPLETE (human-approved 2026-10-22; verification PASS)

## Objective

Give authorized ADMIN users a dedicated, secure operational area: sign in
at `/admin/login`, see a dashboard and the order queue, inspect full order
detail, move orders through the approved status machine, set pricing and
internal notes, confirm payments manually, download customer documents,
manage products, services, locations and business settings — with every
sensitive mutation recorded in AdminAuditLog. A retention command deletes
documents 30 days after an order is completed.

---

## Source of Truth

1. docs/PRD_MABA_PRINTING_v1.0.md (frozen) — §11 (pickup fee), §13–§15
   (orders, statuses, history), §18 (payment), §19 (locations), §20 (Admin
   panel), §21 (audit trail), §22 (business configuration), §26 (security)
2. docs/ARCHITECTURE_MABA_PRINTING_v1.0.md (frozen) — §8 (admin routes), §13
   (admin endpoints), §19 (authorization), §27 (deactivation), §29 (status
   transitions), §31 (pickup fee), §32 (pricing), §33 (transactions), §34
   and §37 (storage, retention), §39 (payment), §41 (file download), §45
3. docs/ai/DECISIONS.md — ADR-013 (retention), ADR-014 (private files),
   ADR-017 (Admin model: multiple Admins, equal permissions, audited)
4. docs/ai/MASTER_PROMPT.md, Project Memory, this file, the active task

---

## Planned Tasks

- TASK-05.01 — Admin Access & Authorization Foundation
- TASK-05.02 — Admin Dashboard & Order Queue
- TASK-05.03 — Order Detail & Status Transitions
- TASK-05.04 — Pricing & Admin Notes
- TASK-05.05 — Payment Confirmation
- TASK-05.06 — Authorized Private File Access & Retention Foundation
- TASK-05.07 — Catalog, Services & Locations Management
- TASK-05.08 — Business Settings Management
- TASK-05.09 — Admin Security, Audit & E2E
- TASK-05.10 — Phase 05 Final Verification (independent; no fixes)

---

## Key Decisions

### Roles and access

- Roles stay MEMBER and ADMIN; all Admins are equal (ADR-017).
- Every `/api/v1/admin/*` route: resolvePrincipal (role and active state
  re-read from the database) → `requireRole('ADMIN')`: 401 signed out, 403
  MEMBER. Unsafe methods need the Phase-03 CSRF token. No separate Admin
  token, cookie or session store.
- Admin login UX `/admin/login` reuses `POST /api/v1/auth/login` (email +
  password only; Google is not offered for Admin). The UI admits only an
  ADMIN principal; a MEMBER who signs in there is told the area is for
  Admins (the backend remains the boundary).
- Provisioning: `npm run admin:create` (operator CLI on DATABASE_URL) with
  ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD from the environment; creates
  a new ADMIN (Argon2id, normalized email); an existing MEMBER is promoted
  only with `--promote`; an existing ADMIN is left unchanged; nothing is
  printed but the outcome. No HTTP endpoint creates or promotes Admins.

### Orders

- Queue: `GET /admin/orders?page&pageSize&status&type&locationId&
  paymentStatus&publicId` (bounded pagination, newest first, exact public
  ID). Dashboard: database group/count queries + recent orders.
- Detail: full operational DTO (snapshot, items, extensions, pricing,
  payment, admin notes, file metadata with IDs for download, timeline with
  Admin actor names) — never password hashes, Google IDs, sessions or
  storage keys/paths.
- Commands (purpose-specific, strict bodies):
  - `PATCH …/status {fromStatus, toStatus}` — approved machine only
    (SUBMITTED → CONFIRMED|CANCELLED, CONFIRMED → IN_PROGRESS|CANCELLED,
    IN_PROGRESS → READY|CANCELLED, READY → COMPLETED); conditional update
    on the expected current status (409 when stale); completedAt set on
    COMPLETED; history row + audit in one transaction.
  - `PATCH …/pricing {estimatedTotal?, finalTotal?, distanceKm?}` — whole
    Rupiah within INTEGER; distanceKm only for LAPTOP_SERVICE PICKUP, the
    server computes pickupFee (≤ 5 km free; else Rp2.000 per additional
    started km = ceil(distance − 5) × 2000). Item snapshots never change.
  - `PATCH …/notes {adminNotes}` — ≤ 5000 chars, plain text; audit records
    added/changed/cleared, not the text.
  - `PATCH …/payment {method, status, amount}` — one Payment per order,
    created lazily; confirmedById/At set by the server when status becomes
    PAID (unchanged if it already was PAID), cleared when it leaves PAID.
    Pricing never implies payment.
- Terminal orders (COMPLETED, CANCELLED) keep everything; nothing is
  deleted.

### Files and retention

- `GET /admin/orders/:publicId/files/:fileId/download`: file must belong to
  the order and not be deleted; streamed from StorageService with
  `Content-Disposition: attachment` (Express/`content-disposition`
  encoding, CR/LF impossible), the stored MIME type, nosniff, no-store;
  audited `ORDER_FILE_DOWNLOADED`; separate download rate limit.
- Retention: `cleanupExpiredOrderFiles({db, storage, now})` deletes files of
  COMPLETED orders whose completedAt is at least 30 days old, sets
  deletedAt only after successful (or confirmed-missing) deletion, skips
  deleted rows, idempotent. CLI `npm run files:cleanup` (dev storage). No
  scheduler (deployment-owned) → KI-018 becomes MITIGATED.

### Catalog, locations, settings

- Product and service categories, products, services, locations: list
  (including inactive), create, update; deactivation/reactivation through
  `isActive` — no hard deletes. Availability (AVAILABLE/UNAVAILABLE) stays
  separate from isActive. Service FIXED requires a price. Location opening
  hours via a structured editor, validated and stored in the existing JSON
  shape. Per-location service availability via `PUT
  /admin/locations/:id/services/:serviceId {isAvailable}`.
- KI-013 is not "fixed" by schema; the Admin services page warns that
  public service pages group categories by name.
- `GET/PATCH /admin/settings` on the singleton id = 1 (created if missing);
  images as https URLs or root-relative paths; social links http/https;
  bounded text. Public settings reflect changes immediately.

### Audit

AdminAuditLog rows (actor = current ADMIN, stable action codes and entity
types, small before/after metadata, never secrets, passwords, file
contents or note text) are written in the same transaction as the change.
No endpoint edits or deletes audit rows.

### Human-approved business rule — laptop pickup fee (2026-10-22)

- distance ≤ 5 km → Rp0
- distance > 5 km → ceil(distanceKm − 5) × Rp2,000
- each started additional kilometre is charged as one full additional
  kilometre
- no Maps API; the Admin supplies/records the operational distance

Accepted for the MVP unless a future explicit business decision changes
it (interpretation of PRD §11; the frozen PRD is not edited).

### Schema

No migration expected (all fields exist since Phase 01).

---

## Out of Scope

Customer payment UI, payment gateway, notifications, roles beyond
MEMBER/ADMIN, Admin Google login, image upload for logo/QRIS, scheduler
setup, production storage, deployment, reports/analytics.

## Stop Rule

Stop with AWAITING_APPROVAL or BLOCKED on: a needed migration, unsafe file
access, destructive change to non-test data, test-DB/storage guard failure,
material PRD/Architecture conflict, secret or private-data exposure, or an
unfixable blocking verification failure.

Do not begin Phase 06.
