# TASK-07.03 — Website Security Headers / CSP / Hosting Policy (KI-016)

Phase: 07 — Security, Reliability & Production Hardening

## Objective
A provider-neutral, testable security-header policy for the website.

## Source Requirements
Architecture §42, §53; KI-016.

## Implementation Scope
apps/web/security-headers.ts (CSP with API origin and Google Identity Services, frame-ancestors, COOP, nosniff, Referrer-Policy, Permissions-Policy, HSTS when HTTPS, cache rules); vite preview uses it; docs/DEPLOYMENT.md header table.

## Exclusions
Provider-specific header files before a host is chosen.

## Testing
Unit tests of the policy; production-build smoke with the policy (no CSP violations) in Phase 08/09.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A needed domain migration, a security reduction, a test-DB/storage guard failure, or secret exposure.
