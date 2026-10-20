# PHASE-02 / TASK-02.07 — Homepage Composition & Navigation

## Status

NOT_STARTED

## Objective

Turn `/` into the first polished MABA PRINTING homepage (PRD §7) and make
navigation between public pages coherent on mobile and desktop.

## Scope

Sections:

1. Hero / business introduction (business name from settings, static
   fallback name).
2. Four business-line entry cards (Printing, ATK, Service Laptop, Instalasi
   Software) linking to their routes — static product-line concepts.
3. Short "how it works / why" section (no exaggerated claims).
4. Location preview from the locations API (up to three, link to
   `/locations`).
5. Business information from settings when configured (public info,
   WhatsApp number as text).
6. Final navigation CTA.

## Requirements

- Indonesian, concise, student-friendly copy.
- No hardcoded prices, addresses, opening hours, WhatsApp number or stock.
- No claims such as 24/7, cheapest, guaranteed completion or branch
  coverage.
- Data sections handle loading/empty/error without breaking the page.
- Single `h1`; sections use `h2`.
- Responsive grid: 1 column mobile, 2 tablet, 4 desktop for line cards.

## Exclusions

Order/request flows, tracking, login, WhatsApp deep link, testimonials,
promotions.

## Verification

- Component tests: homepage sections, line cards link to the right routes,
  location preview with data/empty/error, business info shown only when
  configured.
- Root typecheck, build, lint, format, `npm test`.

## Project Memory

Record homepage composition and copy rules.

## Stop Condition

Stop when verification passes; continue to TASK-02.08.
