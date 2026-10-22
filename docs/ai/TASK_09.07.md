# TASK-09.07 — Known-Issue Triage

Phase: 09 — Release Candidate, Full Regression & Launch Readiness

## Objective
Triage every Known Issue for release.

## Source Requirements
docs/ai/KNOWN_ISSUES.md.

## Implementation Scope
For every KI: status, evidence, severity, production-blocking, owner, next action — recorded in KNOWN_ISSUES (release triage section) without erasing history.

## Business Rules
CRITICAL/HIGH open production-security issues block release.

## Verification
All suites green on the test database; dev data untouched.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A CRITICAL/HIGH defect that cannot be fixed safely, secret exposure, or a test-DB/storage guard failure.
