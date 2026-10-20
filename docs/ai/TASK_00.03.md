# PHASE-00 / TASK-00.03 — Express + TypeScript Foundation

## Status

NOT_STARTED

## Objective

Initialize the backend workspace for MABA PRINTING using Express and
TypeScript inside `apps/api`.

This task establishes only the backend technical foundation.

It does not implement MABA PRINTING business features, database access,
authentication or production deployment configuration.

---

## Context

TASK-00.01 established the repository and npm workspace.

TASK-00.02 established the React + Vite + TypeScript frontend workspace.

The approved backend foundation is:

- Node.js
- Express
- TypeScript
- npm

The approved architectural direction is:

Route
→ Middleware
→ Validator
→ Controller
→ Service
→ Repository when justified
→ Prisma
→ PostgreSQL

However, this task must NOT prematurely implement the complete application
layer structure.

Only the minimum backend foundation required to prove that Express and
TypeScript work correctly is authorized.

---

## Allowed Scope

This task may:

1. Initialize `apps/api` as an npm workspace package.
2. Install Express and the TypeScript dependencies required by the backend.
3. Configure TypeScript for the backend workspace.
4. Create the minimum application entry point.
5. Create the minimum HTTP server entry point if separating app/server is
   useful for later testing.
6. Implement a minimal health endpoint.
7. Add backend-local scripts required for development, typecheck and build.
8. Add minimal development tooling required to run TypeScript locally.
9. Remove `apps/api/.gitkeep` once real files exist.
10. Update Project Memory after verification.

---

## Required Workspace

Create a private npm workspace package under:

`apps/api`

Use a package name consistent with the monorepo naming convention, preferably:

`@maba-printing/api`

Do not add unrelated dependencies.

---

## Runtime Dependency

Required:

- express

Do not add application/business dependencies.

---

## Development Foundation

Add only dependencies directly justified by this task.

Expected categories include:

- TypeScript
- Node.js types
- Express types
- a lightweight TypeScript development runner when required

Prefer `tsx` for local TypeScript development unless the existing
Architecture or repository constraints require otherwise.

Do not introduce:

- nodemon unless justified
- ts-node unless justified
- SWC
- Babel
- a bundler
- a monorepo orchestrator

---

## Minimum Backend Structure

Use a minimal structure appropriate for future growth.

Recommended:

apps/api/
├── package.json
├── tsconfig.json
└── src/
├── app.ts
└── server.ts

`app.ts` should construct/configure the Express application.

`server.ts` should own the process-level server startup.

This separation is preferred because later integration tests can import the
Express application without automatically opening a network port.

Do not create empty architecture folders merely to imitate the future MVC
structure.

For example, do NOT create empty:

- controllers/
- services/
- repositories/
- validators/
- middleware/

until a task actually needs them.

---

## Health Endpoint

Implement exactly one technical endpoint sufficient to prove that the API
foundation works:

GET /api/v1/health

Expected successful response:

{
"status": "ok"
}

This is infrastructure behavior, not a business feature.

Do not add additional API endpoints.

Do not add database health checks.

Do not expose environment details, versions, filesystem paths or secrets.

---

## Express Foundation

Keep Express configuration minimal.

Do not prematurely introduce:

- authentication middleware
- authorization middleware
- CSRF
- CORS configuration
- rate limiting
- security-header packages
- logging libraries
- Zod schemas
- global production error architecture
- request IDs

unless PHASE_00.md explicitly assigns one of these to TASK-00.03.

Those concerns belong to later dedicated tasks/phases.

Normal Express JSON handling is acceptable if required for the foundation.

---

## TypeScript

Use strict TypeScript behavior.

Do not weaken compiler safety to make compilation pass.

Repository-wide TypeScript standardization belongs to TASK-00.05.

Backend-local configuration may be introduced now only as required to
typecheck and build the API.

Avoid path aliases unless already standardized by the project.

---

## Module System

Choose a Node.js module configuration compatible with the current supported
Express + TypeScript toolchain.

Do not introduce unnecessary compatibility layers.

Document any material module-system decision in Project Memory if it affects
future tasks.

---

## Scripts

