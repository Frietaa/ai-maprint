# MABA PRINTING

Website layanan terpadu untuk jasa cetak dokumen, penjualan ATK, service laptop, dan instalasi software — ditujukan terutama untuk mahasiswa, dengan konsumen umum tetap dapat menggunakan layanan.

## Status

**DEPLOYMENT_READY_PENDING_PROVIDER.** Engineering implementation and the release candidate are complete and human-accepted (Phases 00–09 COMPLETE / ACCEPTED); the application implements the frozen PRD v1.0 MVP. **Production deployment has not occurred:** hosting, managed PostgreSQL, private object storage, scheduler and domain are owner decisions ([docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) §2). Production refuses to start until a private object-storage adapter exists (KI-019).

| Phase | Scope                                                 | Status              |
| ----- | ----------------------------------------------------- | ------------------- |
| 00    | Repository & tooling foundation                       | COMPLETE / ACCEPTED |
| 01    | Application & data foundation                         | COMPLETE / ACCEPTED |
| 02    | Public read experience                                | COMPLETE / ACCEPTED |
| 03    | Authentication & identity                             | COMPLETE / ACCEPTED |
| 04    | Order submission, private files & tracking            | COMPLETE / ACCEPTED |
| 05    | Admin operations & order management                   | COMPLETE / ACCEPTED |
| 06    | Remaining MVP experience & customer payment UX        | COMPLETE / ACCEPTED |
| 07    | Security, reliability & production hardening          | COMPLETE / ACCEPTED |
| 08    | Production infrastructure & deployment readiness      | COMPLETE / ACCEPTED |
| 09    | Release candidate, full regression & launch readiness | COMPLETE / ACCEPTED |

Phases 06–09 ran in one human-authorized autonomous session (each independently verified and checkpoint-committed) and were human-accepted in the final project review (2026-10-22). Final verdict: [docs/ai/TASK_09.10.md](docs/ai/TASK_09.10.md).

Remaining human-owned decisions before go-live: hosting provider, managed PostgreSQL provider, private object-storage provider (then its `StorageService` adapter — KI-019 blocks a production start until it exists), production scheduler for the daily retention cleanup, malware-scanning policy (`clamav` or explicit `none`), domain/DNS, and RPO/RTO targets.

## What the application does

**Customers (in Indonesian, responsive, accessible):**

