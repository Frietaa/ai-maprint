# PHASE-02 / TASK-02.01 — Frontend App Shell, Routing & Tailwind

## Status

NOT_STARTED

## Objective

Turn the Phase-00 single-component frontend into a routed, styled public
application shell that every later Phase-02 page renders inside.

## Scope

- Install React Router (current stable major compatible with React 19) and
  configure a browser router with one public layout route.
- Install Tailwind CSS through its current official Vite integration
  (`@tailwindcss/vite`, CSS-first configuration). Do not use Tailwind v3
  `tailwind.config.js`/PostCSS instructions.
- Establish a small set of static visual tokens (colors, font stack) as
  Tailwind theme variables in CSS.
- Create the public shell: `PublicLayout`, `Header`, primary navigation,
  accessible mobile navigation, `<main>` landmark, `Footer`, central `Logo`
  component (temporary text mark; obvious replacement point).
- Create the routes `/`, `/printing`, `/atk`, `/laptop-service`,
  `/software-installation`, `/locations` with minimal page content
  (one `h1` each) that later tasks fill, and a catch-all NotFound route.
- Static navigation configuration in one place.

## Requirements

- Feature-oriented structure (`src/app`, `src/components/layout`,
  `src/pages`, `src/config`, later `src/features`, `src/lib`); no empty
  folders.
- Semantic `header`/`nav`/`main`/`footer`; skip link to main content.
- Navigation items: Beranda, Printing, ATK, Service Laptop, Instalasi
  Software, Lokasi. Active item marked with `aria-current="page"`.
- Mobile menu: real `<button>` with `aria-expanded`/`aria-controls`, operable
  by keyboard, closes on navigation and on Escape.
- Visible focus styles; touch targets ≥ 40px; mobile-first layout without
  fixed widths.
- Restrained design: neutral surfaces, one primary accent, medium radius,
  subtle borders, small transitions honoring `prefers-reduced-motion`.
- No Redux, UI kit, animation framework or icon package.

## Exclusions

No data fetching, API client, TanStack Query, settings, catalog content,
`/login`, `/signup`, `/account`, `/track-order`, `/admin` routes.

## Verification

- Component tests: shell landmarks render, each route renders its `h1`
  inside the layout, active link has `aria-current`, mobile menu toggles via
  keyboard/click and exposes `aria-expanded`, unknown route renders NotFound.
- Playwright smoke test updated to the new shell (home + one navigation).
- Root typecheck, build, lint, format check, `npm test`.

## Project Memory

Record dependency versions, frontend structure, routing and styling
decisions in PROJECT_STATE, CURRENT_TASK and CHANGELOG_AI.

## Stop Condition

Stop the task when verification passes; continue to TASK-02.02 in the
autonomous run.
