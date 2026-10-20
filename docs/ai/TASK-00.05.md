# PHASE-00 / TASK-00.05 — TypeScript Configuration

## Status

NOT_STARTED

## Objective

Standardize TypeScript configuration across the MABA PRINTING monorepo and
establish a correct dependency relationship between the shared package and
its future consumers.

This task should reduce duplicated compiler policy without overengineering
the monorepo.

It must also address KI-006 at the TypeScript configuration level where
appropriate.

---

## Current Workspaces

- apps/web
- apps/api
- packages/shared

All currently typecheck and build successfully.

Known issue:

KI-006 — root workspace execution currently reaches `shared` after `api` and
`web`, while future consumers may depend on shared build output.

---

## Required Outcome

Establish a maintainable TypeScript configuration strategy with:

1. a repository-level shared/base TypeScript configuration where useful;
2. strict TypeScript behavior across all workspaces;
3. workspace-specific settings only where environments genuinely differ;
4. a valid dependency model for `packages/shared`;
5. no regression in frontend, backend or shared builds.

Prefer TypeScript-native mechanisms over custom scripting.

---

## Configuration Strategy

Inspect the existing TypeScript configuration before deciding the exact
implementation.

A root/base configuration may contain compiler policy that is genuinely
common, such as appropriate strictness and consistency rules.

Do NOT blindly move every compiler option into the root.

The environments are different:

- web: browser + React + Vite
- api: Node.js + ESM
- shared: environment-neutral TypeScript

Preserve environment-specific configuration where appropriate.

---

## Strictness

Strict TypeScript behavior is required.

Make strictness explicit rather than relying only on version defaults.

Do not weaken existing compiler safety.

Do not use broad suppressions to make checks pass.

Avoid introducing:

- `skipLibCheck` changes without justification;
- broad `any`;
- `@ts-ignore`;
- unnecessary type assertions.

Existing generated configuration may be adjusted when required by the
standardized strategy.

---

## Shared Package Dependency Model

Investigate KI-006.

The intended dependency direction is:

packages/shared
↑
├── apps/web
└── apps/api

Never the reverse.

Choose the simplest TypeScript-native configuration that allows future
workspace consumers to depend on shared safely.

TypeScript project references may be used if they provide a clear benefit.

If project references are used:

- configure them correctly;
- avoid circular references;
- shared must not reference web or api;
- composite/declaration settings should be added only where technically
  required;
- verify clean builds from repository state.

Do not add fake imports to web/api merely to demonstrate dependency.

Do not add business/domain exports to shared.

---

## KI-006

TASK-00.05 should resolve the TypeScript/configuration portion of KI-006 if
possible.

However, final root command orchestration belongs to TASK-00.09.

Therefore:

- solve dependency/configuration correctness now;
- do not overtake TASK-00.09 by creating elaborate root build orchestration;
- if a remaining script-order concern legitimately belongs to TASK-00.09,
  document that distinction accurately.

Do not mark KI-006 RESOLVED unless the actual failure mode is eliminated.

It may instead become MITIGATED/PARTIALLY_RESOLVED with the remaining work
clearly assigned to TASK-00.09.

---

## Root Configuration

Do not introduce a monorepo framework.

Do not add Turborepo, Nx or similar tooling.

Do not add runtime dependencies.

Avoid adding development dependencies unless TypeScript configuration
genuinely requires them.

Prefer using the TypeScript version already available in the repository.

---

## Module Compatibility

Preserve the established module requirements.

API currently uses ESM with NodeNext.

Do not break its `.js` relative-import convention.

Web must remain compatible with Vite.

Shared must remain suitable for future use by both browser and Node
consumers.

Do not introduce CommonJS merely to simplify configuration.

---

## Build Artifacts

Keep generated output out of source directories.

Existing ignored build artifacts may remain.

Do not commit generated `dist` content.

Do not make application source depend accidentally on stale generated output.

---

## Scope Protection

Do NOT implement:

- application features;
- business/domain models;
- API DTOs;
- Zod schemas;
- database code;
- authentication;
- routing features;
- UI features;
- ESLint;
- Prettier;
- Vitest;
- Playwright;
- CI/CD;
- monorepo orchestration framework.

ESLint/code-quality work belongs to TASK-00.06.

Testing belongs to TASK-00.08.

Final root command orchestration belongs to TASK-00.09.

---

## Verification

Verify from the actual repository.

Required:

1. web typecheck PASS;
2. api typecheck PASS;
3. shared typecheck PASS;
4. web production build PASS;
5. api production build PASS;
6. shared build PASS;
7. root typecheck behavior checked;
8. root build behavior checked;
9. TypeScript strictness explicitly enabled;
10. API NodeNext/ESM behavior preserved;
11. Vite TypeScript behavior preserved;
12. shared remains environment-neutral;
13. no circular workspace/project references;
14. no unexpected dependencies;
15. no business/domain implementation introduced.

Where practical, verify behavior from a clean generated-output state so stale
`dist` files do not hide dependency problems.

Do not delete source or user data.

Lint:
NOT_APPLICABLE

Tests:
NOT_APPLICABLE

unless their dedicated tooling already exists for another reason.

---

## Project Memory

After verification update:

- PROJECT_STATE.md
- CURRENT_TASK.md
- CHANGELOG_AI.md
- KNOWN_ISSUES.md when KI-006 status changes or a genuine issue is discovered

Record the TypeScript configuration decision clearly enough that future tasks
do not have to rediscover it.

Do not start TASK-00.06.

---

## Completion Criteria

TASK-00.05 is complete when:

- TypeScript policy is coherent across the monorepo;
- strictness is explicit;
- web/api/shared typecheck successfully;
- web/api/shared build successfully;
- environment-specific requirements remain correct;
- KI-006 is either resolved or accurately reduced to work owned by TASK-00.09;
- no scope creep occurred;
- Project Memory reflects the actual result.

---

## Stop Condition

STOP after TASK-00.05.

Do not begin TASK-00.06.

Final status:

- COMPLETED
- BLOCKED
- FAILED_VERIFICATION
- AWAITING_APPROVAL
