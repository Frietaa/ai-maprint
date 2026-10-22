# TASK-08.03 — Build / Start / Migration / Operator Commands

Phase: 08 — Production Infrastructure & Deployment Readiness

## Objective
Commands that work in a production install without development tools.

## Source Requirements
Architecture §50, §53; TASK-07.10 F-2.

## Implementation Scope
admin-create moved to src/cli (built to dist/cli); npm scripts db:migrate:deploy, start, cli scripts; documented sequence build -> migrate deploy -> start; no source edits needed.

## Testing
Built CLIs smoke-tested on the test database; start from dist.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A provider decision that blocks unrelated work, secret exposure, or a security reduction.
