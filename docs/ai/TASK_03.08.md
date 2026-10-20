# TASK-03.08 — Authentication UI & Protected Member Routes

Phase: 03 — Authentication & Identity

## Objective

Indonesian, accessible `/login`, `/signup` and protected `/account` pages
integrated with the Phase-02 shell, using the existing API client and
TanStack Query.

## Source Requirements

PRD §6 (Continue as Guest is navigation), §23 (brand/UI), §24 (sitemap),
§28 (loading/error/401/403); Architecture §8, §9, §10, §15 (no token in
storage), §19 (frontend guard is not authorization).

## Implementation Scope

- API client: `credentials: "include"` on every request, `apiSend` for
  unsafe methods with in-memory CSRF token (fetched lazily, cleared after
  sign-in/out, one retry on CSRF rejection).
- Hooks: `useCurrentUser`, login/signup/Google/logout mutations, profile
  query + update mutation (query invalidation instead of a context store).
- Pages: Login, Signup (password requirements shown), Account (profile view
  + edit + logout), `RequireMember` guard, safe `redirect` helper
  (internal paths only), Google button via GIS when configured,
  "Lanjut sebagai tamu" link to `/`.
- Header: Masuk / Daftar, or Akun when signed in (desktop and mobile).

## Security Requirements

No password/credential/session id in URLs, storage, cache or logs; open
redirect blocked; Google credential sent straight to the backend; no role
selection anywhere.

## Exclusions

`/account/orders`, Admin pages, password reset UI.

## Verification Criteria

Component tests: forms + validation, generic login failure, loading,
header states, guard redirect with safe redirect, account view/edit, logout,
Google absent/present (mocked GIS), CSRF header use, redirect helper; lint,
typecheck, build.

## Project Memory

UI routes, state approach, GIS integration decision.

## Stop Conditions

A required package with incompatible React peer requirements (do not force).
