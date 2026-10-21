# TASK-04.03 — Printing Request & Private File Upload

Phase: 04 — Order Submission, Private Files & Tracking

## Objective

Printing requests with optional private files, validated by content and
stored behind a StorageService with compensation.

## Source Requirements

PRD §8, §9, §26; Architecture §34–§37, §41; ADR-012/013/014; KI-005 (narrow
ignore rules).

## Scope

- Dependencies: multer (disk storage to a private temp dir), file-type
  (content detection incl. OOXML).
- Upload policy module (types, limits from UPLOAD_MAX_FILES /
  UPLOAD_MAX_FILE_SIZE with hard caps, aggregate 25 MiB).
- multipart handling on POST /orders: field `payload` (JSON) + `files`;
  temp files always removed; multer errors mapped to 400/413.
- File validation: extension allowlist, declared MIME agreement, detected
  type agreement → 415 otherwise; empty files rejected.
- StorageService + local adapter (`apps/api/.local-storage/`, exact
  .gitignore rule, key pattern `orders/<32 hex>`, traversal-proof path
  resolution, exclusive create, idempotent delete).
- Order service: store files before the transaction, delete them on any
  failure; OrderFile metadata rows inside the transaction.

## Business Rules

PRINTING needs a description or at least one file; files only for
PRINTING (400 otherwise); original filename sanitized (basename, no
control characters, ≤ 200 chars) and kept as display metadata.

## Security Requirements

No public download route; storage keys/paths never in DTOs or logs other
than key-only compensation failures; test storage in OS temp with guarded
cleanup; local storage refused in production.

## Exclusions

Download endpoint, retention job (deferred, known issue), virus scanning.

## Testing

Unit: policy, sanitizer, detection (real minimal PDF/PNG/JPEG/OOXML
samples, spoofed extension, HTML, ZIP, macro OOXML), storage adapter (key
validation, traversal, delete idempotency). DB: printing with files,
without files, size/count/type errors, files on non-printing types,
compensation when the DB write fails and when storage fails midway.

## Verification

No temp/storage leftovers after tests; API suites green.

## Project Memory

Limits, detection approach, storage layout, retention deferral.

## Stop Conditions

Approved formats cannot be validated by content.
