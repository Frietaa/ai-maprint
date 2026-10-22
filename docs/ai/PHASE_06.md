# PHASE 06 — Remaining MVP Experience & Customer Payment UX

## Status

AUTONOMOUSLY COMPLETED / VERIFIED — TASK-06.10 verification PASS
(2026-10-22); checkpoint commit "feat: complete Phase 06 customer
experience" (baseline aca6d83). Not human-accepted.

## Objective

Close the remaining customer-facing MVP gaps without turning MABA PRINTING
into an e-commerce or payment-gateway platform: show the owner-configured
static QRIS and the customer's own payment state safely, stop a retried
submission from creating a duplicate order (KI-020), bound the public
catalog responses (KI-012), harden the service business-line mapping
(KI-013) and audit the whole customer experience (errors, accessibility,
journeys).

---

## Source of Truth

1. docs/PRD_MABA_PRINTING_v1.0.md (frozen) — §8–§18 (orders, tracking,
   WhatsApp, payment), §22 (QRIS image owner-configurable), §23 (UX),
   §27 (pagination, accessibility), §28 (error handling)
2. docs/ARCHITECTURE_MABA_PRINTING_v1.0.md (frozen) — §14 (collection
   meta), §33 (transactions), §36 (storage compensation), §39 (payment),
   §40 (tracking), §47 (pagination), §50 (migration workflow), §61
   (approval gates: destructive migrations only)
3. docs/ai/DECISIONS.md — ADR-008 (manual payment), ADR-014, ADR-020,
   ADR-023 (QRIS asset owner-provided); human-approved pickup-fee rule
   (2026-10-22)
4. MASTER_PROMPT, Project Memory, this file, the active task

---

## Planned Tasks

- TASK-06.01 — Remaining MVP Gap Audit
- TASK-06.02 — Customer Payment Information Contract
- TASK-06.03 — Static QRIS Customer Experience
- TASK-06.04 — Payment Status Customer Experience
- TASK-06.05 — Order Idempotency / Duplicate-Submission Protection
- TASK-06.06 — Public Catalog Pagination
- TASK-06.07 — Service Business-Line Mapping Hardening
- TASK-06.08 — Customer UX / Accessibility / Error Hardening
- TASK-06.09 — Full MVP Integration E2E
- TASK-06.10 — Phase 06 Independent Verification (no fixes)

---

## Key Decisions

### Payment (KI-021)

- `GET /public/settings` gains `qrisImageRef`, published only when the
  stored reference is safe for a browser (absolute https URL or a
  root-relative path of the website); anything else (legacy storage keys,
  http, data:, javascript:) is published as null. A static QRIS is public
  business information (it is displayed at the counter), not a secret.
- The QRIS is shown on the submission receipt, on the member's own order
  detail (while the order is not PAID / not cancelled) and as general
  payment information on the tracking page. Copy states that payment is
  confirmed manually by the Admin and that the status does not change
  automatically. No upload for the QRIS image (owner provides a hosted URL
  or a website path); no gateway, webhook or polling.
- The member's own order detail gains `payment: {method, status, amount} |
  null` — never the payment ID, confirming Admin or confirmation time.
  Guest tracking stays privacy-minimal (no payment state, PRD §16).

### Duplicate submissions (KI-020)

- The web client sends an `Idempotency-Key` header (random UUID per
  distinct submission; a retry of the identical form reuses it).
- Server-side record in a new additive infrastructure table
  `order_submission_keys` (key hash, order, owner, request fingerprint,
  created_at) written in the order transaction. A repeat with the same key
  and the same request returns the original receipt (200,
  `Idempotent-Replayed: true`) without storing files again; a different
  request or another owner → 409. Concurrent duplicates are serialized by
  the primary key. Keys expire after 24 hours.
- Justification for the migration: no existing column can hold the key
  without overloading domain data; the table is additive, non-destructive,
  holds no customer content and no business rule (Architecture §61 requires
  approval only for destructive migrations). Applied migrations unchanged.

### Catalog pagination (KI-012)

- `GET /products` and `GET /services` accept `page` and `pageSize`
  (default 100, max 100) and return `meta {count, page, pageSize, total,
  totalPages}`; every response and query is bounded. The website keeps the
  current whole-catalog UX by reading the pages in sequence (bounded to 20
  pages). `GET /locations` stays unpaginated (a handful of physical
  locations).

### Service business lines (KI-013)

- The keyword mapping moves to `packages/shared` (one definition). The
  Admin services page shows the business line each category maps to and
  warns when a category maps to none. A schema-level business-line column
  remains the clean fix and needs human approval (domain model change).

### Schema

One additive infrastructure migration (order_submission_keys). No domain
model change.

---

## Out of Scope

Payment gateway, webhooks, automatic payment verification, refunds,
installments, customer "I have paid" uploads, QRIS image upload,
notifications, Maps, new roles.

## Stop Rule

Stop with AWAITING_APPROVAL or BLOCKED on: a needed domain migration,
unsafe file access, destructive change to non-test data, test-DB/storage
guard failure, material PRD/Architecture conflict, secret or private-data
exposure, or an unfixable verification failure.
