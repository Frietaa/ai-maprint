# TASK-06.08 — Customer UX / Accessibility / Error Hardening

Phase: 06 — Remaining MVP Experience & Customer Payment UX

## Objective
Audit and fix the customer experience: states, errors and accessibility.

## Source Requirements
PRD §23, §27, §28.

## Implementation Scope
Review home, locations, service pages, ATK, login/signup, account, order forms, receipt, tracking, member history/detail and payment display for loading/empty/validation/409/413/415/429/500/network/session-expiry handling, Indonesian copy, headings, labels, error association, focus, keyboard, status not colour-only, touch targets, reduced motion. Fix real defects.

## Exclusions
Visual redesign; formal WCAG certification.

## Testing
Unit tests for error mapping; page tests for fixed defects.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and affected Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A needed domain migration, a test-DB/storage guard failure, private-data exposure, or a security regression.
