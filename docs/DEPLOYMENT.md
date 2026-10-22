# MABA PRINTING — Deployment Guide

Status: **deployment-ready; production provider/account configuration pending.** No hosting, database, storage, scanner, scheduler or domain provider has been chosen (KI-001, ADR-022). This guide states what any provider must offer, which decisions the owner must make, and how to deploy once they are made. Nothing in this repository deploys or buys anything.

Related: [OPERATIONS.md](OPERATIONS.md) (running it), [BACKUP_RESTORE.md](BACKUP_RESTORE.md), [SECURITY.md](SECURITY.md), [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md).

## 1. Topology

```text
Browser ──HTTPS──> Website host (static files: apps/web/dist)
   │
   └──HTTPS (fetch, credentials)──> Node API (apps/api, container or Node host)
                                      ├── Managed PostgreSQL (TLS)
                                      ├── Private object storage (documents)
                                      └── clamd (optional malware scanner)
Scheduler ── daily ──> files:cleanup (same image/environment as the API)
```

**Same-site is strongly recommended.** Serve the website and the API from the same registrable domain, e.g. `www.mabaprinting.id` and `api.mabaprinting.id`, or the API under `/api` of the website through a reverse proxy. The session cookie then works with `SameSite=Lax`, the default. A cross-site pair (two unrelated provider domains) needs `SESSION_COOKIE_SAMESITE=none`, which browsers' third-party cookie blocking makes unreliable — avoid it (KI-022).

## 2. Decisions the owner must make

| Decision | Requirements from this application | Options to compare (examples, not endorsements) | Criteria |
|---|---|---|---|
| Domain and DNS | One domain with HTTPS for website and API (same site) | Any registrar | Ownership in the business's name, renewal cost |
| Website host | Static files, custom headers (section 5), SPA fallback to `index.html`, HTTPS | Static hosting or CDN providers, or the API's reverse proxy | Header support, free-tier limits, region |
| API host | Node 24 or a container (`apps/api/Dockerfile`), HTTPS, environment variables, ≥ 512 MB RAM, outbound access to database, storage and scanner, health checks | Container or Node platforms, a small VM | Cold starts (they reset in-memory state; the rate limits are in PostgreSQL), region near the users, price |
| Managed PostgreSQL | PostgreSQL ≥ 13 (17 tested), TLS, automated backups or point-in-time recovery, ≥ 20 connections | Managed PostgreSQL offerings | Backup retention (RPO/RTO, BACKUP_RESTORE.md), region, price |
| Private object storage | Private bucket, conditional put, versioning, encryption (section 7) | S3-compatible or other object stores | Requires implementing a `StorageService` adapter (KI-019) |
| Malware scanning | `UPLOAD_SCANNER=clamav` (clamd reachable) or an explicit `none` | Self-hosted ClamAV container next to the API | Memory (~1 GB for signatures), operational effort, risk acceptance |
| Scheduler | Run `files:cleanup` daily with the API environment | Platform cron, scheduled container job, VM cron | Reliability, alerting on failure |
| Google Sign-In (optional) | OAuth client ID; website origin authorized | Google Cloud console | Without it, email and password keep working |

