# TASK-05.04 — Pricing & Admin Notes

Phase: 05 — Admin Operations & Order Management

## Objective
Order-level pricing and internal notes.

## Source Requirements
PRD §11, §20; Architecture §31, §32.

## Implementation Scope
`PATCH …/pricing {estimatedTotal?, finalTotal?, distanceKm?}` and
`PATCH …/notes {adminNotes}`; web forms on the detail page.

## Authorization / Security Rules
ADMIN + CSRF; strict bodies (status, payment, snapshot, userId rejected);
admin notes never in public/member DTOs or WhatsApp links.

## Business Rules
Whole Rupiah 0..2147483647 or null; distanceKm (0..9999.99, 2 decimals) only
for LAPTOP_SERVICE PICKUP → pickupFee = 0 for ≤ 5 km else ceil(d − 5) ×
2000; OrderItem snapshots unchanged; finalTotal never implies PAID; notes
≤ 5000 chars; audit ORDER_PRICING_UPDATED (before/after) and
ORDER_ADMIN_NOTES_UPDATED (added/changed/cleared only).

## Exclusions
Discounts, taxes, invoices.

## Testing
Values, null, negative/fraction/overflow, distance on wrong order type,
fee computation boundaries, notes isolation from member/public responses,
audit content.

## Verification
API/web suites green.

## Project Memory
Pricing rules and fee rounding.

## Stop Conditions
A needed schema migration, a guard failure, or a security regression.
