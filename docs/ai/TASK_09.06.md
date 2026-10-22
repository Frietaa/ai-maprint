# TASK-09.06 — Operational / Deployment Regression

Phase: 09 — Release Candidate, Full Regression & Launch Readiness

## Objective
Re-prove the operational path.

## Source Requirements
docs/DEPLOYMENT.md, docs/OPERATIONS.md.

## Implementation Scope
npm run verify, container build and run, built CLIs, readiness/health, smoke script, migration check, restore rehearsal status.

## Business Rules
Release-candidate freeze: no feature expansion; only bug, test-stability, security, deployment and documentation fixes.

## Testing
As listed.

## Verification
All suites green on the test database; dev data untouched.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A CRITICAL/HIGH defect that cannot be fixed safely, secret exposure, or a test-DB/storage guard failure.
