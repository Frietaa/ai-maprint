# TASK-07.07 — Structured Logging, Readiness & Error Diagnostics

Phase: 07 — Security, Reliability & Production Hardening

## Objective
Production-ready logs and a readiness probe.

## Source Requirements
Architecture §46, §54.

## Implementation Scope
JSON logger (no dependency) with LOG_LEVEL; request log (request ID, method, route template, status, duration); error logs with category; GET /api/v1/readiness (database ping with timeout, storage configured) — 200 ready / 503 unavailable, no details; health unchanged.

## Authorization / Security Rules
Never log paths with Public Order IDs, bodies, cookies, tokens, passwords, file names or keys.

## Testing
Unit tests for log format and redaction; readiness with a failing database.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A needed domain migration, a security reduction, a test-DB/storage guard failure, or secret exposure.
