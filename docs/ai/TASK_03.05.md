# TASK-03.05 — Logout & Session Lifecycle

Phase: 03 — Authentication & Identity

## Objective

`POST /api/v1/auth/logout` ends the server session completely; session
expiry is defined and enforced.

## Source Requirements

PRD §5 (Member logout); Architecture §15; PHASE_03.md "Session
Architecture".

## Implementation Scope

- Logout (CSRF-protected): destroy the store row, clear `maba.sid` with the
  same attributes, 200 `{ data: null }`; harmless when already signed out.
- Lifetime: 7 days (cookie maxAge and absolute `authenticatedAt` check);
  no "remember me". Store pruning by `connect-pg-simple` (every 15 min in
  the running API; disabled in tests).

## Security Requirements

The server session must not survive logout; protected routes return 401 and
`me` returns null afterwards; replaying the old cookie does not
re-authenticate.

## Exclusions

Logout-all-devices, session management UI.

## Verification Criteria

DB tests: row deleted, Set-Cookie clears the cookie, `me` null, profile 401,
old cookie replay unauthenticated, logout without a token 403.

## Project Memory

Lifetime and cleanup policy.

## Stop Conditions

None beyond phase rules.
