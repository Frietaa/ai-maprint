# MABA PRINTING — Security & Threat Model

This document describes what MABA PRINTING protects, against whom, and how. Every mitigation listed exists in the code (file references) or is an explicit deployment requirement (marked **Deployment**). It complements the frozen PRD (§26) and Architecture (§15–§20, §34–§42); it does not change them.

## 1. Assets

| Asset | Why it matters |
|---|---|
| Customer documents (printing uploads) | Private coursework, IDs, contracts; must never be public (ADR-014). |
| Customer contact data (name, WhatsApp, email, pickup address) | Personal data in order snapshots. |
| Member and Admin accounts | Sessions grant order history (member) or full operations (Admin). |
| Order integrity (status, prices, payments) | Money and trust; Admin-controlled and audited. |
| Business settings (WhatsApp number, QRIS image) | A tampered QRIS would redirect customer payments. |
| Secrets: `SESSION_SECRET`, `DATABASE_URL`, storage/scanner credentials | Full compromise if leaked. |

## 2. Actors

- **Guest / customer** — anonymous; can submit orders and track by Public Order ID.
- **Member** — signed-in customer; sees only own orders.
- **Admin** — trusted staff; equal permissions (ADR-017); actions audited.
- **Operator** — runs deployment and the operator commands (`admin:create`, `files:cleanup`).
- **Attacker** — anonymous internet user, a malicious member, or someone holding a stolen Public Order ID or session.

## 3. Attack surfaces, threats and mitigations

### 3.1 Public read API (`/public/settings`, `/locations`, `/services`, `/products`)
- *Threat:* data leakage of inactive or internal fields; huge responses (resource exhaustion).
- *Mitigations:* explicit allow-list mappers (`apps/api/src/mappers/public-dto.mapper.ts`); strict query schemas, no `activeOnly` escape hatch (`validators/public-query.validator.ts`); bounded catalog pages, max 100 rows (KI-012 resolved); no session or cookie on these routes (`app.ts`).

### 3.2 Authentication (`/auth/*`)
- *Threats:* credential stuffing, account enumeration, session fixation, login CSRF, token theft.
- *Mitigations:*
  - Argon2id (m=19 MiB, t=2, p=1) and a dummy hash for unknown accounts (`utils/password.ts`);
  - normalized emails with a case-insensitive unique index (KI-008);
  - sign-in failure and registration rate limits (`middleware/rate-limit.ts`);
  - a new session ID on every sign-in (`middleware/session.ts`, fixation defense);
  - the CSRF synchronizer token is required on sign-in too (`middleware/csrf.ts`);
  - `HttpOnly` cookie `maba.sid`, `SameSite=Lax`, `Secure` in production, 7-day absolute lifetime, sessions stored server-side in PostgreSQL;
  - no token in `localStorage` (`apps/web/src/lib/api-client.ts`).
- *Google:* the ID token is verified server-side with the configured audience (`services/google-identity.ts`). There is no automatic linking to password accounts (KI-017, accepted), and Google never signs into an ADMIN.
- *Residual:* registration reveals that an email exists (409), which is inherent to sign-up and rate-limited. There is no email verification or password reset yet.

