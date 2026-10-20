# PHASE-00 / TASK-00.04 — Shared Package Foundation

## Status

NOT_STARTED

## Objective

Establish `packages/shared` as the shared TypeScript workspace for
MABA PRINTING.

The package will provide the technical foundation for code that may later be
shared safely between `apps/web` and `apps/api`.

This task must NOT implement business-domain models prematurely.

---

## Context

Completed foundations:

- TASK-00.01 — repository/workspaces
- TASK-00.02 — React + Vite + TypeScript frontend
- TASK-00.03 — Express + TypeScript backend

The monorepo architecture reserves:

`packages/shared`

for genuinely shared TypeScript code.

---

## Required Result

Create a private npm workspace package:

`@maba-printing/shared`

under:

`packages/shared`

Minimum expected structure:

packages/shared/
├── package.json
├── tsconfig.json
└── src/
└── index.ts

Remove `.gitkeep` once real files exist.

The package must be recognized by the root npm workspace.

---

## Scope

Implement only the minimum shared-package foundation.

The package must:

- use TypeScript;
- typecheck successfully;
- build successfully;
- expose a valid public entry point;
- be consumable by both frontend and backend in future tasks;
- contain no browser-only or Node-only assumptions unless required by the
  package foundation.

A tiny neutral exported value/type may be used only if needed to prove the
package works.

Prefer an empty or near-empty public API over inventing domain abstractions.

---

## Do Not Implement Yet

Do NOT create speculative shared definitions for:

- User
- Admin
- Member
- Product
- Service
- Location
- Order
- OrderItem
- Payment
- OrderStatus
- upload metadata
- API DTOs
- API response envelopes
- validation schemas
- Zod schemas
- authentication/session types
- database models

These belong to the phases/tasks that actually implement those domains.

Do not create placeholder architecture merely for future use.

---

## Dependencies

Do not add runtime dependencies unless technically necessary.

Use the existing repository TypeScript version where practical.

Do not add:

- Zod
- React
- Express
- Prisma
- database packages
- testing packages
- lint packages
- build frameworks
- monorepo orchestrators

If no additional dependency is required, prefer none.

---

## TypeScript

Use strict TypeScript behavior.

Keep configuration local and minimal.

Repository-wide TypeScript standardization belongs to TASK-00.05, so do not
prematurely refactor the frontend or backend TypeScript configurations.

The package's module/output strategy must remain compatible with the existing
frontend and backend architecture.

Do not weaken compiler safety.

---

## Package Interface

Configure `package.json` so the package has a clear public entry point.

Do not expose internal files unnecessarily.

Avoid complex conditional exports unless they are actually needed.

Do not publish the package.

---

## Existing Repository Protection

Before editing:

- inspect the repository;
- confirm TASK-00.03 is complete;
- inspect root workspace configuration;
- inspect `apps/web`;
- inspect `apps/api`;
- inspect `packages/shared`;
- inspect current Git state.

Do not modify frontend/backend application code merely to demonstrate the
shared package.

Do not begin TASK-00.05.

---

## Verification

Run applicable checks and report their real results.

Required:

1. `@maba-printing/shared` is recognized as an npm workspace.
2. Shared TypeScript typecheck passes.
3. Shared package build passes.
4. Public entry point is valid.
5. Root workspace remains valid.
6. Existing frontend typecheck/build still pass.
7. Existing backend typecheck/build still pass.
8. No speculative business/domain code was introduced.
9. No unexpected dependency was introduced.
10. No secrets were introduced.

Lint:

NOT_APPLICABLE if TASK-00.06 tooling does not exist.

Tests:

NOT_APPLICABLE if TASK-00.08 tooling does not exist.

Do not install lint/test tooling for this task.

---

## Project Memory

After successful verification update:

- PROJECT_STATE.md
- CURRENT_TASK.md
- CHANGELOG_AI.md

Update KNOWN_ISSUES.md only for a genuine issue.

Record material package/module decisions if they affect later tasks.

Do not mark TASK-00.05 as started.

---

## Completion Criteria

TASK-00.04 is complete when:

- `packages/shared` is a valid workspace package;
- TypeScript typecheck passes;
- build passes;
- its public entry point is valid;
- frontend/backend foundations remain healthy;
- no speculative domain implementation exists;
- Project Memory is accurate.

---

## Stop Condition

STOP after TASK-00.04.

Do not begin TASK-00.05.

Final status:

- COMPLETED
- BLOCKED
- FAILED_VERIFICATION
- AWAITING_APPROVAL
