# TASK-05.01 — Admin Access & Authorization Foundation

Phase: 05 — Admin Operations & Order Management

## Objective
A dedicated, secure Admin entry: `/admin/login`, an Admin shell and
guard, `requireRole('ADMIN')` on `/api/v1/admin/*`, and a safe operator
provisioning command.

## Source Requirements
PRD §20 (Admin login), §26; Architecture §8, §15, §19; ADR-017.

## Implementation Scope
- Admin router foundation (`GET /api/v1/admin/me` style probe not needed:
  `/auth/me` carries the role); admin router mounted behind session/CSRF
  with resolvePrincipal + requireRole('ADMIN').
- `scripts/admin-create.ts` + `npm run admin:create` (env ADMIN_EMAIL,
  ADMIN_NAME, ADMIN_PASSWORD; `--promote` for an existing MEMBER).
- Web: AdminLayout (own header/nav), RequireAdmin guard, AdminLoginPage
  (email + password, safe `/admin` redirects only), header "Admin" link for
  ADMIN principals.

## Authorization / Security Rules
401 signed out, 403 MEMBER, inactive Admin loses access immediately; no
HTTP path creates or promotes Admins; provisioning prints no password or
hash; Admin login has no Google button.

## Business Rules
All Admins equal; no new roles.

## Exclusions
Order management, catalog, settings.

## Testing
API: admin probe 401/403/200, inactive admin, registration cannot create
ADMIN. Provisioning (test DB): create, normalized email, Argon2id, conflict
without --promote, promote with --promote, existing admin unchanged. Web:
login page, guard states, member denial, safe redirect.

## Verification
Lint, typecheck, unit/DB/web tests green.

## Project Memory
Access model and provisioning procedure.

## Stop Conditions
A needed schema migration, a guard failure, or a security regression.
