# TASK-03.07 — Member Profile

Phase: 03 — Authentication & Identity

## Objective

Members read and edit their basic profile through
`GET/PATCH /api/v1/account/profile`.

## Source Requirements

PRD §5 (Member manages basic profile), FR-AUTH (WhatsApp is contact/profile
information); Architecture §13 (member endpoints), §19.

## Implementation Scope

- Routes require an authenticated MEMBER (401 / 403).
- `ProfileDto`: name, email, whatsapp, sign-in methods (password / Google
  booleans). No ids, role-edit, Google subject or hashes.
- PATCH strict body: `name` and/or `whatsapp` (`null`/empty clears it);
  empty body → 400; unknown keys (role, email, isActive, …) → 400.
- WhatsApp: trimmed, digits/spaces/dashes with optional leading `+`, 8–15
  digits, ≤ 20 characters. No international phone library.

## Security Requirements

Updates only the caller's own row (id from the server principal); CSRF
required; bounded input.

## Exclusions

Email change, password change, account deletion, order history.

## Verification Criteria

DB tests: GET, PATCH name/whatsapp, clear whatsapp, invalid input, empty
body, role/email mutation rejected, unauthenticated 401, ADMIN 403, CSRF.

## Project Memory

Editable-field policy.

## Stop Conditions

None beyond phase rules.
