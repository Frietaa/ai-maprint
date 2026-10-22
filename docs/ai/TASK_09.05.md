# TASK-09.05 — Accessibility / Responsive Regression

Phase: 09 — Release Candidate, Full Regression & Launch Readiness

## Objective
Audit major public, member and Admin routes at 360/768/1280 px.

## Source Requirements
PRD §23, §27; Architecture §8.

## Implementation Scope
Playwright regression spec: representative routes x widths without horizontal overflow, exactly one h1, named landmarks, labelled form controls, images with alt, visible focus on keyboard navigation, reduced-motion respected; fix real defects found.

## Business Rules
Release-candidate freeze: no feature expansion; only bug, test-stability, security, deployment and documentation fixes.

## Exclusions
Formal WCAG certification.

## Testing
New regression spec green.

## Verification
All suites green on the test database; dev data untouched.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A CRITICAL/HIGH defect that cannot be fixed safely, secret exposure, or a test-DB/storage guard failure.
