# TASK-07.05 — Upload Malware-Scanning Boundary (KI-019)

Phase: 07 — Security, Reliability & Production Hardening

## Objective
A scanning step for uploads that fails closed, with a self-hosted option and an explicit production decision.

## Source Requirements
PRD §9, §26; Architecture §35.

## Implementation Scope
FileScanner interface; none and clamav (clamd INSTREAM over TCP, timeout, size chunks) implementations; scan between content validation and storage; infected -> 422 file rejected; scanner failure -> 503; UPLOAD_SCANNER required in production (explicit none allowed and logged).

## Authorization / Security Rules
File-type validation is not malware scanning; documents remain private and attachment-only regardless.

## Testing
Unit tests with a fake clamd server (clean, infected, error, timeout); DB tests for rejection without storing or creating an order.

## Verification
format, lint, typecheck, build; unit, DB (test database only) and Playwright suites green.

## Project Memory
PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI; KNOWN_ISSUES when facts change.

## Stop Conditions
A needed domain migration, a security reduction, a test-DB/storage guard failure, or secret exposure.