- Homepage, service pages (Printing, ATK, Service Laptop, Instalasi Software) and Lokasi with opening hours. All business data comes from the database.
- Order requests for the four business lines, as Guest or Member:
  - Printing with private document upload (PDF, DOCX, PPTX, XLSX, JPG, PNG; validated by content and scanned when a scanner is configured);
  - ATK with a server-calculated estimate;
  - Laptop service, drop-off or pickup;
  - Software installation (legal software only).

  Each request gives a receipt with a high-entropy Public Order ID, an order-specific WhatsApp link and payment information (Cash or the owner's static QRIS, confirmed manually by an Admin).

- Duplicate-submission protection (`Idempotency-Key`): resending after a lost response returns the same order.
- Guest tracking at `/track-order` (a privacy-minimal status).
- Optional member accounts: email + password (Argon2id) and Google Sign-In (server-verified), profile, order history and own order detail with payment status.

**Admins** (`/admin`, ADMIN accounts only, created by an operator command):

- the dashboard and an order queue with filters;
- order detail with the approved status machine (concurrent changes get 409);
- pricing, including the laptop pickup fee: free up to 5 km, then Rp2.000 per started additional km (human-approved);
- internal notes, manual payment confirmation, and private document download;
- management of products, services, categories, locations (opening hours, per-location services) and business settings (logo, QRIS, WhatsApp number, social links).

Every sensitive change is written to the Admin audit log.

**Platform:**

- Server-side PostgreSQL sessions with an HttpOnly, Secure (in production) cookie, CSRF tokens and an exact-origin CORS allowlist.
- Rate limits shared through PostgreSQL.
- An upload malware-scanning boundary (ClamAV or an explicit `none`).
- Private storage behind a `StorageService` contract.
- 30-day retention cleanup for completed orders.
- Structured JSON logs with request IDs; `/api/v1/health` and `/api/v1/readiness`.
- A tested website security-header policy, an API container image, CI, a read-only smoke test, and runbooks.

Out of MVP scope (PRD §4): payment gateway, WhatsApp API or notifications, Maps, numeric inventory, native app.

## Stack

TypeScript · npm workspaces · React + Vite + React Router + Tailwind CSS + TanStack Query · Node.js + Express + Zod · PostgreSQL + Prisma ORM · Vitest, Supertest, React Testing Library, Playwright.

```text
maba-printing/
├── apps/
│   ├── web/            # Website (React + Vite); hosting/ = security-header policy
│   └── api/            # REST API (Express + Prisma); Dockerfile; src/cli = operator commands
├── packages/shared/    # API contracts shared by web and api
├── scripts/            # check-migrations, smoke
├── docs/               # PRD, Architecture, runbooks; docs/ai = project memory
├── .github/workflows/  # CI
└── compose.dev.yml     # Local PostgreSQL 17 (development and tests only)
```

## Local development

Prerequisites: Node.js 24, Docker (for PostgreSQL).

1. `npm install`, then `npx playwright install chromium` (one-time, for E2E).
2. Create `apps/api/.env` from `apps/api/.env.example`: `DATABASE_URL`, `TEST_DATABASE_URL` and a random `SESSION_SECRET` (the example shows how to generate one). Optionally create `apps/web/.env` from `apps/web/.env.example`. Every `VITE_*` value is public; never put secrets there.
3. `npm run db:start`, then `npm run db:migrate`, then `npm run db:seed` (synthetic data only).
4. `npm run dev`: the website runs on <http://localhost:5173> and proxies `/api` to the API on port 3000.
5. Create a local Admin:

   ```bash
   ADMIN_EMAIL=you@example.com ADMIN_NAME="Nama Admin" ADMIN_PASSWORD="a long unique passphrase" npm run admin:create -w @maba-printing/api
   ```

   Add `-- --promote` to promote an existing member. Then sign in at `/admin/login`.

Two databases live in the local Docker PostgreSQL:

- `maba_printing_dev` (`DATABASE_URL`) is used by the running app.
- `maba_printing_test` (`TEST_DATABASE_URL`) is used only by automated tests. They refuse any other database or a non-loopback host, and never touch the development database.

Uploaded documents are stored in the git-ignored `apps/api/.local-storage/` and are never served publicly. Local storage is development-only.

## Commands

| Command                                                               | Purpose                                                                                                                                     |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev` / `dev:web` / `dev:api`                                 | Development servers                                                                                                                         |
| `npm run build`                                                       | Production build: shared → api → web                                                                                                        |
| `npm test`                                                            | Unit, component and API tests (no database)                                                                                                 |
| `npm run test:db`                                                     | Database tests on `maba_printing_test`                                                                                                      |
| `npm run test:e2e`                                                    | Playwright journeys (dev server + E2E API on the test database)                                                                             |
| `npm run test:e2e:preview -w @maba-printing/web`                      | Production build under the website security headers                                                                                         |
| `npm run verify`                                                      | Everything CI checks except browsers: format, lint, typecheck, migration integrity, Prisma validate, unit, test-DB rebuild, DB tests, build |
| `npm run verify:e2e`                                                  | Both Playwright suites                                                                                                                      |
| `npm run check:migrations`                                            | Applied migrations unchanged (manifest of hashes)                                                                                           |
| `npm run db:migrate:deploy`                                           | Apply committed migrations (production release step)                                                                                        |
| `npm run start:api`                                                   | Start the built API                                                                                                                         |
| `npm run start:admin-create -w @maba-printing/api`                    | Create or promote an Admin (built CLI)                                                                                                      |
| `npm run files:cleanup -w @maba-printing/api` / `start:files-cleanup` | 30-day retention cleanup (dev / built)                                                                                                      |
| `npm run smoke -- --web <url> --api <url>`                            | Read-only post-deployment smoke test                                                                                                        |
| `npm run lint`, `format`, `format:check`, `typecheck`, `clean`        | Code quality and housekeeping                                                                                                               |

## Documentation

| Document                                                                                                                | Purpose                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [PRD](docs/PRD_MABA_PRINTING_v1.0.md) · [Architecture](docs/ARCHITECTURE_MABA_PRINTING_v1.0.md)                         | Frozen sources of truth                                                                      |
| [DEPLOYMENT](docs/DEPLOYMENT.md)                                                                                        | Topology, provider decisions, environment contract, commands, container, CI, smoke, rollback |
| [OPERATIONS](docs/OPERATIONS.md)                                                                                        | Probes, logs, operator commands, scheduling, migrations, rate limits, scanning               |
| [SECURITY](docs/SECURITY.md)                                                                                            | Threat model and mitigations                                                                 |
| [BACKUP_RESTORE](docs/BACKUP_RESTORE.md)                                                                                | Backups, restore procedure and rehearsal                                                     |
| [RELEASE_CHECKLIST](docs/RELEASE_CHECKLIST.md)                                                                          | Owner decisions, release steps, readiness audit                                              |
| [Known Issues](docs/ai/KNOWN_ISSUES.md) · [Decisions](docs/ai/DECISIONS.md) · [Project State](docs/ai/PROJECT_STATE.md) | Project memory                                                                               |

## Known limitations

- **Before go-live:**
  - choose the providers;
  - implement the private object-storage adapter (KI-019);
  - schedule the daily retention cleanup (KI-018);
  - configure the website headers on the host (KI-016);
  - decide on ClamAV or an explicit `UPLOAD_SCANNER=none`.
- **Accepted for the MVP:**
  - no password reset or email verification;
  - no linking between password and Google sign-in for the same email (KI-017);
  - Admin accounts are managed by operator command, not in the UI;
  - the QRIS image is provided as a hosted URL or website path (no upload);
  - service pages map categories to business lines by name keywords (KI-013, shown on the Admin services page).
