# TASK-04.06 — Software Installation Request

Phase: 04 — Order Submission, Private Files & Tracking

## Objective

Software installation requests limited to legal software.

## Source Requirements

PRD §12; existing SoftwareInstallationRequest.

## Scope

softwareName (≤ 200), optional requirements (≤ 5000),
`licenseAcknowledged: true` required; canonical server-side license note.

## Business Rules

Only licensed, free or open-source software (or a valid customer license);
no license verification infrastructure.

## Security Requirements

The client cannot choose the stored license note.

## Exclusions

License verification.

## Testing

DB tests: success with canonical note, acknowledgement false/missing 400,
licenseNote injection 400.

## Verification

API suites green.

## Project Memory

Acknowledgement policy.

## Stop Conditions

None beyond phase rules.
