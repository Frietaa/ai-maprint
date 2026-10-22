# PHASE 07 — Security, Reliability & Production Hardening

## Status

HUMAN ACCEPTED / COMPLETE (final project human review approved 2026-10-22; autonomous verification PASS in TASK-07.10; checkpoint commit 54ed7d8).

## Objective

Close the remaining application-level production-safety gaps without
choosing paid providers: a realistic threat model, a shared rate-limit
store, a website security-header policy, production-ready boundaries for
object storage, malware scanning and retention scheduling, structured
logging with a readiness probe, and backup/restore and migration
procedures — while keeping every provider decision with the owner.

---

## Source of Truth

1. docs/PRD_MABA_PRINTING_v1.0.md (frozen) — §9 (files), §16 (tracking
   rate limits), §26 (security), §27 (performance), §32 (MVP done)
2. docs/ARCHITECTURE_MABA_PRINTING_v1.0.md (frozen) — §20 (CSRF/CORS), §34
   (StorageService), §35 (upload pipeline), §37 (retention), §42 (security
   middleware), §43 (environment), §46 (logging and request IDs), §50
   (migration workflow), §53–§54 (deployment, health), §61 (approval
   gates), §63–§64 (production readiness, deferred providers)
3. docs/ai/DECISIONS.md — ADR-013, ADR-014, ADR-020, ADR-022 (hosting
   deferred)
4. MASTER_PROMPT, Project Memory, this file, the active task

---

## Planned Tasks

- TASK-07.01 — Threat Model, Security Gap Audit & Regression Baseline
- TASK-07.02 — Rate Limiting Production Strategy (KI-015)
- TASK-07.03 — Website Security Headers / CSP / Hosting Policy (KI-016)
- TASK-07.04 — Object Storage Adapter Boundary (KI-019)
- TASK-07.05 — Upload Malware-Scanning Boundary (KI-019)
- TASK-07.06 — Retention Scheduling Integration Boundary (KI-018)
- TASK-07.07 — Structured Logging, Readiness & Error Diagnostics
- TASK-07.08 — Backup / Restore / Migration Procedures
- TASK-07.09 — Security & Reliability Regression (incl. code splitting)
- TASK-07.10 — Phase 07 Independent Verification (no fixes)

---

## Key Decisions

### Rate limits (KI-015)

`RATE_LIMIT_STORE=memory|postgres`. The PostgreSQL store keeps one row per
limiter key and window in an additive infrastructure table
(`rate_limit_counters`), updated by a single atomic upsert, so limits are
shared by every API instance and survive restarts. Default: `postgres` in
production, `memory` elsewhere. No Redis or other vendor.

### Website headers (KI-016)

One provider-neutral policy module (`apps/web/security-headers.ts`)
builds the website's headers (CSP allowing only the site, the configured
API origin, https images and Google Identity Services; frame-ancestors
'none'; COOP same-origin-allow-popups; nosniff; Referrer-Policy;
Permissions-Policy; HSTS when served over HTTPS; immutable caching for
hashed assets). `vite preview` serves the production build with it; the
chosen host must reproduce it (docs/DEPLOYMENT.md).

### Storage and scanning (KI-019)

- `createStorageFromConfig` is the single place an adapter is chosen; a
  reusable contract test suite defines what any adapter must do. Only the
  local adapter exists; the production startup guard stays until a real
  private object store is configured.
- `UPLOAD_SCANNER=none|clamav`: a scanning step between content validation
  and storage. `clamav` speaks the clamd INSTREAM protocol over TCP (no
  dependency, self-hosted open source); infected files are rejected,
  scanner errors fail closed (503). Production refuses to start without an
  explicit UPLOAD_SCANNER value, so accepting "no scanning" is a
  deliberate operator decision.

### Retention scheduling (KI-018)

The cleanup command is the provider-neutral invocation contract (exit
codes, one JSON summary line, no file names or keys), guarded by a
PostgreSQL advisory lock against overlapping runs. The schedule itself is
configured with the chosen host.

### Observability

Structured JSON log lines (time, level, event, request ID, method, route
template — never the concrete path, which can contain a Public Order ID —
status, duration, error category); `LOG_LEVEL`. `GET /api/v1/health` stays
a dependency-free liveness probe; `GET /api/v1/readiness` checks the
database and storage configuration and answers 503 without details when
not ready.

### Schema

One additive infrastructure migration (rate_limit_counters). No domain
change.

---

## Out of Scope

Choosing or configuring hosting, managed PostgreSQL, object storage,
malware-scanning services, schedulers, DNS or paid monitoring; deployment.

## Stop Rule

Stop with AWAITING_APPROVAL or BLOCKED on: a needed domain migration, a
security reduction, test-DB/storage guard failure, secret exposure, or an
unfixable verification failure.
