# TASK-03.09 — Authentication Security Hardening & E2E

Phase: 03 — Authentication & Identity

## Objective

Close the Phase-02 hardening finding for the auth surface and prove the
member journeys end-to-end in a real browser against the test database.

## Source Requirements

PRD §26 (reasonable rate limits); Architecture §42 (security headers, rate
limiting, request limits), §46 (request IDs, never log secrets), §48 (E2E:
Member auth).

## Implementation Scope

- `helmet` with API-appropriate configuration (CSP `default-src 'none'`,
  `frame-ancestors 'none'`, CORP same-site, `X-Frame-Options: DENY`).
- `express-rate-limit`: login + Google (failed attempts), register; 429 in
  the standard error shape; limits injectable for tests; in-process store
  documented as a scaling limitation.
- `X-Request-ID` (server-generated UUID) on every response, exposed to CORS
  callers, included in unexpected-error logs together with method, path and
  error name/code only (no request bodies, no error objects).
- Bounded JSON body (10 kB) → 413 in the standard shape.
- Playwright (Chromium, real API on `maba_printing_test`, PostgreSQL session
  store): sign-up → account → edit profile → reload persists → logout →
  account redirects to login; fixture member login/logout; Continue as Guest
  creates no user; CSRF representative check. Teardown removes E2E users and
  sessions from the test database only.

## Security Requirements

No secrets, passwords, tokens or session payloads in logs or responses; no
security theatre.

## Exclusions

Distributed rate-limit store, full logging platform, frontend hosting
headers (deployment phase), live Google E2E (covered by backend integration
and component tests).

## Verification Criteria

Header/limit/request-ID/413 tests; all unit, DB and E2E suites green;
responsive auth pages at 360/768/1280 without horizontal overflow.

## Project Memory

Hardening state, remaining limitations, E2E coverage boundary.

## Stop Conditions

E2E would need the development database.
