# TASK-07.02 — Rate Limiting Production Strategy (KI-015)

Phase: 07 — Security, Reliability & Production Hardening

## Objective
Shared, restart-proof rate limits without a new vendor.

## Source Requirements
PRD §16, §26; Architecture §42; KI-015.

## Implementation Scope
Additive migration rate_limit_counters; express-rate-limit Store backed by one atomic PostgreSQL upsert; RATE_LIMIT_STORE=memory|postgres (production default postgres); expired-row pruning; app wiring.

## Authorization / Security Rules
Keys are limiter prefix + client IP (no personal data beyond the IP the limiter already uses); TRUST_PROXY guidance unchanged.

## Testing
DB tests: counting, window reset, concurrency, shared between two app instances, pruning; env parsing tests.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A needed domain migration, a security reduction, a test-DB/storage guard failure, or secret exposure.
