# PHASE-01 / TASK-01.09 — Database Testing & Developer Workflow

## Status

NOT_STARTED

## Objective

Establish a safe, repeatable database testing and developer workflow for
MABA PRINTING.

This task separates development and automated database testing environments,
verifies migration integrity, resolves the remaining migration-line-ending
concern where possible, and ensures database-backed tests never depend on the
development database.

This task must not introduce new business features.

---

## Primary Goals

1. Create a dedicated local test database workflow.
2. Ensure database integration tests never use `maba_printing_dev`.
3. Provide repeatable migration + seed/test setup.
4. Preserve the development database.
5. Safely verify migration checksum/line-ending behavior for KI-009.
6. Integrate DB testing into the developer workflow without making ordinary
   lightweight tests depend on Docker/PostgreSQL unnecessarily.

---

## Database Separation

Development database:

`maba_printing_dev`

Automated database test database:

Use a clearly separate name such as:

`maba_printing_test`

or an equivalent explicit test-only database.

The two databases must never share mutable test state.

Tests must be able to prove which database they are connected to before
performing any write operation.

---

## Safety Guard

Database tests must fail closed if the target does not clearly identify itself
as the approved test database.

Before any destructive or mutating test setup, verify the target database
name.

A test workflow must never:

- reset `maba_printing_dev`;
- truncate `maba_printing_dev`;
- delete development seed data;
- run destructive setup against an unknown database.

If database identity cannot be confirmed:

STOP / FAIL.

---

## Docker / PostgreSQL

Use the already approved Docker-based local PostgreSQL setup.

Do not install another PostgreSQL instance.

Prefer the smallest maintainable method for providing both databases.

Acceptable approaches include:

- one PostgreSQL container containing both databases;
- a dedicated test PostgreSQL service if strongly justified.

Prefer one local PostgreSQL service with separate development and test
databases unless the current setup makes that impractical.

Do not add unnecessary containers.

---

## Test Database Creation

Provide a repeatable way to ensure the test database exists.

Do not depend on developers manually creating it via GUI tools.

The setup should be explicit and documented.

Do not create the test database from frontend code or application runtime.

---

## Environment Separation

Development runtime:

- continues using `apps/api/.env`;
- points to `maba_printing_dev`.

Database tests:

- must use a dedicated test DATABASE_URL;
- must not silently reuse normal `DATABASE_URL`.

Use a safe local mechanism such as:

- a test-specific env file that is ignored by Git;
- explicit test environment configuration;
- another repository-consistent approach.

No real credentials may be committed.

Example test configuration may be committed only if it contains synthetic local
development credentials.

Do not expose test or development DATABASE_URL values to the web app.

---

## Migration Workflow for Test Database

The test database must be initialized using the actual migration history.

Do not reproduce tables manually.

Do not use Prisma schema push as a substitute for validating migration history
unless explicitly justified.

Preferred setup:

1. test database exists;
2. apply committed migrations;
3. optionally apply test-specific fixture setup;
4. run database tests;
5. clean test state safely.

The test database should prove that the repository can be rebuilt from
migrations from an empty state.

---

## Seed Strategy in Tests

Development seed data and automated test fixtures are different concerns.

Do NOT blindly run the development seed before every database test unless the
tests intentionally depend on that baseline.

Prefer:

- small deterministic test fixtures;
- transaction rollback;
- targeted setup/cleanup.

Development seed must remain a developer convenience, not a hidden test
dependency.

---

## Database Integration Tests

Move current repository database tests away from `maba_printing_dev`.

They must run against the dedicated test database.

Test at minimum:

- BusinessSettings repository;
- Location repository;
- Service catalog repository;
- Product catalog repository.

Preserve existing assertions around:

- active/inactive filtering;
- category relationships;
- availability;
- deterministic ordering;
- no obvious N+1 behavior.

---

## Test Isolation

Tests must not leak state between cases.

Prefer one of:

- transaction-per-test with rollback;
- deterministic cleanup of test-owned fixtures;
- another simple explicit isolation mechanism.

Do not depend on test execution order.

Do not globally disable constraints.

---

## Test Commands

Provide clear root/API commands for:

- normal lightweight tests;
- database integration tests;
- database-test setup when needed.

Keep ordinary `npm test` database-independent if that remains the most useful
fast feedback loop.

A separate DB test command is appropriate.

Do not make every frontend/unit test require PostgreSQL.

---

## Test Database Rebuild

Provide a safe explicit workflow capable of rebuilding ONLY the test database
from migration history.

