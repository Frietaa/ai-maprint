# PHASE-00 / TASK-00.09 — Unified Scripts & Workspace Orchestration

## Status

NOT_STARTED

## Objective

Finalize the root-level development and verification command strategy for the
MABA PRINTING monorepo.

This task must make common repository commands predictable from the project
root and resolve the remaining runtime/orchestration portion of KI-006.

---

## Current Workspaces

- @maba-printing/web
- @maba-printing/api
- @maba-printing/shared

Existing foundations include:

- TypeScript
- React + Vite
- Express
- shared package
- ESLint
- Prettier
- Vitest
- React Testing Library
- Supertest
- Playwright

---

## Primary Requirement

A developer should be able to clone/install the repository and run normal
development/verification commands from the root without manually guessing
workspace build order.

The dependency direction is:

packages/shared
      ↑
      ├── apps/web
      └── apps/api

Shared must be available before consumers require its built runtime output.

---

## KI-006

KI-006 is a primary concern of this task.

Current state:

- TypeScript project-reference ordering is already handled.
- Runtime/dev runners may resolve `@maba-printing/shared` through its built
  `dist/`.
- On a clean checkout, shared `dist/` may not exist yet.

Resolve the actual failure mode with the smallest maintainable solution.

Do not merely hide it with stale build output.

Verification must include a safe clean-output scenario.

If the failure mode is genuinely eliminated, mark KI-006 RESOLVED.

---

## Root Scripts

Provide coherent root commands for the repository's common workflows.

Expected capabilities include:

- development
- build
- typecheck
- lint
- format
- format:check
- test
- E2E testing

Exact script names may follow existing repository conventions.

Prefer standard npm workspace functionality and small explicit scripts.

Do not add a monorepo orchestrator merely for ordering.

---

## Development

Provide a practical root development workflow for web and API.

The solution should account for shared-package runtime availability.

Do not require developers to manually build shared in an undocumented sequence
before normal development.

Avoid adding heavy process-management dependencies unless clearly justified.

If concurrent web/API execution cannot be done cleanly without another
dependency, choose the smallest justified solution and document it.

Do not introduce production process management.

---

## Build

Root production build must be deterministic from a clean generated-output
state.

Required dependency order must be respected.

Do not rely on:

- existing dist directories;
- previous commands;
- undocumented manual steps.

---

## Typecheck

Root typecheck must correctly validate all workspaces.

Preserve the TypeScript project-reference strategy from TASK-00.05 unless a
genuine defect requires adjustment.

Do not weaken strictness.

---

## Lint / Format

Preserve the repository-wide ESLint and Prettier strategy established in
TASK-00.06.

Root commands must remain straightforward.

Do not redesign code-quality configuration unnecessarily.

---

## Tests

Root test workflow must execute the current automated test suites
appropriately.

Keep unit/component/API tests distinct from browser E2E when useful.

Do not require Playwright E2E to run implicitly on every lightweight unit-test
command unless there is a strong reason.

Provide an explicit root E2E capability.

---

## Playwright

Preserve Chromium-only Phase-00 scope.

Document that a new machine may require:

`npx playwright install chromium`

Do not automatically download browsers on every normal development command.

---

## Install Experience

A fresh developer workflow should be understandable.

Expected conceptual flow:

1. install dependencies;
2. perform any documented one-time Playwright browser setup;
3. run development/build/test commands from root.

Do not introduce hidden machine-specific assumptions.

---

## Dependencies

Prefer no new dependency.

A small development-only dependency may be introduced only when genuinely
needed for root development orchestration.

Do not add:

- Turborepo
- Nx
- Lerna
- production process managers
- CI tooling

---

## Scope Protection

Do NOT implement:

- business features;
- new API endpoints;
- database;
- Prisma;
- authentication;
- order/product/service functionality;
- admin functionality;
- payment;
- uploads;
- deployment;
- CI/CD.

This task is repository orchestration only.

---

## Clean-State Verification

This task MUST verify behavior without relying on stale generated output.

Safely remove/recreate generated artifacts as appropriate, including workspace
`dist` output.

Never remove source files or user data.

From that clean generated-output state verify the relevant root workflows.

---

## Required Verification

At minimum:

1. clean generated-output state established safely;
2. dependency install state valid;
3. root typecheck PASS;
4. root build PASS;
5. root lint PASS;
6. root format check PASS;
7. root unit/component/API test workflow PASS;
8. root E2E workflow PASS;
9. API production startup PASS;
10. `/api/v1/health` PASS;
11. web production output exists after build;
12. shared output exists before runtime consumers require it;
13. normal development workflow can start successfully;
14. no command depends on stale `dist`;
15. no scope creep;
16. no secrets introduced.

Stop all temporary development/server processes after verification.

Report actual test counts.

---

## Project Memory

After successful verification update:

- PROJECT_STATE.md
- CURRENT_TASK.md
- CHANGELOG_AI.md
- KNOWN_ISSUES.md

If KI-006 is resolved, record:

- why it is resolved;
- the command/orchestration strategy that removed the failure mode;
- clean-state evidence.

Do not start TASK-00.10.

---

## Completion Criteria

TASK-00.09 is complete when:

- common root commands are coherent;
- clean build works;
- development workflow works;
- test workflows work;
- shared runtime ordering is deterministic;
- KI-006 is resolved or a genuine blocker is reported;
- no stale build output is required;
- Project Memory is accurate.

---

## Stop Condition

STOP after TASK-00.09.

Do not begin TASK-00.10.

Final status:

- COMPLETED
- BLOCKED
- FAILED_VERIFICATION
- AWAITING_APPROVAL