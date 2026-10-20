# PHASE 03 — Authentication & Identity

## Status

ACCEPTED / COMPLETE (human-approved 2026-10-21; verification PASS)

## Objective

Give MABA PRINTING secure, optional consumer accounts: Email + Password
registration and login, Google Sign-In, a server-managed session, logout,
the current-user endpoint and a basic member profile — while Guests keep
using the public website without any account or session.

At the end of Phase 03 a visitor can sign up, sign in (password or Google),
see and edit their profile at `/account`, sign out, or simply continue as a
guest. The backend identity/session foundation is role-aware (MEMBER and
ADMIN) so the later Admin phase can reuse it; the Admin product experience
itself is not built here.

---

## Source of Truth

1. docs/PRD_MABA_PRINTING_v1.0.md (frozen)
2. docs/ARCHITECTURE_MABA_PRINTING_v1.0.md (frozen)
3. docs/ai/DECISIONS.md (ADR-006 Member Authentication)
4. docs/ai/MASTER_PROMPT.md
5. Project Memory (PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI, KNOWN_ISSUES)
6. This phase specification
7. The active TASK_03.xx.md

Relevant frozen requirements: PRD §5 (roles), §6 FR-AUTH-001..005, §24
(sitemap /auth, /account), §26 (security), §28 (error handling: 401/403);
Architecture §8 (routes), §9 (state), §13 (auth/member endpoints), §15–§20
(session, identity, passwords, Google, authorization, CSRF/CORS), §42
(security middleware), §43 (environment), §45 (errors), §46 (request IDs),
§48 (testing), §50 (migration workflow), §53 (same-site deployment).

---

## Planned Tasks

- TASK-03.01 — Auth Architecture, Session & Security Foundation
- TASK-03.02 — Email/Password Registration
- TASK-03.03 — Email/Password Login
- TASK-03.04 — Current User & Authentication Middleware
- TASK-03.05 — Logout & Session Lifecycle
- TASK-03.06 — Google Sign-In
- TASK-03.07 — Member Profile
- TASK-03.08 — Authentication UI & Protected Member Routes
- TASK-03.09 — Authentication Security Hardening & E2E
- TASK-03.10 — Phase 03 Final Verification (independent; no fixes)

Tasks run sequentially; each is verified and recorded in Project Memory
before the next starts.

---

## Approved Authentication Model

- Modes: Email + Password, Google Sign-In, Continue as Guest.
- Guest is navigation only: no User row, no fake account, no session merely
  for browsing. Guest is not a role.
- Persistent roles: `MEMBER`, `ADMIN`. Public registration and public Google
  Sign-In create `MEMBER` only; a client-supplied role is never accepted.
- No password reset, email verification, change password, account deletion,
  MFA or WhatsApp OTP in this phase. No `/account/orders` (Order phase).

---

## Session Architecture (finalized in TASK-03.01)

