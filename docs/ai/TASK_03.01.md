# TASK-03.01 — Auth Architecture, Session & Security Foundation

Phase: 03 — Authentication & Identity

## Objective

Establish the secure foundation every later auth task builds on: session
middleware with a PostgreSQL store, the `user_sessions` migration, session
secret configuration, credentialed CORS, CSRF protection, shared auth
contracts and the auth DB-test harness.

## Source Requirements

Architecture §15 (server-managed session, no localStorage token, HttpOnly,
Secure, SameSite), §20 (CSRF, credentialed CORS allowlist), §21/§50
(migration workflow), §43 (SESSION_SECRET, FRONTEND_URL), §54 (health stays
minimal); PHASE_03.md "Session Architecture", "CSRF & CORS".

## Implementation Scope

- Dependencies (API): `express-session`, `connect-pg-simple` (+ types).
- Prisma model `UserSession` → table `user_sessions` (sid PK, sess json,
  expire timestamp(6) + index), one additive migration, applied to dev,
  test database rebuilt from migrations.
- `config/env.ts`: `SESSION_SECRET` (required, ≥ 32 chars, never echoed),
  `NODE_ENV`-aware secure cookie, `TRUST_PROXY` (hop count).
- `createApp` auth options: secret, store, secure flag, injectable
  collaborators; health and public read routes stay session-free.
- `GET /api/v1/auth/csrf`, CSRF middleware for unsafe methods.
- CORS: credentials, POST/PATCH, `X-CSRF-Token`.
- Shared contracts: auth paths, CSRF header, role list, limits, DTOs.
- Local dev `SESSION_SECRET` generated into the git-ignored `apps/api/.env`.
- Test helper for auth DB tests (real PG session store on the test DB,
  deterministic cleanup).

## Security Requirements

Cookie HttpOnly / SameSite=Lax / Secure in production; signed opaque ID
only; no fallback secret; CSRF token from `crypto.randomBytes`, compared with
`timingSafeEqual`; no session row for plain browsing; never `*` CORS.

## Exclusions

No register/login/Google/profile endpoints yet, no UI, no rate limiting.

## Verification Criteria

Migration SQL reviewed (only `user_sessions` + index; no DROP/TRUNCATE/
DELETE/CASCADE), previous migrations byte-identical, dev + test migration
status clean, no drift; CSRF tests (missing/wrong/correct token); CORS
credential tests; health independent of session/DB; lint, typecheck, tests.

## Project Memory

Record library versions, cookie/session decisions, migration review and the
startup change (SESSION_SECRET now required).

## Stop Conditions

Migration contains anything beyond session infrastructure; dev DB would need
reset; a compatible maintained session store is unavailable.
