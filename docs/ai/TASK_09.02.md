# TASK-09.02 — Full Functional Regression

Phase: 09 — Release Candidate, Full Regression & Launch Readiness

## Objective
Prove every PRD MUST requirement with current evidence.

## Source Requirements
PRD §3, §5–§24, §30, §32.

## Implementation Scope
Traceability matrix (requirement -> automated test / live check); live journey check on the test database: public reads, auth (register, login, logout, profile, Google verifier boundary), Guest printing/laptop/software and Member ATK orders, receipt, WhatsApp handoff, tracking, member history/detail, Admin login, dashboard, queue, detail, status, pricing (pickup-fee rule), notes, payment, file download, catalog, services, locations, settings; retention (+30 days) via the DB suite.

## Business Rules
Release-candidate freeze: no feature expansion; only bug, test-stability, security, deployment and documentation fixes.

## Testing
Full unit/DB suites plus the live journey script.

## Verification
All suites green on the test database; dev data untouched.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A CRITICAL/HIGH defect that cannot be fixed safely, secret exposure, or a test-DB/storage guard failure.
