# PHASE-01 / TASK-01.01 — PostgreSQL & Prisma Foundation

## Status

NOT_STARTED

## Objective

Introduce the PostgreSQL + Prisma persistence foundation for MABA PRINTING
without implementing the business-domain schema yet.

This task establishes database tooling and configuration only.

---

## Required Outcome

Establish:

1. Prisma in the API/backend workspace;
2. PostgreSQL as the configured database provider;
3. Prisma schema foundation;
4. safe DATABASE_URL environment handling;
5. Prisma Client generation capability;
6. database-related scripts;
7. documented local database prerequisites/workflow.

---

## Ownership

Prisma belongs to the backend/API side of the monorepo.

Do not introduce Prisma into:

- apps/web;
- packages/shared.

Frontend and shared code must not import Prisma Client.

---

## Prisma Schema

Create the minimum valid Prisma schema foundation.

Provider:

PostgreSQL

The schema may contain only infrastructure required for Prisma to validate
and generate.

Do NOT implement the complete business-domain models in TASK-01.01.

Those belong to later Phase-01 tasks.

---

## Prisma Version

Use a current stable Prisma version compatible with the repository's existing
Node.js and TypeScript environment.

Do not blindly choose a major version from memory.

Inspect compatibility before installation.

Record the chosen version in Project Memory.

---

## Environment

DATABASE_URL is server-only.

It belongs in the API environment configuration.

Requirements:

- no real database credential committed;
- apps/web must never receive DATABASE_URL;
- root `.env.example` remains canonical inventory;
- apps/api/.env.example documents DATABASE_URL safely;
- Prisma must receive DATABASE_URL through the approved backend environment
  strategy.

Do not make unrelated future secrets mandatory.

---

## PostgreSQL

Do not install or reconfigure PostgreSQL automatically at the OS level.

Inspect whether a usable local PostgreSQL instance is available.

If no database instance is available:

- tooling/schema validation/generation should still be completed where
  possible;
- report database-dependent verification as BLOCKED or NOT_RUN accurately;
- do not replace PostgreSQL with SQLite;
- do not silently introduce Docker unless explicitly approved.

---

## Prisma Client

Establish a safe backend-side Prisma Client foundation.

Avoid creating multiple Prisma Client instances accidentally during
development.

However, do not overbuild repository/service layers before real consumers
exist.

---

## Scripts

Add useful database commands using clear naming.

Expected capabilities may include:

- Prisma validation;
- client generation;
- development migration;
- Prisma Studio where appropriate.

Do not create destructive reset commands as the default developer workflow.

Final command names should fit the existing root/workspace strategy.

---

## Migration

Do NOT create the full business migration in this task.

If the empty/foundation Prisma schema does not justify a migration, do not
create a meaningless migration solely to satisfy the task.

Real schema migrations begin with the domain-model tasks.

---

## Dependencies

Install only Prisma/database dependencies required by this foundation.

Do not install:

- authentication libraries;
- Redis;
- database GUI applications;
- Docker tooling;
- unrelated ORMs;
- application feature dependencies.

---

## Existing Foundation

Preserve:

- API ESM/NodeNext behavior;
- health endpoint;
- web foundation;
- shared package;
- strict TypeScript;
- lint/format strategy;
- tests;
- root orchestration.

Do not regress Phase 00.

---

## Verification

Required where technically possible:

1. npm dependency tree valid.
2. Prisma CLI available.
3. Prisma schema validation PASS.
4. Prisma Client generation PASS.
5. API typecheck PASS.
6. API build PASS.
7. Root typecheck PASS.
8. Root build PASS.
9. Root lint PASS.
10. Root format check PASS.
11. Existing Vitest tests PASS.
12. Existing Playwright smoke test PASS.
13. API health endpoint remains PASS.
14. DATABASE_URL is not exposed to web.
15. No real database credentials are committed.
16. No business-domain schema was prematurely implemented.

If a usable PostgreSQL instance exists, additionally verify connectivity in a
non-destructive manner.

If it does not exist, report that accurately instead of manufacturing a PASS.

---

## Human Approval Boundary

STOP and request approval if the task would require:

- OS-level PostgreSQL installation;
- Docker installation/configuration;
- destructive database operation;
- changing frozen Architecture decisions;
- introducing another database provider.

---

## Project Memory

After implementation update:

- PROJECT_STATE.md
- CURRENT_TASK.md
- CHANGELOG_AI.md
- KNOWN_ISSUES.md when necessary.

Record:

- Prisma version;
- database provider;
- environment strategy;
- scripts;
- whether PostgreSQL connectivity was actually verified;
- any environment prerequisite/blocker.

Do not begin TASK-01.02.

---

## Completion Status

Use:

- COMPLETED
- BLOCKED
- FAILED_VERIFICATION
- AWAITING_APPROVAL

A missing local PostgreSQL instance does not justify pretending connectivity
was verified.

---

## Stop Condition

STOP after TASK-01.01.

Do not begin TASK-01.02.