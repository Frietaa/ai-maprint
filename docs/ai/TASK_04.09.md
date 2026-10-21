# TASK-04.09 — Order Security, Validation & E2E

Phase: 04 — Order Submission, Private Files & Tracking

## Objective

Harden and prove the order flows end to end against the test database and
test storage.

## Source Requirements

PRD §26, §29 (critical flows Guest → Order, Member → Order, Member →
History, Guest → Track); Architecture §42, §48.

## Scope

- Review limits, logs (no file names/contents), headers, rate limits.
- E2E storage root in OS temp (exact, guarded), cleaned by
  `e2e:fixtures:clean`; E2E orders removed by fixture cleanup (test DB
  only).
- Playwright: guest printing with a file → receipt → track; member ATK
  order → history → detail; laptop pickup and software requests; CSRF
  refusal for POST /orders; responsive checks for new pages.

## Business Rules

As in TASK-04.02..04.07.

## Security Requirements

No uploaded files left in test storage; development storage untouched.

## Exclusions

Load testing, malware scanning.

## Testing

Full unit, DB and E2E suites.

## Verification

All suites green; test DB and test storage empty afterwards; dev DB
fingerprint unchanged.

## Project Memory

E2E coverage, remaining limitations.

## Stop Conditions

E2E would need the development database or storage.
