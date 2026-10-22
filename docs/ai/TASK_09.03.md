# TASK-09.03 — Full Security Regression

Phase: 09 — Release Candidate, Full Regression & Launch Readiness

## Objective
Independently re-check every security property.

## Source Requirements
PRD §26; Architecture §15–§20, §34–§42; docs/SECURITY.md.

## Implementation Scope
No auth token in web storage, session fixation, CSRF, CORS, role authorization, Admin boundary, member ownership, tracking privacy, ID entropy, upload type/size/count, path traversal, private storage, download authorization and headers, XSS-safe rendering (no dangerouslySetInnerHTML), safe redirects, Argon2id, email normalization, Google verification, rate limiting, request IDs, security headers, cache control, secret scanning, audit atomicity, log privacy.

## Business Rules
Release-candidate freeze: no feature expansion; only bug, test-stability, security, deployment and documentation fixes.

## Testing
Live security script on the test database plus code scans and the existing suites.

## Verification
All suites green on the test database; dev data untouched.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A CRITICAL/HIGH defect that cannot be fixed safely, secret exposure, or a test-DB/storage guard failure.
