# TASK-03.06 — Google Sign-In

Phase: 03 — Authentication & Identity

## Objective

`POST /api/v1/auth/google` signs a member in with a Google ID token that is
verified server-side.

## Source Requirements

PRD FR-AUTH-004, §26 (backend Google verification); Architecture §18
(Google never grants ADMIN), §43 (GOOGLE_CLIENT_ID, VITE_GOOGLE_CLIENT_ID);
ADR-006.

## Implementation Scope

- Dependency: `google-auth-library` (`OAuth2Client.verifyIdToken`).
- `GoogleIdentityVerifier` interface; production implementation built from
  `GOOGLE_CLIENT_ID`; absent configuration → endpoint 503.
- Strict body `{ credential }` (≤ 4096 chars).
- Resolution rules from PHASE_03.md: linked googleId → user (active only);
  unverified email → 401; unknown email → new MEMBER (`passwordHash` null);
  existing email without this Google identity → 409 (no auto-link; ADMIN
  untouched); session regenerated on success.

## Security Requirements

No decoded-but-unverified payloads, no client role/user id/verified flag,
no stored Google tokens, no request-selectable verifier or magic credential;
`GOOGLE_CLIENT_SECRET` is not needed by the ID-token flow and is not read.

## Exclusions

Live Google calls in automated tests, account-linking UI.

## Verification Criteria

Unit tests of the verifier mapping (audience passed, unverified email, bad
token → generic error); DB tests with a fake verifier: new member, existing
Google identity, email conflict (password account, ADMIN), unverified email,
invalid credential, inactive Google user, role always MEMBER, 503 when not
configured, CSRF enforced.

## Project Memory

Linking policy and rationale; local-development limitation.

## Stop Conditions

A Google verification approach that requires trusting the browser.
