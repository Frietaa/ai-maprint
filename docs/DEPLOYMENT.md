# MABA PRINTING — Deployment Guide

Status: **deployment-ready, pending provider selection.** No hosting, database, storage, scanner or scheduler provider has been chosen (KI-001, ADR-022). This guide describes what any provider must offer and how to deploy once one is chosen. It does not deploy anything.

> Sections marked *(Phase 08)* are completed by the deployment-readiness phase.

## Website security headers (KI-016)

The website (`apps/web/dist`, a static single-page app) must be served with the headers defined in `apps/web/hosting/security-headers.ts`. `vite preview` applies them, and `npm run test:e2e:preview -w @maba-printing/web` proves that the production build works under them (no CSP violations on any public page).

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

- **SPA fallback:** unknown paths serve `index.html` with status 200, so client routes such as `/account/orders` load.
- `robots.txt` is part of the build.

Print the exact policy for a given API origin with:

```bash
node --experimental-strip-types -e "import('./apps/web/hosting/security-headers.ts').then(m => console.log(m.websiteSecurityHeaders({ apiOrigin: 'https://api.example.test', googleSignIn: true, https: true })))"
```

## Document storage (KI-019)

The production document store must be implemented as a `StorageService` adapter (`apps/api/src/storage/`). It must pass the contract suite in `apps/api/src/test/storage-contract.ts`, be registered in `storage-factory.ts`, and its provider name must be accepted by `parseStorageProvider`. Requirements for the store:

- **Private:** no public ACLs, no public or predictable URLs; the bucket or container blocks public access.
- **Server-side access only:** the API streams downloads to authorized Admins. If short-lived signed URLs are ever used, they must be minted per request after authorization and expire within minutes (Architecture §41).
- **Credentials from the environment** (e.g. `STORAGE_BUCKET` plus the provider's access-key variables), least privilege (put, get, delete and head on one bucket).
- **Never overwrite:** `put` must fail when the key exists (conditional write).
- **Encryption at rest**; TLS in transit.
- **Versioning or replication** with a short expiry for old versions (BACKUP_RESTORE.md).
- **Region and latency** close to the API.

Until such an adapter exists, `NODE_ENV=production` refuses to start with `STORAGE_PROVIDER=local`. That guard must stay.

Migrating from local development storage: none is needed. Development files are synthetic and stay in development. Production starts with an empty bucket.

## Malware scanning

Choose one, and record the decision:

- **ClamAV (self-hosted, open source):** run clamd next to the API (container or service), set `UPLOAD_SCANNER=clamav`, `CLAMAV_HOST` and `CLAMAV_PORT`, keep signatures updated, and set `StreamMaxLength` ≥ `UPLOAD_MAX_FILE_SIZE`.
- **No scanning:** `UPLOAD_SCANNER=none`, an explicit acceptance of the residual risk (SECURITY.md §3.7).

## Topology, environment, commands, CI, smoke tests and rollback *(Phase 08)*
