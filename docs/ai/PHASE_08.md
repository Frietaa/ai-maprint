# PHASE 08 — Production Infrastructure & Deployment Readiness

## Status

AUTONOMOUSLY COMPLETED / VERIFIED — TASK-08.10 verification PASS
(2026-10-22); checkpoint commit "chore: complete Phase 08 deployment
readiness" (baseline 54ed7d8). Not human-accepted. Deployment-ready;
production provider/account configuration pending.

## Objective

Prepare the repository for a real production deployment while every
provider, account, domain and cost decision stays with the owner: a
deployment decision package, a definitive environment contract validated at
startup, production build/start/migration/operator commands, an API
container image, production database guidance, CI, a read-only smoke test
and rollback procedures. Nothing is deployed and nothing is bought.

---

## Source of Truth

1. docs/PRD_MABA_PRINTING_v1.0.md (frozen) — §26, §27, §32 (production DB,
   deployment and smoke tests are part of the MVP definition of done)
2. docs/ARCHITECTURE_MABA_PRINTING_v1.0.md (frozen) — §43 (environment),
   §50 (migrations), §53 (deployment topology, same-site preference), §54
   (health), §55 (CI, GitHub Actions allowed), §61 (approval gates), §63
   (production readiness), §64 (deferred providers)
3. docs/ai/DECISIONS.md — ADR-020, ADR-022 (hosting deferred)
4. MASTER_PROMPT, Project Memory, this file, the active task

---

## Planned Tasks

- TASK-08.01 — Deployment Architecture Decision Package
- TASK-08.02 — Production Environment Contract (incl. KI-022)
- TASK-08.03 — Build / Start / Migration / Operator Commands
- TASK-08.04 — API Container Image
- TASK-08.05 — Production Database Readiness
- TASK-08.06 — Provider Integration Status (storage, scheduler, scanner)
- TASK-08.07 — CI Pipeline
- TASK-08.08 — Deployment Smoke & Rollback Procedures
- TASK-08.09 — Production Readiness Audit & Release Checklist
- TASK-08.10 — Phase 08 Independent Verification (no fixes)

---

## Key Decisions

- **No provider is chosen** (KI-001, ADR-022). The decision package lists
  options and criteria; the owner decides. Final status can at best be
  DEPLOYMENT_READY_PENDING_PROVIDER.
- **Topology:** static website + Node API + managed PostgreSQL + private
  object storage, website and API on the same site (e.g. `www.` and
  `api.` of one domain). Cross-site remains possible through explicit
  `SESSION_COOKIE_SAMESITE=none` (Secure only), documented as discouraged.
- **Container:** one multi-stage Dockerfile for the API (most Node hosts
  accept containers; non-root, production dependencies only, no secrets,
  healthcheck on /api/v1/health). The website is static files — no image.
- **Migrations:** applied by a release step with `prisma migrate deploy`
  (the image build stage or CI), never at API start-up and never `migrate
  dev`.
- **CI:** GitHub Actions (Architecture §55 allows it) with an ephemeral
  PostgreSQL service and synthetic secrets; `npm run verify` is the local
  equivalent.
- **Smoke tests:** read-only (`scripts/smoke.mjs`); no orders, accounts or
  uploads in production.

## Out of Scope

Choosing or paying for providers, DNS, real secrets, actual deployment,
creating production databases or buckets.

## Stop Rule

AWAITING_APPROVAL only for decisions that cannot be deferred without
blocking unrelated work; BLOCKED on verification failure or secret
exposure.
