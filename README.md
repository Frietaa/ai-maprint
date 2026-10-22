# MABA PRINTING

Website layanan terpadu untuk jasa cetak dokumen, penjualan ATK, service laptop, dan instalasi software — ditujukan terutama untuk mahasiswa, dengan konsumen umum tetap dapat menggunakan layanan.

## Development Status

- **Phase 00 — Repository & Tooling Foundation:** COMPLETE.
- **Phase 01 — Application & Data Foundation:** COMPLETE.
- **Phase 02 — Public Read Experience:** COMPLETE / ACCEPTED.
- **Phase 03 — Authentication & Identity:** COMPLETE / ACCEPTED.
- **Phase 04 — Order Submission, Private Files & Tracking:** COMPLETE / ACCEPTED.
- **Phase 05 — Admin Operations & Order Management:** COMPLETE / ACCEPTED.
- **Phase 06 — Remaining MVP Experience & Customer Payment UX:** IMPLEMENTED / VERIFIED (autonomous run; see `docs/ai/TASK_06.10.md`).
- **Phase 07 — Security, Reliability & Production Hardening:** IMPLEMENTED / VERIFIED (autonomous run; see `docs/ai/TASK_07.10.md`).

What exists:

- a public React website (`apps/web`, React Router + Tailwind CSS + TanStack Query): homepage, Printing, ATK, Service Laptop, Instalasi Software and Lokasi pages, responsive and accessible, in Indonesian;
- a read-only public REST API (`apps/api`, Express + Zod): `GET /api/v1/health`, `/public/settings`, `/locations`, `/services`, `/products`;
- optional member accounts: email + password sign-up/sign-in (Argon2id), a Google Sign-In foundation (server-verified ID token; shown only when configured), sign-out, the `/login`, `/signup` and `/account` pages with the member profile (name, WhatsApp), and "Lanjut sebagai tamu" for guests — `POST /api/v1/auth/register|login|google|logout`, `GET /auth/me`, `GET /auth/csrf`, `GET|PATCH /account/profile`; server-side sessions in PostgreSQL behind an HttpOnly `SameSite=Lax` cookie, CSRF tokens, credentialed CORS allowlist, auth rate limits, security headers and `X-Request-ID`;
- order requests for all four business lines — Printing (with optional private document upload: PDF, DOCX, PPTX, XLSX, JPG, PNG, validated by content), ATK (available products with quantities and a server-calculated estimate), Laptop Service (drop-off or pickup) and Software Installation (legal software only) — as Guest or Member, with a receipt, a high-entropy Public Order ID and an order-specific WhatsApp deep link (shown when a WhatsApp number is configured): `POST /api/v1/orders`; guest tracking at `/track-order` (`GET /api/v1/orders/track/:publicId`, safe minimum only); member order history at `/account/orders` (`GET /api/v1/account/orders`, `/account/orders/:publicId`). New orders stay "Menunggu Konfirmasi" (SUBMITTED);
- an Admin area at `/admin` (sign-in at `/admin/login`, ADMIN accounts only): dashboard, order queue with filters and exact Public Order ID search, order detail with the approved status machine (409 on conflicting changes), pricing incl. the laptop pickup fee from the Admin-recorded distance (free up to 5 km, then Rp2.000 per started additional km), internal notes, manual payment confirmation (Cash / static QRIS), Admin-only private document download, management of products, services, categories, locations (opening hours, per-location services) and business settings; every sensitive change is recorded in the Admin audit log (`/api/v1/admin/*`); a 30-day completed-order file cleanup engine (`npm run files:cleanup`);
- customer payment information: Cash or the owner's static QRIS (shown when configured as an https URL or website path) on the receipt, the tracking page and the member order detail, which also shows the member's payment status; payment is always confirmed manually by an Admin — no gateway;
- duplicate-submission protection: the website sends an `Idempotency-Key` with each order, so resending after a lost response returns the original order instead of a second one;
- bounded catalog pages (`GET /products`, `GET /services` with `page`/`pageSize`, max 100 per page);
- production hardening: shared PostgreSQL rate limits (`RATE_LIMIT_STORE`), a malware-scanning step for uploads (`UPLOAD_SCANNER`: ClamAV or an explicit `none`), structured JSON logs (`LOG_LEVEL`), `GET /api/v1/readiness`, a tested website security-header policy (`apps/web/hosting/security-headers.ts`), a storage adapter contract, and runbooks in `docs/` (SECURITY, OPERATIONS, BACKUP_RESTORE, DEPLOYMENT);
- shared public API contracts (`packages/shared`);
- the PostgreSQL + Prisma persistence foundation: schema, migrations, constraints and indexes, a synthetic development seed, repositories, and a separate test-database workflow.

