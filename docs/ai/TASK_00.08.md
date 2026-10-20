# PHASE-00 / TASK-00.08 — Testing Foundation

## Status

NOT_STARTED

## Objective

Establish the automated testing foundation for MABA PRINTING.

Approved testing stack:

- Vitest
- React Testing Library
- Supertest
- Playwright

This task proves that each testing layer works without implementing future
business-feature test suites prematurely.

---

## Required Testing Layers

### Shared

Use Vitest for TypeScript unit tests.

Create one minimal foundation test proving the runner works.

### API

Use:

- Vitest
- Supertest

Test the existing:

GET /api/v1/health

Required assertions:

- HTTP 200
- response body equals:
  `{ "status": "ok" }`

Import the Express application without opening a real listening server where
possible.

### Web

Use:

- Vitest
- React Testing Library
- jsdom

Test the existing minimal application.

Verify that:

`MABA PRINTING`

is rendered.

Do not add business UI solely for testing.

### E2E

Use Playwright.

Create only a minimal smoke test proving that the current web application can
be opened and its foundation content is visible.

Do not implement future business E2E scenarios yet.

---

## Dependency Discipline

Install only dependencies required for the approved testing stack.

Expected categories:

- vitest
- @testing-library/react
- @testing-library/jest-dom
- jsdom
- supertest
- Supertest types when required
- @playwright/test

Do not add another test framework.

Do not add Jest.

Do not add Cypress.

---

## Test Organization

Keep tests close to the workspace or source they verify.

Use a clear naming convention such as:

- `*.test.ts`
- `*.test.tsx`
- Playwright `*.spec.ts`

Avoid creating a complex test architecture for tests that do not exist yet.

---

## Configuration

Prefer minimal configuration.

Reuse existing Vite/TypeScript configuration where appropriate.

Testing configuration must not weaken production TypeScript behavior.

Do not create duplicated configuration unnecessarily.

---

## Playwright

Configure Playwright only enough for current smoke testing and future growth.

Use Chromium as the minimum required browser for Phase 00 unless the existing
Architecture explicitly requires broader browser coverage now.

Do not introduce unnecessary multi-browser CI complexity.

Playwright may start the current frontend development/preview server for E2E.

Ensure temporary servers are stopped after verification.

Do not add CI configuration in this task.

---

## Future Critical E2E Scenarios

The approved future scenarios remain:

- Guest → Order
- Member → Order
- Member → History
- Guest → Track
- Admin → Order
- Admin → Update Status

Do NOT implement them now because those features do not exist.

This task only establishes the infrastructure that will support them later.

---

## Scope Protection

Do NOT implement:

- products;
- services;
- orders;
- authentication;
- admin;
- database;
- payment;
- upload;
- business UI;
- mock versions of future features.

Tests must describe current Phase-00 behavior only.

---

## Scripts

Provide appropriate test capabilities for each workspace.

Expected concepts:

- `test`
- optionally `test:watch`
- E2E command

Final root orchestration belongs to TASK-00.09.

Do not overengineer root scripts here.

---

## Generated Test Output

Ensure generated test artifacts are ignored appropriately, including existing:

- coverage
- playwright-report
- test-results

Do not commit generated reports.

Do not expand generic ignore rules unnecessarily.

---

## Verification

Required:

1. Shared Vitest test PASS.
2. API Vitest + Supertest health test PASS.
3. Web Vitest + React Testing Library test PASS.
4. Playwright smoke test PASS.
5. Web typecheck PASS.
6. API typecheck PASS.
7. Shared typecheck PASS.
8. Web build PASS.
9. API build PASS.
10. Shared build PASS.
11. Lint PASS.
12. Format check PASS.
13. No future business test/features introduced.
14. No generated test reports accidentally tracked.
15. Temporary test servers stopped.

Report actual test counts.

Do not claim a test layer PASS if it was not executed.

---

## Known Issues

Do not resolve the remaining KI-006 runtime orchestration here unless a tiny
test-script adjustment is strictly required for the testing foundation.

Final runtime/workspace orchestration remains TASK-00.09.

---

## Project Memory

After successful verification update:

- PROJECT_STATE.md
- CURRENT_TASK.md
- CHANGELOG_AI.md

Update KNOWN_ISSUES.md only for genuine issues.

Record:

- testing stack;
- configuration;
- test counts;
- Playwright browser scope;
- verification results.

Do not start TASK-00.09.

---

## Completion Criteria

TASK-00.08 is complete when all four testing layers work:

- shared unit;
- API integration;
- web component;
- browser E2E;

and existing typecheck/build/lint/format checks remain healthy.

---

## Stop Condition

STOP after TASK-00.08.

Do not begin TASK-00.09.

Final status:

- COMPLETED
- BLOCKED
- FAILED_VERIFICATION
- AWAITING_APPROVAL