Until **object storage** is decided and implemented, the API intentionally refuses to start with `NODE_ENV=production` (it will not store customer documents on a server's local disk). That is the single hard blocker for a production start; every other item has a working default.

## 3. Environment contract

All values come from the host's environment or secret manager. Nothing is read from committed files, and `.env` files are never deployed. Start-up validates every variable and names a broken one without printing its value. Valid-but-risky production settings are logged as `config.warning`.

### API (`apps/api`)

| Variable | Required | Meaning |
|---|---|---|
| `NODE_ENV` | yes | `production` (Secure cookies, HSTS, strict checks) |
| `PORT` | no | Default 3000 |
| `DATABASE_URL` | yes | `postgresql://USER:PASSWORD@HOST:5432/DB?schema=public&sslmode=require` |
| `SESSION_SECRET` | yes | ≥ 32 random characters, unique per environment; rotating it signs everyone out |
| `FRONTEND_URL` | for a separate API origin | Exact website origin(s), comma-separated, https |
| `TRUST_PROXY` | behind a proxy | Number of proxy hops (usually 1); required for Secure cookies and per-client rate limits |
| `SESSION_COOKIE_SAMESITE` | no | `lax` (default, same-site), `strict`, or `none` (cross-site, production only) |
| `GOOGLE_CLIENT_ID` | no | Enables Google Sign-In; must equal `VITE_GOOGLE_CLIENT_ID` |
| `STORAGE_PROVIDER` | yes (prod) | Only `local` exists, and it is refused in production (KI-019) |
| `STORAGE_BUCKET` (+ adapter credentials) | with the adapter | Defined by the future object-storage adapter |
| `UPLOAD_SCANNER` | yes (prod) | `clamav` or `none` (an explicit decision) |
| `CLAMAV_HOST`, `CLAMAV_PORT`, `CLAMAV_TIMEOUT_MS` | with `clamav` | clamd address (port 3310), per-file timeout (30000 ms) |
| `UPLOAD_MAX_FILE_SIZE`, `UPLOAD_MAX_FILES` | no | Default 10 MiB per file, 5 files per order |
| `RATE_LIMIT_STORE` | no | `postgres` (production default) or `memory` |
| `LOG_LEVEL` | no | `info` (default), `debug`, `warn`, `error`, `silent` |

Operator commands additionally use `ADMIN_EMAIL`, `ADMIN_NAME` and `ADMIN_PASSWORD`, for one run only.

### Website (`apps/web`, build time — every `VITE_*` value is public)

| Variable | Meaning |
|---|---|
| `VITE_API_BASE_URL` | API origin, e.g. `https://api.mabaprinting.id`; empty = same origin (`/api` proxied). Production builds refuse a non-https remote URL. |
| `VITE_GOOGLE_CLIENT_ID` | Optional Google OAuth client ID (public identifier) |

Never give a server secret a `VITE_` prefix.

## 4. Build, migrate, start

| Step | Command (from the repository root unless noted) |
|---|---|
| Install | `npm ci` |
| Build everything | `npm run build` (shared → API → website). Website: set the `VITE_*` values before building. |
| Apply migrations (release step) | `npm run db:migrate:deploy` with the production `DATABASE_URL`, or the migrate image (section 6) |
| Start the API | `npm run start -w @maba-printing/api` (= `node dist/server.js` in `apps/api`) |
| Create the first Admin | `ADMIN_EMAIL=… ADMIN_NAME=… ADMIN_PASSWORD=… npm run start:admin-create -w @maba-printing/api` |
| Retention cleanup (daily) | `npm run start:files-cleanup -w @maba-printing/api` (= `node dist/cli/files-cleanup.js`) |
| Website | Upload `apps/web/dist/` to the website host, with the headers from section 5 |

Order for every release:

1. Back up the database.
2. Build.
3. Migrate (`migrate deploy`).
4. Start the new API.
5. Check readiness.
6. Publish the website.
7. Run the smoke test (section 9).

Migrations are additive and compatible with the previous API version, so a short overlap of old API and new schema is safe. Migrations never run automatically at API start-up.

## 5. Website security headers (KI-016)

The website must be served with the headers defined in `apps/web/hosting/security-headers.ts`. `vite preview` applies them, and `npm run test:e2e:preview -w @maba-printing/web` proves the production build works under them (no CSP violations on any public page).

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' https://accounts.google.com/gsi/client; style-src 'self' https://accounts.google.com/gsi/style; img-src 'self' https:; font-src 'self'; connect-src 'self' <API origin> https://accounts.google.com/gsi/; frame-src https://accounts.google.com/gsi/; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests` — without Google Sign-In, drop the Google sources and use `frame-src 'none'`. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (HTTPS only) |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` (Google Sign-In popup) |
| `Cache-Control` | `/assets/*`: `public, max-age=31536000, immutable`; everything else: `no-cache` |

Also required:

- **SPA fallback:** unknown paths serve `index.html` with status 200.
- `robots.txt` comes with the build.

Print the exact policy for an API origin with:

```bash
node --experimental-strip-types -e "import('./apps/web/hosting/security-headers.ts').then(m => console.log(m.websiteSecurityHeaders({ apiOrigin: 'https://api.example.test', googleSignIn: true, https: true })))"
```

## 6. API container image

```bash
docker build -f apps/api/Dockerfile -t maba-printing-api .                       # runtime
docker build -f apps/api/Dockerfile --target migrate -t maba-printing-api-migrate .  # release step
docker run --rm -e DATABASE_URL=… maba-printing-api-migrate                       # prisma migrate deploy
```

- **Base image:** multi-stage, Node 24 slim pinned by digest.
- **Install:** `npm ci` from the lockfile.
- **Runtime contents:** compiled code and production packages only (pruned by `apps/api/scripts/prune-runtime-deps.mjs`, about 96 MB of `node_modules`). There are no dev tools, sources, tests, `.env` files or storage.
- **User:** `node`, non-root; application files are read-only.
- **Health:** `HEALTHCHECK` on `/api/v1/health`.
- **Configuration:** everything comes through the environment (section 3).

Verified locally:
- the image refuses `NODE_ENV=production` with local storage;
- in development mode against the test database it is healthy and ready, and registration, sign-in (Argon2id), the catalog and the built `admin-create` work;
- the migrate image applies all migrations to an empty database and is a no-op on a second run.

## 7. Production database and document storage

### PostgreSQL

- **TLS:** use `sslmode=require`, or the provider's verify-full CA settings.
- **Connections:** the API uses Prisma's pool plus a 5-connection session-store pool. Allow ≥ 20 connections per instance, or use the provider's pooler in session mode.
- **Roles:** a runtime role with DML on the application tables, and a migration role (DDL) used only for `migrate deploy`. Neither may be a superuser.
- **Extensions and settings:** `gen_random_uuid()` is built into PostgreSQL 13+, so no extensions are needed. Store times in UTC (the columns are `timestamptz`).
- **Housekeeping:** expired sessions and rate-limit counters are pruned by the API itself. No manual vacuum schedule is required beyond the provider's autovacuum.
- **Backups:** automated backups or point-in-time recovery, plus a dump before each migration (BACKUP_RESTORE.md).

### Document storage (KI-019)

The production document store must be implemented as a `StorageService` adapter (`apps/api/src/storage/`). It must pass the contract suite in `apps/api/src/test/storage-contract.ts`, be registered in `storage-factory.ts`, and its provider name must be accepted by `parseStorageProvider`. Requirements:

- **Private:** no public ACLs and no public or predictable URLs; the bucket blocks public access.
- **Server-side access only:** the API streams downloads to authorized Admins. If short-lived signed URLs are ever used, mint them per request after authorization, with a lifetime of minutes (Architecture §41).
- **Credentials from the environment**, least privilege: put, get, delete and head on one bucket.
- **Never overwrite:** `put` must fail when the key exists (conditional write).
- **Encryption** at rest and TLS in transit.
- **Versioning** with a short expiry for old versions (BACKUP_RESTORE.md).

The production guard for `STORAGE_PROVIDER=local` must stay until such an adapter exists. No data migration from development storage is needed: production starts with an empty bucket.

## 8. Provider integration status (TASK-08.06)

| Integration | State | One-place change when chosen |
|---|---|---|
| Object storage | **Pending owner decision** | New adapter + `storage-factory.ts` + `parseStorageProvider`; pass the contract suite |
| Malware scanner | Ready (`clamav`) or explicit `none` | Run clamd; set the `CLAMAV_*` variables |
| Scheduler | **Pending host** | Run `start:files-cleanup` daily (OPERATIONS.md §3) |
| Website headers | Ready (policy and test) | Translate section 5 into the host's header configuration |
| Rate-limit store | Ready (`postgres`) | None |
| CI | Ready (`.github/workflows/ci.yml`) | Push to a GitHub repository; no secrets needed |

## 9. Smoke test after every deployment

Read-only: it sends only GET and CORS-preflight requests, and never creates orders, accounts or uploads.

```bash
npm run smoke -- --web https://www.mabaprinting.id --api https://api.mabaprinting.id
```

It checks:
- the website and its SPA routes;
- the security headers, asset caching and robots;
- API health, readiness, API headers and HSTS;
- the public settings (configured) and the catalog endpoints;
- CORS for the website origin, and refusal of other origins.

Exit code 0 means pass. Then sign in manually at `/admin/login` with a real Admin account, and open the dashboard.

## 10. Rollback

- **Application:** redeploy the previous image or build (website and API separately). Migrations are additive, so the previous API runs on the newer schema. The website calls only `/api/v1` endpoints that both versions serve.
- **Configuration:** revert the changed environment variable and restart. A rotated `SESSION_SECRET` cannot be undone without signing everyone out again.
- **Database:** there are no down-migrations. Fix forward with a new migration, or restore the pre-release backup into a new database (BACKUP_RESTORE.md) and accept losing the writes made since. Destructive migrations need explicit owner approval and a tested backup.

## 11. Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request with an ephemeral PostgreSQL service and synthetic credentials:
- format, lint and typecheck;
- the migration integrity check and Prisma validate;
- unit tests;
- a fresh database rebuilt from migrations, then the drift check and the DB tests;
- the build;
- Playwright on the dev server and on the production build with security headers;
- a container build check.

The local equivalent is `npm run verify` (plus `npm run verify:e2e`).
