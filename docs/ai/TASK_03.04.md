# TASK-03.04 — Current User & Authentication Middleware

Phase: 03 — Authentication & Identity

## Objective

Resolve the authenticated principal from the server session on each request
and expose `GET /api/v1/auth/me`.

## Source Requirements

Architecture §15, §16, §19 (backend authorization, never frontend role
claims); PRD §26, §28 (401/403).

## Implementation Scope

- `resolvePrincipal` middleware: session `userId` → `users` (explicit select)
  → active check → absolute session lifetime check → `req.principal`
  (`{ id, role }` plus safe profile fields). Stale/expired sessions are
  destroyed and the cookie cleared.
- `requireAuthenticated` (401), `requireRole('MEMBER' | 'ADMIN')` (403).
- `GET /auth/me`: 200 `{ data: AuthUserDto }` or 200 `{ data: null }`.
- Express request typing (`principal`, `requestId`) and session typing.

## Security Requirements

Role and active state come from the database on every request, not from the
session payload or the client; no Prisma `User` objects leak beyond the
repository/mapper.

## Exclusions

Generic RBAC framework, Admin routes.

## Verification Criteria

DB tests: unauthenticated null, authenticated user, session survives app
recreation (shared store), forged/invalid cookie → null, expired session
(absolute lifetime) → null + destroyed, user deactivated mid-session → null
and protected route 401, ADMIN principal resolved with role ADMIN.

## Project Memory

Principal model and unauthenticated `me` behavior.

## Stop Conditions

None beyond phase rules.
