# TASK-04.05 — Laptop Service Request

Phase: 04 — Order Submission, Private Files & Tracking

## Objective

Laptop service requests with handover method and optional pickup address.

## Source Requirements

PRD §11 (pickup rule), Architecture §31.

## Scope

LaptopServiceRequest row: complaint (≤ 5000), handoverMethod
`DROP_OFF | PICKUP`, optional future `handoverAt`, `pickupAddress` (≤ 500)
required for PICKUP and rejected for DROP_OFF; distance and fee null.

## Business Rules

Pickup fee policy (≤ 5 km free, Rp2.000 per additional km) is applied by
Admin later; customers never send distance or fee.

## Security Requirements

distanceKm / pickupFee / finalTotal rejected as unknown fields.

## Exclusions

Maps, automatic fee calculation.

## Testing

DB tests: drop-off, pickup with address, pickup without address 400,
address on drop-off 400, past handover 400, distance/fee injection 400.

## Verification

API suites green.

## Project Memory

Handover validation.

## Stop Conditions

None beyond phase rules.
