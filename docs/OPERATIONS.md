# MABA PRINTING — Operations Runbook

Day-to-day operation of a deployed MABA PRINTING. Deployment itself is covered in [DEPLOYMENT.md](DEPLOYMENT.md), recovery in [BACKUP_RESTORE.md](BACKUP_RESTORE.md) and the threat model in [SECURITY.md](SECURITY.md).

## 1. Probes

| Endpoint | Meaning | Use |
|---|---|---|
| `GET /api/v1/health` → `{"status":"ok"}` | The process is alive. Never touches the database. | Liveness probe. A database outage must not restart a healthy process. |
| `GET /api/v1/readiness` → `{"status":"ready"}` / 503 `{"status":"unavailable"}` | Database reachable within 2 s, document storage configured, malware scanner (if any) answering. | Readiness or traffic probe, and deployment smoke checks. The failing check is logged (`readiness.failed`), never returned. |

## 2. Logs

- The API writes one JSON object per line: stdout for debug and info, stderr for warn and error.
- Every line has `time`, `level` and `event`.
- Level: `LOG_LEVEL` = `debug`, `info` (the default), `warn`, `error` or `silent`.

| Event | Level | Fields |
|---|---|---|
| `server.started` | info | port, production, storageProvider, rateLimitStore, uploadScanner |
| `http.request` | info (5xx: error; probes: debug) | requestId, method, route template, status, durationMs |
| `http.unhandled_error` | error | requestId, method, route template, category |
| `readiness.failed` | warn | check (database, storage or scanner), category |
| `upload.rejected_by_scanner` | warn | scanner, signature |
| `upload.scan_unavailable` | error | scanner, category |
| `order.file_compensation_failed` | error | count, storageKeys (random identifiers; delete those objects manually) |
| `session_store.error`, `db.session_pool_error` | error | context, category |
| `retention.cleanup` / `retention.file_failed` / `retention.cleanup_failed` | info / warn / error | counts / fileId / category |

- A customer reporting a problem can quote the `X-Request-ID` response header; search the logs for that `requestId`.
- Logs never contain request bodies, cookies, tokens, passwords, file names, document contents or Public Order IDs.

## 3. Operator commands

Run them from the API package with production environment variables. In a built deployment use `node dist/cli/<command>.js`; in development use `npm run <script> -w @maba-printing/api`.

| Command | Purpose | Notes |
|---|---|---|
| `admin:create` | Create an ADMIN, or promote an existing member with `-- --promote`. | Needs `ADMIN_EMAIL`, `ADMIN_NAME` and `ADMIN_PASSWORD` for that run only; prints the outcome only. There is no default Admin. |
| `files:cleanup` | Delete documents of orders completed at least 30 days ago. | Idempotent; skips if another run holds the lock; one JSON summary line; exit 0 = done or skipped, 1 = failure (retried next run). |

### Scheduling the retention cleanup (KI-018)

Configure the chosen host's scheduler (cron job, scheduled container task, platform cron, …) to run `files:cleanup` **once a day**, with the same environment as the API. The exact time does not matter. Alert when the exit code is non-zero on two consecutive days. Until a schedule exists, documents stay stored after their retention period — a privacy obligation, not a functional problem.

## 4. Database migrations in production

The schema changes only through committed migrations (ADR-020). Production uses **only** `prisma migrate deploy`.

1. **Back up** the database (`pg_dump`, BACKUP_RESTORE.md).
2. **Check**: `npx prisma migrate status` lists the pending migrations; read their SQL.
3. **Apply**: `npx prisma migrate deploy` (from `apps/api`, with the production `DATABASE_URL`). It applies pending migrations in order and never resets, drops or prompts.
4. **Start** the new API version, then check `GET /api/v1/readiness` and the smoke checks.

Never run in production:

- `prisma migrate dev` — it can reset the database;
- `prisma migrate reset`;
- `prisma db push` — schema push without a migration;
- ad-hoc SQL schema changes.

Do not edit an applied migration file; CI fails if one changes (`npm run check:migrations`).

### Rollback

- **Application:** redeploy the previous build. All migrations in this repository are additive (new tables, columns, indexes or constraints), so the previous API version runs against the newer schema.
- **Database:** Prisma has no down-migrations. Reverting a schema change means writing a new forward migration, or restoring the pre-migration backup — and losing writes made since then. A destructive migration (dropping or renaming data) requires explicit owner approval and a tested backup first. Rollback of data is never automatic.

## 5. Rate limiting

- `RATE_LIMIT_STORE=postgres` (the production default) keeps the counters in `rate_limit_counters`, shared by every API instance and kept across restarts. Expired rows are pruned automatically.
- Behind a proxy or load balancer, set `TRUST_PROXY` to the number of hops, so limits apply per client and not per proxy.
- To release a locked-out client, delete its row (`DELETE FROM rate_limit_counters WHERE key LIKE 'auth-sign-in:%<ip>'`).

## 6. Malware scanning

- `UPLOAD_SCANNER=clamav` needs a reachable clamd (`CLAMAV_HOST`, `CLAMAV_PORT`). Keep its signatures updated (`freshclam`), and set `StreamMaxLength` to at least `UPLOAD_MAX_FILE_SIZE`.
- While clamd is down, uploads are refused with 503 and readiness reports unavailable; orders without files still work.
- `UPLOAD_SCANNER=none` accepts documents unscanned. It must be a deliberate, recorded owner decision.

## 7. Routine checks

- Daily: the retention job's exit status, and error-level log lines.
- Weekly: Admin audit log review (unexpected settings or QRIS changes), Admin account list, backup success.
- On staff changes: deactivate departing Admins with `UPDATE users SET is_active = false WHERE email = '…';`. The API re-reads the active state on every request, so their sessions stop working immediately. Promote new ones with `admin:create`.
