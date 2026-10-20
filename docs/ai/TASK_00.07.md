# PHASE-00 / TASK-00.07 — Environment Configuration

## Status

NOT_STARTED

## Objective

Establish a safe and maintainable environment-variable foundation for the
MABA PRINTING monorepo.

This task defines environment handling and validation boundaries without
implementing future database, authentication, storage or deployment features.

---

## Current Context

Workspaces:

- apps/web
- apps/api
- packages/shared

Existing root `.env.example` contains the planned environment-variable
inventory from the approved Architecture.

Environment handling must respect:

- Vite's client environment model;
- Node/Express server environment;
- no secrets exposed to browser code;
- future provider-specific values remain configurable.

---

## Required Outcome

Establish:

1. clear environment-variable ownership;
2. safe example configuration;
3. backend environment loading foundation;
4. frontend environment typing/access foundation where currently needed;
5. separation between public client variables and server secrets;
6. fail-safe behavior for required variables when they eventually become
   required;
7. documentation sufficient for local development.

Keep the implementation proportional to Phase 00.

---

## Environment Ownership

Classify variables as either:

### Server-only

Examples may include future:

- DATABASE_URL
- session secrets
- Google OAuth server credentials
- storage credentials
- private service configuration

These must never be exposed through Vite/client variables.

### Client-safe

Only variables intentionally exposed to browser code may use Vite's public
environment convention.

Do not rename server secrets with a Vite public prefix.

Do not expose a variable merely because it may be convenient.

---

## Existing `.env.example`

Inspect the existing Architecture and `.env.example`.

Preserve the approved variable inventory unless a genuine inconsistency is
found.

Example files must:

- contain no real credentials;
- make required values understandable;
- avoid production secrets;
- remain safe to commit.

Do not invent provider-specific production credentials.

---

## Backend

Provide the minimum environment foundation required for future Express
development.

A lightweight environment loader may be introduced if required.

If environment validation is introduced, prefer the already approved Zod
direction only when justified by this task.

Do not create domain validation schemas.

Do not require future variables such as DATABASE_URL or session secrets just
to start the current Phase-00 health server if those features do not exist yet.

The current API must remain runnable during Phase 00.

---

## Frontend

Do not expose server variables to `apps/web`.

Only establish Vite environment typing/access if a real current need exists.

Do not add fake client variables merely to demonstrate environment handling.

Future business configuration such as:

- WhatsApp number
- locations
- opening hours
- QRIS image
- branding

must NOT become hardcoded frontend environment variables unless the
Architecture explicitly assigns them there.

These are future application/business settings.

---

## Port / Runtime Configuration

Replace temporary backend runtime constants with environment-driven
configuration where appropriate.

A safe local development fallback may be used for non-secret values such as
the API port.

Document the fallback.

Do not create production deployment configuration.

---

## Security Rules

Never:

- commit a real `.env`;
- add real credentials;
- log secrets;
- expose server-only variables through Vite;
- put auth/session secrets into frontend code;
- provide insecure production defaults for secret values.

Confirm `.gitignore` protects local environment files while preserving
`.env.example`.

---

## Dependencies

Install only environment-related dependencies genuinely needed by this task.

Do not add unrelated application dependencies.

If Zod is introduced for environment validation, document why it is required
now rather than later.

Prefer the smallest maintainable solution.

---

## Scope Protection

Do NOT implement:

- PostgreSQL connection;
- Prisma;
- authentication;
- sessions;
- Google OAuth;
- storage provider;
- file uploads;
- payment;
- business settings;
- deployment provider configuration;
- CI secrets;
- Docker secrets;
- product/order functionality.

This task establishes configuration infrastructure only.

---

## Existing Known Issues

Do not resolve KI-006 runtime orchestration here.

Do not perform unrelated `.gitignore`, ESLint or Prettier cleanup unless an
environment-security defect requires it.

---

## Verification

Required:

1. `.env.example` contains no real secrets.
2. Local `.env` files remain ignored.
3. `.env.example` remains trackable.
4. API environment loading works.
5. API starts with the intended Phase-00 local defaults.
6. API typecheck PASS.
7. API build PASS.
8. API health endpoint remains PASS.
9. Web typecheck PASS.
10. Web build PASS.
11. Shared typecheck/build PASS.
12. Lint PASS.
13. Format check PASS.
14. No server-only variable is exposed to frontend code.
15. No real secret is present in tracked project files.
16. No future business/application feature was implemented.

If testing infrastructure does not yet exist:

Tests: NOT_APPLICABLE

---

## Project Memory

After successful verification update:

- PROJECT_STATE.md
- CURRENT_TASK.md
- CHANGELOG_AI.md

Update KNOWN_ISSUES.md only if genuine new information is discovered.

Record:

- environment ownership strategy;
- dependencies introduced;
- local fallback behavior;
- security-relevant decisions;
- verification results.

Do not start TASK-00.08.

---

## Completion Criteria

TASK-00.07 is complete when:

- environment ownership is clear;
- backend environment handling is established;
- client/server boundaries are safe;
- example configuration is safe and useful;
- existing application foundations remain healthy;
- no secrets are introduced;
- Project Memory is accurate.

---

## Stop Condition

STOP after TASK-00.07.

Do not begin TASK-00.08.

Final status:

- COMPLETED
- BLOCKED
- FAILED_VERIFICATION
- AWAITING_APPROVAL