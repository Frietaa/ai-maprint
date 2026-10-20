# MABA PRINTING

Website layanan terpadu untuk jasa cetak dokumen, penjualan ATK, service laptop, dan instalasi software — ditujukan terutama untuk mahasiswa, dengan konsumen umum tetap dapat menggunakan layanan.

## Development Status

- **Phase 00 — Repository & Tooling Foundation:** COMPLETE.
- **Phase 01 — Application & Data Foundation:** COMPLETE / ACCEPTED.

What exists:

- a minimal React + Vite + TypeScript frontend shell (`apps/web`);
- a minimal Express + TypeScript API (`apps/api`) with only the `/api/v1/health` endpoint;
- the PostgreSQL + Prisma persistence foundation: schema, migrations, database constraints and indexes, a synthetic development seed, internal read repositories, and a separate test-database workflow.

No product features are implemented yet: no authentication, no catalog or order endpoints, no ordering, payment, upload or admin features, and no production UI.

## Approved Stack

- **Language:** TypeScript
- **Package manager:** npm (workspaces)
- **Frontend:** React + Vite + React Router + Tailwind CSS
- **Backend:** Node.js + Express
- **Validation:** Zod
- **Database / ORM:** PostgreSQL + Prisma ORM
- **Testing:** Vitest, Supertest, React Testing Library, Playwright

## Repository Structure

```text
maba-printing/
├── apps/
│   ├── web/        # Frontend (React + Vite foundation)
│   └── api/        # Backend API (Express foundation)
├── packages/
│   └── shared/     # Shared code (package foundation, empty API)
├── docs/           # Product & technical specification
│   └── ai/         # AI project memory & task documents
├── .env.example    # Environment inventory (reference only)
├── .gitignore
├── package.json
├── tsconfig.base.json  # Shared TypeScript compiler policy
└── README.md
```

## Local Environment

Each app owns its environment file. Copy the example next to it; `.env` files are git-ignored.

- `apps/api/.env.example` → `apps/api/.env` — server-only values. The API starts without any of them (`PORT` defaults to `3000`); the database commands need `DATABASE_URL` and the database tests need `TEST_DATABASE_URL`.
- `apps/web/.env.example` → `apps/web/.env` — `VITE_*` values only. These are embedded in the browser bundle and are public: never put secrets there.

## Local Databases (development and test only)

PostgreSQL 17 runs in Docker via `compose.dev.yml` (synthetic local credentials, bound to `127.0.0.1:5432`). One server holds two separate databases:

| Database             | Used by                                      | Configured by       |
| -------------------- | -------------------------------------------- | ------------------- |
| `maba_printing_dev`  | the running app, `db:migrate`, `db:seed`     | `DATABASE_URL`      |
| `maba_printing_test` | database tests only (`test:db`, `db:test:*`) | `TEST_DATABASE_URL` |

Prerequisite: Docker Desktop (or Docker Engine with Compose) running. Create `apps/api/.env` from `apps/api/.env.example` and set both URLs to the local Docker values documented there.

### Development database (`maba_printing_dev`)

1. Start PostgreSQL: `npm run db:start` (waits until it is healthy).
2. Apply migrations if needed: `npm run db:migrate`
3. Seed: `npm run db:seed`
4. Run the app: `npm run dev`
5. Status / stop: `npm run db:status`, `npm run db:stop`

The seed (`apps/api/prisma/seed.ts`) adds synthetic local-development data only: fictional locations, a sample service and ATK catalog, and placeholder business settings. It creates no users or orders. Rerunning it is safe. Seed-owned rows are updated in place, other rows are left alone, and existing business settings are never overwritten.

### Test database (`maba_printing_test`)

1. Run the database tests: `npm run test:db`. This first creates `maba_printing_test` if it is missing and applies the committed migrations (`npm run db:test:prepare`).
2. Rebuild it from scratch if needed: `npm run db:test:rebuild`. This drops and recreates **only** `maba_printing_test`, then applies all migrations from an empty database.

These commands never use `DATABASE_URL` and never touch `maba_printing_dev`. They refuse to run unless `TEST_DATABASE_URL` points to a loopback host and names `maba_printing_test`, and they check `current_database()` again after connecting. Tests create their own synthetic fixtures inside transactions that are always rolled back, so they do not depend on the development seed.

Data is kept in the named Docker volume `maba-printing_postgres-data`, so it survives stop/start and container recreation.

## Commands

First time on a machine:

1. `npm install`
2. `npx playwright install chromium` (one-time browser download for E2E)

Then, from the repository root (no manual build step needed):

| Command                | Purpose                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `npm run dev`          | Web (Vite, port 5173) and API (port 3000) together                                        |
| `npm run dev:web`      | Web only                                                                                  |
| `npm run dev:api`      | API only                                                                                  |
| `npm run build`        | Production build: shared → api → web                                                      |
| `npm run start:api`    | Start the built API (run `npm run build` first)                                           |
| `npm run typecheck`    | TypeScript check of all workspaces                                                        |
| `npm run lint`         | ESLint                                                                                    |
| `npm run format`       | Prettier write                                                                            |
| `npm run format:check` | Prettier check                                                                            |
| `npm run test`         | Unit/component/API tests (Vitest); no database needed                                     |
| `npm run test:e2e`     | Browser smoke test (Playwright, Chromium)                                                 |
| `npm run test:db`      | Database tests against `maba_printing_test` (prepares it first; Docker database required) |
| `npm run clean`        | Remove generated build output (`dist/`, TypeScript build caches)                          |

## Documentation

- [Product Requirements (PRD)](docs/PRD_MABA_PRINTING_v1.0.md)
- [Technical Architecture](docs/ARCHITECTURE_MABA_PRINTING_v1.0.md)
- [Project State](docs/ai/PROJECT_STATE.md)
- [Decisions](docs/ai/DECISIONS.md)
- [Current Task](docs/ai/CURRENT_TASK.md)
