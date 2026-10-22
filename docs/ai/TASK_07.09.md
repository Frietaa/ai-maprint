# TASK-07.09 — Security & Reliability Regression

Phase: 07 — Security, Reliability & Production Hardening

## Objective
Prove the hardening and keep the client fast.

## Source Requirements
PRD §26, §27.

## Implementation Scope
Route-level code splitting for Admin and account pages (TASK-06.10 F-2); regression across the new configuration paths; full suites.

## Testing
All suites; bundle size comparison.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A needed domain migration, a security reduction, a test-DB/storage guard failure, or secret exposure.
