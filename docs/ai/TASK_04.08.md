# TASK-04.08 — Order Forms, Receipt & WhatsApp Handoff

Phase: 04 — Order Submission, Private Files & Tracking

## Objective

Accessible Indonesian order forms on the four service pages, a receipt, the
WhatsApp handoff, `/track-order` and member order history pages.

## Source Requirements

PRD §7–§17, §23, §28; Architecture §8–§10 (React Hook Form), §38.

## Scope

- React Hook Form (compatibility checked); shared order-form fields;
  member prefill from the profile (editing never mutates the profile).
- Printing form with file picker and limits; ATK selection with quantities
  from AVAILABLE products and an estimated total; laptop form with
  conditional pickup address and fee-policy copy; software form with the
  legal acknowledgement.
- Receipt: Public Order ID (copy button), type, status label, requested
  completion (WIB), estimated total, tracking link, WhatsApp link.
- WhatsApp helper: digits-only number from BusinessSettings, generic
  message with the Public Order ID only; shown only when configured;
  never auto-opened.
- `/track-order` (explicit submit), `/account/orders`,
  `/account/orders/:publicId`; navigation entry "Lacak Pesanan".
- API client: FormData support without manual Content-Type.

## Business Rules

Requested completion is a preference, not a guarantee; prices shown are
estimates; server recalculates.

## Security Requirements

No private data in URLs (WhatsApp message carries only the public ID); no
order data in web storage; duplicate submit prevented while pending.

## Exclusions

Payment UI, admin UI, download buttons.

## Testing

Component tests per form (validation, success receipt, 409/413/415/429
copy), WhatsApp helper, tracking page states, history/detail pages.

## Verification

Web lint/typecheck/build/tests green.

## Project Memory

Routes, form approach, WhatsApp behavior.

## Stop Conditions

React Hook Form incompatible with React 19 (then plain forms).
