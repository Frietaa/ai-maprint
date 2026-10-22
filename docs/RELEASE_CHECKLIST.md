# MABA PRINTING — Release Checklist

Use this for every production release. Tick items in the release record (issue, ticket or notes), never in this file.

## A. Before the first production release (owner decisions)

- [ ] Domain registered in the business's name; website and API on the same site (DEPLOYMENT.md §1)
- [ ] Website host, API host, managed PostgreSQL chosen (DEPLOYMENT.md §2)
- [ ] Private object storage chosen **and its `StorageService` adapter implemented and passing the contract suite** (KI-019 — the production start is blocked until then)
- [ ] Malware scanning decided: clamd deployed (`UPLOAD_SCANNER=clamav`) or `none` explicitly accepted and recorded
- [ ] Daily scheduler for `files:cleanup` configured (KI-018)
- [ ] RPO/RTO and backup retention decided (BACKUP_RESTORE.md §4)
- [ ] Website security headers configured on the host (DEPLOYMENT.md §5, KI-016)
- [ ] Production secrets generated and stored in the host's secret manager only: `SESSION_SECRET`, database credentials, storage credentials
- [ ] Optional: Google OAuth client with the production website origin

## B. Every release

### Before
- [ ] CI green on the release commit (`.github/workflows/ci.yml`), or locally: `npm run verify` and `npm run verify:e2e`
- [ ] `npm run check:migrations` reports no modified migration; any new migration reviewed as additive
- [ ] Database backup taken (`pg_dump`), stored encrypted
- [ ] Release notes: changes, migrations, configuration changes

### Release
- [ ] `prisma migrate deploy` (migrate image or `npm run db:migrate:deploy`), never `migrate dev`, `reset` or `db push`
- [ ] New API version started; `GET /api/v1/readiness` → `{"status":"ready"}`
- [ ] Website build (with production `VITE_*` values) published

### After
- [ ] `npm run smoke -- --web <website> --api <api>` → `SMOKE PASS`
- [ ] Manual: sign in at `/admin/login`, open the dashboard; open one public page per business line
- [ ] Logs: no `level:"error"` lines and no `config.warning` that was not expected
- [ ] On failure: roll back (DEPLOYMENT.md §10)

### First release only
- [ ] First Admin created with `start:admin-create`, and `ADMIN_PASSWORD` removed from the environment
- [ ] Business Settings filled in by the Admin: business name, WhatsApp number, logo, QRIS image (https URL or website path), social links, public information
- [ ] Locations, opening hours, services, products and prices entered
- [ ] One real end-to-end order placed by the owner as a customer, then processed and cancelled or completed by an Admin (a deliberate manual acceptance test, not part of the automated smoke)

## C. Production readiness audit (Architecture §63)

| §63 item | Evidence in the repository | Production status |
|---|---|---|
| Build | `npm run build`; container image builds (CI `image` job) | Ready |
| Migrations | 8 additive migrations, `check:migrations`, fresh rebuild + no drift in CI, migrate image | Ready |
| HTTPS | HSTS (API in production, website policy), Secure cookies, https-only production API URL check | Host must terminate TLS |
| Secure cookie / CORS / CSRF topology | `HttpOnly`, `Secure`, `SameSite` configurable (default Lax), exact-origin CORS, synchronizer CSRF token | Same-site domain recommended |
| Database | Prisma + PostgreSQL 17 tested; guidance in DEPLOYMENT.md §7 | Provider pending |
| Private storage | `StorageService` boundary, contract suite, production guard | **Adapter pending provider (blocker)** |
| Google configuration | Server-side ID-token verification; optional | Owner creates the OAuth client |
| Guest / Member / Admin critical flows | Playwright journeys and accessibility/responsive regression (29), DB tests (336), release-candidate live journey (67 checks) | Ready |
| Upload / download authorization | DB tests, file security tests, malware-scanning boundary | Scanner decision pending |
| Safe tracking DTO | DB tests and live checks; no payment state for guests | Ready |
| QRIS / Cash | Manual Admin confirmation, customer payment information | Ready (owner uploads the QRIS image to a host) |
| WhatsApp deep link | Receipt and payment hand-off links | Ready (number from Business Settings) |
| Responsive UI | Playwright responsive specs (360 px), Admin small screens | Ready |
| Non-sensitive logging | Structured logs, route templates, redaction tests | Ready |
