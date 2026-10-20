# PHASE-02 / TASK-02.08 — Public UX States, Accessibility & SEO

## Status

NOT_STARTED

## Objective

Harden every public page for state handling, accessibility and basic SEO.

## Scope

- Review all data-backed screens for: initial loading, success, empty,
  invalid query (400), network error, server error; Indonesian copy; retry.
  No raw stack traces or technical messages shown to users.
- Accessibility review and fixes: one meaningful `h1` per page, heading
  order, landmarks, skip link, keyboard navigation and focus visibility,
  accessible mobile menu state, labels for controls, alt text for meaningful
  images and empty alt for decorative ones, status text not by color alone,
  contrast of tokens, touch targets, `prefers-reduced-motion`.
- SEO: lightweight route-aware metadata (document title and meta
  description per route) via a small component — no SEO framework.
- NotFound page: friendly Indonesian copy, links home, its own title.
- Responsive check at ~360px, ~768px, ≥1280px (no horizontal overflow).

## Requirements

- Error copy translates `ApiError` kinds into Indonesian.
- Metadata component updates `document.title` and the description meta tag.
- Do not add admin/auth `noindex` handling (later phases).

## Exclusions

Server-side rendering, sitemap.xml, structured data, analytics.

## Verification

- Component tests: error copy per error kind, retry, per-route titles and
  descriptions, NotFound title.
- Playwright: no horizontal overflow at 360/768/1280 on public routes; 404
  route renders NotFound.
- Root typecheck, build, lint, format, `npm test`.

## Project Memory

Record state/accessibility/SEO decisions and anything deferred.

## Stop Condition

Stop when verification passes; continue to TASK-02.09.