Not implemented yet: a payment gateway (out of MVP scope), an upload for the QRIS image (the owner provides a hosted URL or website path), notifications, production scheduling of the file-retention cleanup (the command exists), Admin account management in the UI (operator command only), password reset, email verification, production object storage, malware scanning of uploads and production deployment.

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
│   ├── web/        # Public website (React + Vite)
│   └── api/        # REST API (Express + Prisma)
├── packages/
│   └── shared/     # Public API contracts shared by web and api
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

- `apps/api/.env.example` → `apps/api/.env` — server-only values. The API needs `SESSION_SECRET` (random, at least 32 characters; the example shows how to generate one) and `DATABASE_URL` to start — it stops with an error naming the missing variable; `PORT` defaults to `3000`. The database tests need `TEST_DATABASE_URL`; `FRONTEND_URL` lists web origins allowed to call the API cross-origin with credentials (not needed for `npm run dev`); `GOOGLE_CLIENT_ID` enables Google Sign-In. Uploaded order documents are stored privately in `apps/api/.local-storage/` (git-ignored, never served); `UPLOAD_MAX_FILES` / `UPLOAD_MAX_FILE_SIZE` adjust the limits. Local storage is development-only: with `NODE_ENV=production` the API refuses to start until production object storage exists (deployment phase).
- `apps/web/.env.example` → `apps/web/.env` — `VITE_*` values only. These are embedded in the browser bundle and are public: never put secrets there. `VITE_API_BASE_URL` is the API origin; leave it empty in development, where Vite proxies `/api` to `http://localhost:3000`. `VITE_GOOGLE_CLIENT_ID` (same value as the API's `GOOGLE_CLIENT_ID`) shows the Google button; without it only email + password is offered. No real Google credentials are committed; automated tests never call Google.

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

3. Browser E2E: `npm run test:e2e` starts a dedicated API on port 3199 against `maba_printing_test` (deterministic E2E fixtures, removed again afterwards) and the website on port 5179, then runs Playwright. Uploaded E2E documents go to a temporary directory outside the project. It needs the Docker database and `TEST_DATABASE_URL`; `db:test:prepare` also removes leftovers of an interrupted E2E run (orders, test accounts, sessions), and the teardown removes the E2E files.

These commands never use `DATABASE_URL` and never touch `maba_printing_dev`. They refuse to run unless `TEST_DATABASE_URL` points to a loopback host and names `maba_printing_test`, and they check `current_database()` again after connecting. Tests create their own synthetic fixtures inside transactions that are always rolled back, so they do not depend on the development seed.

Data is kept in the named Docker volume `maba-printing_postgres-data`, so it survives stop/start and container recreation.

## Admin Accounts (operators)

Admins cannot sign up. Create one with the operator command (it uses `DATABASE_URL`, hashes the password with Argon2id and prints only the outcome):

```bash
ADMIN_EMAIL=you@example.com ADMIN_NAME="Nama Admin" ADMIN_PASSWORD="a long unique passphrase" npm run admin:create -w @maba-printing/api
```

An existing member account is promoted only with `-- --promote`; an existing Admin is left unchanged. Sign in at `/admin/login`. `npm run files:cleanup -w @maba-printing/api` deletes order documents 30 days after completion (idempotent; scheduling is a deployment task).

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
| `npm run test:e2e`     | Full-stack browser tests (Playwright, Chromium) against `maba_printing_test`              |
| `npm run test:db`      | Database tests against `maba_printing_test` (prepares it first; Docker database required) |
| `npm run clean`        | Remove generated build output (`dist/`, TypeScript build caches)                          |

## Documentation

- [Product Requirements (PRD)](docs/PRD_MABA_PRINTING_v1.0.md)
- [Technical Architecture](docs/ARCHITECTURE_MABA_PRINTING_v1.0.md)
- [Project State](docs/ai/PROJECT_STATE.md)
- [Decisions](docs/ai/DECISIONS.md)
- [Current Task](docs/ai/CURRENT_TASK.md)