If a destructive operation is used:

- it must be guarded;
- it must verify the database is the test database;
- it must never default to development.

Do not expose a generic dangerous reset command that accepts arbitrary
DATABASE_URL values.

---

## KI-009 — Migration Line Endings / Checksums

Investigate KI-009 safely.

Goal:

Determine whether Git line-ending conversion can modify Prisma migration
files in a way that causes checksum mismatch across Windows checkouts.

Do not modify already-applied migrations simply to test this.

Safe verification methods may include:

- inspecting Git attributes;
- inspecting repository vs working-tree bytes;
- controlled copies outside the applied migration path;
- Prisma checksum/migration behavior against a disposable test database.

Do NOT:

- rewrite applied migration files;
- normalize them in place;
- reset the development database;
- suppress checksum warnings.

---

## .gitattributes

If verification shows migration files need stable line endings across
platforms, adding a repository `.gitattributes` rule is allowed.

Prefer a targeted rule such as stable LF treatment specifically for migration
SQL or another minimal scope.

Do not force unrelated project files to a new line-ending policy without need.

If `.gitattributes` is added:

- document why;
- verify existing migration files are not silently rewritten in the working
  tree;
- verify future migration files will be stable.

---

## KI-010

Do not upgrade:

- pg;
- Prisma;
- @prisma/adapter-pg

solely because of the existing warning.

If the warning does not break test behavior, leave it documented.

---

## Development Workflow Documentation

README should clearly distinguish:

### Development database
- start PostgreSQL;
- configure dev DATABASE_URL;
- migrate;
- seed;
- run app.

### Test database
- create/ensure test DB;
- apply migrations;
- run DB tests;
- rebuild test DB safely if needed.

No developer should have to guess which database a command touches.

---

## Migration Integrity Verification

Using the test database, verify that the repository can be reconstructed from
an empty database using committed migrations only.

Confirm:

1. all migrations apply in order;
2. custom CHECK constraints are present;
3. custom indexes are present;
4. expression index on lower(email) exists;
5. BusinessSettings singleton constraint exists;
6. no migration drift;
7. previous migration files remain unchanged.

---

## Schema/Database Consistency

After applying migrations to the fresh test database, compare expected schema
state.

Do not accept a workflow that only works because the development database was
manually modified.

The test database is the proof that migration history is self-contained.

---

## Test Data Safety

All test data must be:

- synthetic;
- disposable;
- non-sensitive.

Do not use development-seed business data as a substitute for explicit test
fixtures unless a specific test intentionally verifies seed behavior.

---

## No New Domain Features

Do NOT implement:

- new repositories;
- controllers;
- routes;
- services;
- auth;
- order workflow;
- payment flow;
- upload behavior;
- frontend features.

This is infrastructure/testing only.

---

## Regression Verification

Required:

1. development DB remains intact.
2. test DB is separate.
3. test DB can be built from empty using migrations.
4. repository DB tests run only against test DB.
5. database safety guard rejects development DB.
6. DB tests PASS.
7. normal Vitest tests PASS.
8. Playwright PASS.
9. Prisma validate PASS.
10. Prisma generate PASS.
11. migration status on development DB PASS.
12. migration status on test DB PASS.
13. root typecheck PASS.
14. root build PASS.
15. root lint PASS.
16. root format check PASS.
17. API health PASS.
18. no DATABASE_URL exposure to web.
19. no development seed corruption.
20. no previous migration file modification.

---

## Known Issues

KI-009:
resolve only if evidence is sufficient.

Possible final statuses:

- RESOLVED;
- MITIGATED;
- OPEN with documented reason.

Do not claim resolution without cross-checkout-safe evidence.

KI-010:
leave unchanged unless actual compatibility changes.

KI-011:
no implementation change required here.

---

## Project Memory

After successful completion update:

- PROJECT_STATE.md
- CURRENT_TASK.md
- CHANGELOG_AI.md
- KNOWN_ISSUES.md

Record:

- test database strategy;
- safety guard;
- fixture/isolation strategy;
- DB test commands;
- fresh migration reconstruction result;
- KI-009 conclusion;
- `.gitattributes` decision if any;
- confirmation that development DB was preserved.

Do not begin TASK-01.10.

---

## Completion Status

Use:

- COMPLETED
- BLOCKED
- FAILED_VERIFICATION
- AWAITING_APPROVAL

---

## Stop Condition

STOP after TASK-01.09.

Do not begin TASK-01.10.