# TASK-03.03 — Email/Password Login

Phase: 03 — Authentication & Identity

## Objective

`POST /api/v1/auth/login` authenticates an active password account and
rotates the session.

## Source Requirements

PRD FR-AUTH-003, §26; Architecture §15, §17, §19; PHASE_03.md "Passwords &
Email".

## Implementation Scope

- Strict body `{ email, password }`; same normalization as registration.
- Service: credential lookup → Argon2id verify (dummy hash when the user is
  missing or has no password) → active check → session regenerate →
  `AuthUserDto`.
- One failure: 401 "Invalid email or password" for unknown email, wrong
  password, Google-only account and inactive account.

## Security Requirements

No account-existence signal in status, message or a dramatic timing gap;
CSRF required (login-CSRF); session ID and CSRF token rotated; ADMIN accounts
can authenticate at the session level (Admin UX is later) but never gain
anything from client input.

## Exclusions

Rate limiting (TASK-03.09), Admin login UX.

## Verification Criteria

DB tests: valid login, bad password, unknown email, Google-only, inactive,
mixed-case email, identical failure bodies, rotation; Argon2 dummy path
exercised.

## Project Memory

Failure semantics and timing mitigation.

## Stop Conditions

None beyond phase rules.
