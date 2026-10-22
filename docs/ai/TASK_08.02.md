# TASK-08.02 — Production Environment Contract (incl. KI-022)

Phase: 08 — Production Infrastructure & Deployment Readiness

## Objective
One definitive environment inventory, validated at start-up without printing values.

## Source Requirements
Architecture §43; KI-011, KI-022.

## Implementation Scope
SESSION_COOKIE_SAMESITE (lax default, strict, none only with Secure/production); production start-up warnings for an unset TRUST_PROXY or FRONTEND_URL; web build check (VITE_API_BASE_URL must be https for production builds except localhost); .env.example files and docs/DEPLOYMENT.md inventory (API, web, operator, CI).

## Authorization / Security Rules
Never echo values; no secrets in VITE_*; cross-site cookies only explicit.

## Testing
Env unit tests; session cookie attribute tests.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A provider decision that blocks unrelated work, secret exposure, or a security reduction.