Provide only scripts justified by the backend foundation.

Expected capabilities:

- development server
- typecheck
- production build
- production start

Script names should integrate naturally with the existing npm workspace
strategy.

Do not add lint or test tooling solely for this task.

Linting belongs to TASK-00.06.

Testing infrastructure belongs to TASK-00.08.

---

## Port

A development port may use a simple temporary foundation default if required.

Do not build the final environment configuration system in this task.

TASK-00.07 owns environment configuration.

Avoid embedding business configuration.

If a temporary development port is required, make its temporary nature clear.

---

## Database

Explicitly prohibited in this task:

- Prisma installation
- Prisma schema
- PostgreSQL connection
- database client
- migrations
- seeds
- repositories accessing data

Database work belongs to later phases.

---

## Authentication

Do not implement:

- sessions
- cookies
- login
- registration
- Google OAuth
- password hashing
- MEMBER / ADMIN authorization

Authentication belongs to later phases.

---

## API Scope

The only authorized HTTP endpoint is:

GET /api/v1/health

Do not implement:

- products
- services
- locations
- orders
- tracking
- account
- admin
- payment
- upload

---

## Error Handling

Do not implement the final project-wide error architecture yet.

Use only the minimum behavior necessary for the technical foundation.

The approved future error categories remain unchanged:

- Validation
- Authentication
- Authorization
- NotFound
- Conflict
- BusinessRule

They are not required to be implemented in this task.

---

## Security

Do not introduce secrets.

Do not expose internal environment information through the health endpoint.

Do not disable TypeScript safety.

Do not add permissive production security configuration merely to make local
development easier.

Security middleware will be introduced by its appropriate task/phase.

---

## Existing Repository Protection

Before editing:

1. Inspect the repository.
2. Read current Project Memory.
3. Confirm TASK-00.02 is complete.
4. Inspect root `package.json`.
5. Inspect `apps/api`.
6. Inspect the existing frontend workspace.
7. Inspect Git state.

Do not modify the frontend except where an actual repository-wide dependency
operation updates the root lockfile.

Do not rewrite approved documentation.

---

## Installation Rules

Use npm.

Install dependencies through the existing workspace structure.

The root `package-lock.json` may change as a legitimate result.

Do not manually create dependency entries that should be managed by npm.

Do not install packages for future tasks.

---

## Verification

After implementation perform all applicable checks.

Required:

1. `apps/api` is recognized as an npm workspace.
2. Dependencies install successfully.
3. Backend TypeScript typecheck passes.
4. Backend production build passes.
5. Compiled production server can start.
6. `GET /api/v1/health` returns HTTP 200.
7. Response body matches the required health response.
8. Root workspace remains valid.
9. Existing frontend typecheck/build remain functional or are not negatively
   affected by this task.
10. No database/auth/business implementation was introduced.
11. No secrets were introduced.

Stop any temporary server process used for verification.

If lint tooling does not exist yet:

NOT_APPLICABLE

If automated test infrastructure does not exist yet:

NOT_APPLICABLE

Do not install either solely for verification.

---

## Project Memory Update

After successful implementation and verification update:

- PROJECT_STATE.md
- CURRENT_TASK.md
- CHANGELOG_AI.md

Update KNOWN_ISSUES.md only if a genuine issue is discovered.

Record:

- TASK-00.03 result
- dependencies introduced
- module-system decision if material
- verification actually executed
- deviations
- unresolved issues

Do not mark TASK-00.04 as started.

---

## Completion Criteria

TASK-00.03 is complete only when:

- `apps/api` is a valid npm workspace;
- Express + TypeScript foundation exists;
- strict TypeScript verification passes;
- production build succeeds;
- production server starts successfully;
- `/api/v1/health` returns HTTP 200 and `{ "status": "ok" }`;
- no database/auth/business functionality exists;
- frontend foundation remains intact;
- Project Memory accurately reflects the result.

---

## Stop Condition

After verification and Project Memory update:

STOP.

Do not begin TASK-00.04.

Final status:

- COMPLETED
- BLOCKED
- FAILED_VERIFICATION
- AWAITING_APPROVAL
