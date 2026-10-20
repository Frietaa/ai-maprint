# TASK-03.02 — Email/Password Registration

Phase: 03 — Authentication & Identity

## Objective

`POST /api/v1/auth/register` creates a MEMBER account with an Argon2id
password hash and signs the new member in.

## Source Requirements

PRD FR-AUTH-002, §26 (secure hashing, never trust role claims);
Architecture §16 (identity), §17 (Argon2id), §12 (route → validator →
controller → service → repository); KI-008 (email normalization).

## Implementation Scope

- Dependency: `@node-rs/argon2` (Argon2id; parameters documented).
- `normalizeEmail` helper; password hashing module (hash, verify, dummy).
- Concrete `user.repository.ts` (explicit selects; `passwordHash` only in the
  credential lookup).
- Strict Zod body: `name`, `email`, `password`, optional `whatsapp`;
  unknown keys (e.g. `role`) → 400.
- Service: normalize → conflict check → hash → create MEMBER → session
  regenerate (new ID + new CSRF token) → safe `AuthUserDto`. 201.
- Duplicate email (any case) → 409 "Email already registered"; a unique
  race (P2002) maps to the same 409.

## Security Requirements

Role always MEMBER; password never trimmed, 8–128 chars, rejected before
hashing when longer; response never contains hash/googleId/ids of session;
CSRF required; no email verification system invented.

## Exclusions

Login, Google, profile, UI.

## Verification Criteria

DB tests: success, normalized email, duplicate + case-insensitive duplicate,
role injection rejected, hash stored (Argon2id `$argon2id$` prefix), no hash
in response, session created and cookie rotated, CSRF enforced; validator
unit tests.

## Project Memory

Hash algorithm/parameters, validation limits, conflict semantics.

## Stop Conditions

Argon2id cannot be installed/executed → AWAITING_APPROVAL (no weaker
fallback).