### 3.3 Authorization (member and Admin)
- *Threats:* horizontal access (Member A → Member B's order), vertical escalation (member → Admin), forged role claims.
- *Mitigations:*
  - the role and active state are re-read from the database on every request (`middleware/authenticate.ts`);
  - `requireRole('ADMIN')` covers the whole `/api/v1/admin` router (`routes/admin.routes.ts`);
  - member queries filter by both owner and Public ID, so another member's order is indistinguishable from a missing one (`repositories/order.repository.ts`);
  - public registration only ever creates MEMBER;
  - Admins are created only by the operator CLI (`admin:create`), never over HTTP.

### 3.4 CSRF and CORS
- *Mitigations:*
  - a 32-byte synchronizer token bound to the session, compared in constant time, required for every unsafe method;
  - an exact-origin credentialed CORS allowlist (`FRONTEND_URL`) — never `*`, never a reflected unlisted origin (`middleware/cors.ts`);
  - preflight allows only the needed methods and headers.
- **Deployment:** the website and the API should be same-site (e.g. `www.` and `api.` of one domain). Cross-site deployment needs `SameSite=None` cookies, which modern browsers increasingly block (see DEPLOYMENT.md).

### 3.5 Order submission (`POST /orders`)
- *Threats:* spam or flooding, price tampering, privileged-field injection, duplicate orders.
- *Mitigations:*
  - a per-IP submission rate limit;
  - strict schemas — unknown fields are rejected, and status, prices, `userId` and payment can never be supplied;
  - ATK prices and snapshots are server-authoritative (`services/order.service.ts`);
  - one transaction per order;
  - an `Idempotency-Key` with server-side hashed records (KI-020 resolved).

### 3.6 Tracking capability IDs (`GET /orders/track/:publicId`)
- *Threats:* guessing or enumerating IDs; leaking private data to whoever holds an ID.
- *Mitigations:*
  - IDs carry 65 random bits (`utils/public-order-id.ts`), with exact match only;
  - the response is a safe minimum: type, status, dates, location name and timeline, with no contact data, files, prices or payment state (PRD §16);
  - a separate rate limit, and no session created;
  - request logs record the route template, never the ID (`middleware/request-log.ts`).

### 3.7 Uploads
- *Threats:* malware, disguised executables, path traversal, oversized or zip-bomb style uploads, filename injection.
- *Mitigations:*
  - multer streams to a private temp directory under random names, with count, size and part limits enforced while reading;
  - the content signature is checked against the declared type, and the six allowed types are validated by content, not by extension (`uploads/file-validation.ts`);
  - original names are sanitized display metadata only;
  - random 128-bit storage keys, validated before any path is built, with root-escape checks (`storage/local-storage.ts`);
  - temp files are deleted after every request;
  - storage compensation on failure;
  - **malware scanning** through `UPLOAD_SCANNER` (`uploads/file-scanner.ts`): ClamAV over clamd INSTREAM, infected files rejected (422), scanner errors fail closed (503). Production refuses to start without an explicit choice.
- *Residual:* with `UPLOAD_SCANNER=none` there is no malware detection, so documents must be treated as untrusted by staff. Downloads are always attachments (see 3.8).

### 3.8 Downloads (`/admin/orders/:publicId/files/:fileId/download`)
- *Mitigations:*
  - Admin only, and the file must belong to the order and not be deleted;
  - sent as `Content-Disposition: attachment` with the stored MIME type, `X-Content-Type-Options: nosniff` and `Cache-Control: private, no-store`;
  - its own rate limit, and every download is audited;
  - no static file serving anywhere (KI-019 storage is private).

### 3.9 Business settings and image references (QRIS, logo, products)
- *Threats:* a malicious or compromised Admin points the QRIS at an attacker's image; `javascript:` or `data:` URLs; protocol-relative tricks.
- *Mitigations:*
  - `safeImageRef` (`packages/shared/src/image-ref.ts`) accepts only https URLs with a host, or root-relative paths without `//`, `/\` or `..`;
  - it is applied by Admin validation, again before the public settings are published, and again in the browser;
  - settings changes are audited (`BUSINESS_SETTINGS_UPDATED`).
- *Residual:* an Admin can legitimately set any https QRIS image. Admin accounts must therefore be few, use strong passwords and be removed promptly when staff leave.

### 3.10 Admin operations and audit
- *Mitigations:*
  - every sensitive mutation writes an `admin_audit_logs` row in the same transaction (status, pricing, notes, payment, downloads, catalog, locations, settings);
  - no API edits or deletes audit rows;
  - audit metadata never contains passwords, tokens, note text or file contents;
  - optimistic concurrency on status changes (409);
  - there are no hard deletes.

### 3.11 Rate limiting
- *Mitigations:* per-IP limits on sign-in failures, registration, order submission, tracking, Admin mutations and downloads. `RATE_LIMIT_STORE=postgres` (the default in production) shares counters across instances and restarts (KI-015).
- **Deployment:** set `TRUST_PROXY` to the real number of proxy hops, or every client appears to have the proxy's IP.

### 3.12 Retention
- Documents of COMPLETED orders are deleted 30 days after completion by the idempotent cleanup command, guarded by an advisory lock (ADR-013, KI-018).
- **Deployment:** schedule the command daily.

### 3.13 Operator commands
- `admin:create` reads the email, name and password from the environment, hashes with Argon2id and prints only the outcome; an existing member is promoted only with `--promote`.
- `files:cleanup` prints counts only.
- Neither command is reachable over HTTP.
- **Deployment:** run them from a trusted shell, and remove `ADMIN_PASSWORD` from the environment afterwards.

### 3.14 Transport and headers
- **API:** helmet sets:
  - CSP `default-src 'none'`;
  - `frame-ancestors 'none'`;
  - `X-Frame-Options DENY`;
  - nosniff;
  - `no-referrer`;
  - CORP `same-site`;
  - HSTS in production (`middleware/security-headers.ts`).
- **Website:** `apps/web/hosting/security-headers.ts` defines:
  - a CSP allowing only the site, the API origin, https images and Google Identity Services, with no inline script;
  - COOP, Permissions-Policy, nosniff and Referrer-Policy;
  - HSTS over HTTPS.

  It is verified against the production build (`npm run test:e2e:preview -w @maba-printing/web`).
- **Deployment:** the host must send these headers (KI-016), and serve HTTPS only.

### 3.15 Logging and error handling
- Responses never contain stack traces, SQL or configuration (`middleware/error-handler.ts`).
- Logs are structured JSON with the request ID, method, route template, status, duration and error category.
- Logs never contain bodies, cookies, tokens, passwords, file names or Public Order IDs; field names that look like secrets are dropped (`observability/logger.ts`).

### 3.16 Secrets and supply chain
- Secrets come only from the environment and are validated at startup without echoing values (`config/env.ts`).
- `.env` files are git-ignored, and only `.env.example` templates with placeholders are tracked.
- Dependencies are pinned through `package-lock.json`, and CI installs with `npm ci`.

## 4. Residual risks and owner decisions

| Risk | Status |
|---|---|
| No production object storage adapter yet | Production refuses to start (KI-019) until a private object store is chosen and implemented. |
| Malware scanning needs a running clamd (or an accepted `none`) | Owner and operator decision (KI-019). |
| Website headers depend on the chosen host | KI-016, see DEPLOYMENT.md. |
| No email verification or password reset | Accepted for the MVP; account recovery goes through the business (WhatsApp). |
| Public Order IDs are bearer capabilities | Customers should share them only with trusted people; they cannot reveal private data. |
| Admin compromise | Strong passwords, few Admins, audit log review. No MFA in the MVP. |

## 5. Reporting

Security problems should be reported privately to the business owner (see the contact in Business Settings), not in public issues.
