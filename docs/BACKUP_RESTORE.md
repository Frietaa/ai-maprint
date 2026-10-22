# MABA PRINTING — Backup & Restore

What must be backed up, how to back it up, how to restore it, and how the procedure was rehearsed. The concrete schedule and retention period depend on the production database and storage providers, which are not chosen yet (KI-001).

## 1. What holds data

| Data | Where | Backed up by |
|---|---|---|
| Orders, items, payments, status history, audit log, accounts, sessions, catalog, locations, Business Settings (WhatsApp number, QRIS reference, social links) | PostgreSQL | Database backups (section 2) |
| Customer documents | Private document storage (`StorageService`; local adapter in development, a private object store in production) | Storage versioning or replication (section 3) |
| Rate-limit counters, idempotency keys, sessions | PostgreSQL | Included in the database backup. All are disposable: restoring an older copy is harmless, at worst signing members out. |

The QRIS and logo images are owner-hosted files (https URLs or website paths, ADR-023). Keep the originals with the owner.

## 2. PostgreSQL

### Backup

Use the provider's automated backups or point-in-time recovery when available. Add a logical dump before every production migration and on a regular schedule:

```bash
pg_dump --format=custom --no-owner --file=maba-$(date +%Y%m%d-%H%M).dump "$DATABASE_URL"
```

- Store dumps encrypted, outside the database host, with access limited to the operator. Dumps contain personal data (customer snapshots, contact data) and password hashes.
- Never commit dumps to Git (`*.dump` must stay out of the repository).

### Restore

Restore into a **new, empty** database, verify it, then point the API at it. Never restore over a database that is still in use.

```bash
createdb maba_printing_restore
pg_restore --no-owner --exit-on-error --dbname=maba_printing_restore maba-YYYYMMDD-HHMM.dump
DATABASE_URL=postgresql://…/maba_printing_restore npx prisma migrate status   # "Database schema is up to date!"
```

Then:
1. stop the API;
2. switch `DATABASE_URL`;
3. start the API;
4. check `GET /api/v1/readiness`;
5. run the read-only smoke checks (DEPLOYMENT.md).

If the backup is older than the current code, run `prisma migrate deploy` after the restore.

### Rehearsal (2026-10-22, TASK-07.08)

1. Seeded the test database `maba_printing_test` with the synthetic development seed and dumped it with `pg_dump -Fc`.
2. Restored the dump with `pg_restore --no-owner --exit-on-error` into the throwaway database `maba_printing_restore_check`.
3. Compared both databases:
   - per-table row counts and content hashes for all 16 application tables were identical;
   - the migration history was identical;
   - `prisma migrate status` reported the restore up to date.
4. Dropped the throwaway database and rebuilt the test database empty.

The development database was not involved.

## 3. Customer documents

The production object store must provide (see DEPLOYMENT.md, "Document storage"):

- **Object versioning or replication**, so a deleted or overwritten object can be recovered within the backup window.
- **Lifecycle rules that do not fight retention.** The application deletes documents 30 days after an order completes (ADR-013). Old object versions should expire on a short schedule (e.g. 7–30 days), so the retention promise is not undermined by backups kept forever.
- Private access only; no public ACLs or public URLs.

Database and storage backups are taken independently. After restoring an older database, a few `order_files` rows may point to objects already deleted by retention, or newer objects may have no row. The Admin download then answers 404 "File not found" for those rows; it never exposes another file. Orphaned objects are harmless and can be removed by key.

## 4. Recovery objectives

The business has not specified a recovery point objective (RPO, maximum acceptable data loss) or recovery time objective (RTO, maximum acceptable downtime). **They are undecided.** Choose them with the providers. Typical managed-PostgreSQL defaults are daily backups with 7 days of history; point-in-time recovery reduces the RPO to minutes. No guarantee is made by this repository.
