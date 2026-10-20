# PHASE-00 / TASK-00.06 — Code Quality

## Status

NOT_STARTED

## Objective

Establish a consistent, minimal code-quality foundation for the MABA PRINTING
monorepo.

This task owns linting and formatting policy.

It must not introduce application features or unrelated tooling.

---

## Current Workspaces

- apps/web
- apps/api
- packages/shared

All use TypeScript.

Frontend uses React.

Backend uses Node.js + Express + ESM/NodeNext.

Shared is environment-neutral.

---

## Required Outcome

Establish repository-wide:

1. ESLint configuration;
2. TypeScript-aware linting;
3. React-specific linting where appropriate;
4. Prettier formatting;
5. workspace-compatible lint/format scripts;
6. ignore behavior for generated output;
7. successful lint verification for current source.

Prefer one coherent root configuration over duplicated workspace
configurations.

---

## ESLint

Use the current supported ESLint flat-config approach.

Configure rules appropriate for:

- TypeScript generally;
- React frontend specifically;
- Node backend specifically where needed.

Use maintained official/ecosystem integrations.

Do not recreate rules already handled effectively by TypeScript or Prettier
without a clear reason.

Do not add stylistic complexity for its own sake.

---

## Prettier

Configure Prettier as the formatter.

Keep formatting policy simple and repository-wide.

Do not spend this task debating subjective formatting preferences.

Add appropriate format and format-check capabilities.

Generated output must not be formatted.

---

## Generated / Ignored Content

Linting and formatting must ignore generated or irrelevant content such as:

- node_modules
- dist
- build
- coverage
- Playwright output
- test-results

Respect existing repository boundaries.

Do not lint generated JavaScript from TypeScript builds.

---

## Scripts

Provide useful root capabilities for:

- lint
- formatting
- formatting verification

Workspace-local lint scripts may be added where they improve compatibility
with the existing root workspace strategy.

Do not finalize all repository command orchestration here.

TASK-00.09 owns final unified scripts.

---

## Existing Code

Current source should pass the new quality rules.

If lint reveals genuine issues in existing Phase-00 source, minimal fixes are
allowed.

Do not perform unrelated refactoring.

Do not change application behavior merely for style.

---

## Dependency Discipline

Install only dependencies required for ESLint/TypeScript/React/Prettier
quality tooling.

Do not install:

- testing frameworks;
- Husky;
- lint-staged;
- commitlint;
- monorepo orchestrators;
- CI tooling;
- application/runtime packages.

Git hooks are not required in this task.

---

## Scope Protection

Do NOT implement:

- application features;
- domain types;
- database functionality;
- authentication;
- API endpoints;
- UI features;
- Tailwind/design system;
- testing infrastructure;
- Playwright;
- CI/CD.

Testing belongs to TASK-00.08.

Final command orchestration belongs to TASK-00.09.

---

## Verification

Required:

1. ESLint configuration loads successfully.
2. Web lint PASS.
3. API lint PASS.
4. Shared lint PASS.
5. Root lint PASS.
6. Prettier format-check PASS after formatting approved files.
7. Web typecheck PASS.
8. API typecheck PASS.
9. Shared typecheck PASS.
10. Web build PASS.
11. API build PASS.
12. Shared build PASS.
13. Generated output is excluded from lint/format checks.
14. No unexpected runtime dependency introduced.
15. No application behavior regression introduced.

Tests:

NOT_APPLICABLE

unless test infrastructure already exists independently.

---

## Existing Known Issues

Do not attempt to finish KI-006 runtime/dev orchestration.

KI-006 remains owned by TASK-00.09 for its unresolved portion.

Do not change its status to RESOLVED merely because linting passes.

---

## Project Memory

After successful verification update:

- PROJECT_STATE.md
- CURRENT_TASK.md
- CHANGELOG_AI.md

Update KNOWN_ISSUES.md only for genuine new information.

Record the chosen lint/format strategy and relevant versions.

Do not start TASK-00.07.

---

## Completion Criteria

TASK-00.06 is complete when:

- repository-wide ESLint works;
- TypeScript and React linting are appropriately configured;
- Prettier works;
- all current workspaces lint successfully;
- format verification succeeds;
- existing typecheck/build remains healthy;
- no scope creep occurred;
- Project Memory is accurate.

---

## Stop Condition

STOP after TASK-00.06.

Do not begin TASK-00.07.

Final status:

- COMPLETED
- BLOCKED
- FAILED_VERIFICATION
- AWAITING_APPROVAL