- `express-session` with the PostgreSQL store `connect-pg-simple`
  (table `user_sessions`, created by a committed Prisma migration and
  modelled in `schema.prisma`; the library's `createTableIfMissing` is off).
- Cookie `maba.sid`: `HttpOnly`, `SameSite=Lax`, `Secure` when
  `NODE_ENV=production`, path `/`, 7-day lifetime; the cookie carries only
  the signed opaque session ID.
- Session payload: `userId`, `authenticatedAt`, `csrfToken` — nothing else.
  The user's role/active state is re-read from `users` on every protected
  request; a session older than the absolute 7-day lifetime, or pointing to a
  missing/inactive user, is destroyed.
- `saveUninitialized: false`: browsing never creates a session row. An
  anonymous session exists only once the browser asks for a CSRF token
  (i.e. right before a sign-in/sign-up submit).
- Session ID regenerated on register, password login and Google login;
  the CSRF token is rotated with it.
- `SESSION_SECRET` (server-only, ≥ 32 characters) is required to start the
  API; there is no fallback in any environment. Tests inject their own.

## CSRF & CORS

- Synchronizer token bound to the server session: `GET /api/v1/auth/csrf`
  returns `{ data: { csrfToken } }` (32 random bytes, base64url); unsafe
  methods (POST/PUT/PATCH/DELETE) on session-backed routes must send it in
  `X-CSRF-Token`; comparison is constant-time. Login and register are not
  exempt (login-CSRF). Missing/wrong token → 403.
- CORS: explicit `FRONTEND_URL` allowlist with
  `Access-Control-Allow-Credentials: true`, allowed methods
  GET/POST/PATCH/OPTIONS, allowed headers `Content-Type, X-CSRF-Token`;
  never `*`, never a reflected arbitrary origin.
- The web client sends every request with `credentials: "include"` from the
  single existing API client; the CSRF token lives only in memory.

## Passwords & Email

- Argon2id via `@node-rs/argon2` (prebuilt N-API binaries, no install
  scripts). Parameters recorded in TASK-03.02.
- Password policy: 8–128 characters, not trimmed, no composition rules;
  over-long input is rejected before hashing.
- One backend `normalizeEmail` helper (trim + lowercase) used by
  registration, login and Google; `users_email_lower_key` (KI-008) remains
  the database backstop.
- Login failures (unknown email, wrong password, Google-only account,
  inactive account) share one status (401) and one message; a dummy Argon2id
  verification keeps the no-user path comparable in cost.

## Google Sign-In

- Browser: Google Identity Services (GIS) loaded directly (no wrapper
  package); the button is shown only when `VITE_GOOGLE_CLIENT_ID` is set.
- Backend: `POST /api/v1/auth/google { credential }` verified server-side
  with `google-auth-library` (`OAuth2Client.verifyIdToken`, audience =
  `GOOGLE_CLIENT_ID`; signature, issuer and expiry checked by the library).
  Without `GOOGLE_CLIENT_ID` the endpoint answers 503 and email/password keeps
  working. Verification is behind an injectable verifier interface; tests
  use a fake verifier passed to `createApp` — no request-selectable bypass.
- Account resolution (conservative): linked `googleId` → that user (if
  active); else the email must be Google-verified; no user with that email →
  new MEMBER; an existing account with that email but without this Google
  identity → 409, never auto-linked (no email verification exists, so a
  password account's ownership of the address is unproven — auto-linking
  would enable pre-account-takeover). ADMIN accounts are never touched by
  public Google Sign-In.
- No Google access/refresh tokens are stored; only `googleId` (OIDC `sub`).

## API Scope

```text
GET   /api/v1/auth/csrf
POST  /api/v1/auth/register
POST  /api/v1/auth/login
POST  /api/v1/auth/google
POST  /api/v1/auth/logout
GET   /api/v1/auth/me            200 { data: AuthUser | null }
GET   /api/v1/account/profile    MEMBER only
PATCH /api/v1/account/profile    MEMBER only (name, whatsapp)
```

Envelopes stay `{ data }` / `{ message, errors? }`. Statuses: 200, 201
(register), 400, 401, 403, 409, 413, 429, 500, 503 (Google not configured).

## Security Hardening (TASK-03.09)

Helmet security headers (API-appropriate CSP `default-src 'none'`), auth
rate limits via `express-rate-limit` (in-process store; multi-instance
deployment needs a shared store later), per-request `X-Request-ID`, bounded
JSON bodies (10 kB) on session-backed routes, no sensitive values in logs.

## Database

Exactly one additive migration is allowed: `user_sessions`. It is reviewed
before being applied, applied to `maba_printing_dev` with `migrate dev` (never
reset), and the test database is rebuilt from migrations. Previous migration
files stay byte-identical; LF line endings (KI-009). No seeded users.
Automated auth tests use only `maba_printing_test`; their users carry the
reserved domain `auth.test.invalid` / `e2e.test.invalid` and are removed
together with all test-database sessions.

## Frontend Scope

Routes `/login`, `/signup`, `/account` (protected, MEMBER). Header shows
Masuk/Daftar or Akun. Auth state is TanStack Query server state (`auth/me`)
behind thin hooks — no separate context store. Safe internal-only
`redirect` handling. Indonesian copy, accessible forms, responsive.

## Out of Scope

Order creation/history, `/account/orders`, guest ordering, uploads,
tracking, payments, WhatsApp deep links, Admin dashboard/login UX, role
management, password reset, email verification, email change, MFA, OTP,
deployment, CI/CD.

## Stop Rule

Stop with AWAITING_APPROVAL or BLOCKED on: a destructive change to a non-test
database, a second/unapproved migration, Argon2id unavailable, a material
PRD/Architecture contradiction, migration drift/checksum corruption, test-DB
guard failure, suspected secret exposure, risk to unrelated user changes, or
an unfixable blocking verification failure.

Do not begin Phase 04.
