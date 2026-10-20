# PHASE 02 — Public Read Experience

## Status

ACCEPTED / COMPLETE (human-approved 2026-10-20; verification PASS)

## Objective

Build the first real public-facing MABA PRINTING experience by exposing safe
read-only business/catalog data through REST APIs and rendering it in the React
frontend.

At the end of Phase 02 a visitor can open the website, read about the four
business lines, browse the database-backed service and ATK catalogs, and see
the active locations with their opening hours — on mobile, tablet and desktop.

---

## Source of Truth

1. docs/PRD_MABA_PRINTING_v1.0.md (frozen)
2. docs/ARCHITECTURE_MABA_PRINTING_v1.0.md (frozen)
3. docs/ai/DECISIONS.md
4. docs/ai/MASTER_PROMPT.md
5. Project Memory (PROJECT_STATE, CURRENT_TASK, CHANGELOG_AI, KNOWN_ISSUES)
6. This phase specification
7. The active TASK_02.xx.md

Relevant frozen requirements: PRD §7 (Homepage), §8/§10/§11/§12 (business
lines), §19 (Locations), §22 (Business configuration), §23 (Brand & UI/UX),
§24 (Sitemap), §27 (NFR: responsive, semantic, SEO), §28 (Error handling);
Architecture §4 (stack), §7–§9 (frontend structure/routing/state), §12–§14
(backend flow, REST, API contract), §20 (CORS), §42 (security middleware),
§43 (environment), §44 (brand configuration), §45 (errors), §47 (query
efficiency).

---

## Planned Tasks

- TASK-02.01 — Frontend App Shell, Routing & Tailwind
- TASK-02.02 — Public API Contract Foundation
- TASK-02.03 — Public Settings Vertical Slice
- TASK-02.04 — Locations Vertical Slice
- TASK-02.05 — Services Catalog Vertical Slice
- TASK-02.06 — Products / ATK Catalog Vertical Slice
- TASK-02.07 — Homepage Composition & Navigation
- TASK-02.08 — Public UX States, Accessibility & SEO
- TASK-02.09 — Public Read Integration & E2E
- TASK-02.10 — Phase 02 Final Verification (independent; no fixes)

Tasks run sequentially. Each task is verified and recorded in Project Memory
before the next one starts.

---

## In Scope

Frontend:

- React Router, Tailwind CSS (current Vite integration);
- public application shell: header, primary navigation, accessible mobile
  navigation, main landmark, footer, central logo component;
- pages: `/`, `/printing`, `/atk`, `/laptop-service`,
  `/software-installation`, `/locations`, and a NotFound page;
- loading / empty / error states, responsive layout, accessibility and
  lightweight SEO metadata.

Backend (read-only, public, no authentication):

- `GET /api/v1/public/settings`
- `GET /api/v1/locations`
- `GET /api/v1/services`
- `GET /api/v1/products`
- `GET /api/v1/health` preserved and database-independent.

Integration:

- implementation-independent public DTO contracts in `packages/shared`;
- route → validator → controller → service → existing repository → Prisma;
- Zod query validation; standard response/error shapes;
- explicit CORS allowlist; native-fetch API client; TanStack Query.

Testing:

- API tests (Supertest), DB-backed API tests on `maba_printing_test` only,
  component tests (React Testing Library), Playwright public-read E2E.

---

## Out of Scope

Login, signup, Google OAuth, sessions, member accounts, order creation, order
tracking, file uploads, payment workflows, status mutation, admin dashboard,
catalog/settings mutation, WhatsApp order workflow (deep links), Prisma domain
expansion, production deployment, CI/CD.

---

## Global Rules

### Data authority (KI-011)

PostgreSQL `business_settings` → `GET /public/settings` → frontend is the only
live source of business name, WhatsApp number, logo reference, social links
and public information. Static frontend configuration may hold only a fallback
display name, visual tokens, navigation and route metadata. No real WhatsApp
number in source code.

### Response contract

- single resource: `{ "data": ... }`
- collection: `{ "data": [...], "meta": { "count": n } }`
- error: `{ "message": "...", "errors"?: { "<field>": ["..."] } }`

No Prisma errors, SQL, stack traces or environment values in responses.
Status codes: 200 success (including empty collections), 400 invalid query,
404 unknown API route, 500 unexpected error.

### Public visibility

- Locations: active only.
- Services: active service in an active category; with `locationId`, only
  services available (`is_available`) at that active location.
- Products: active product in an active category. `AVAILABLE` and
  `UNAVAILABLE` are both public; `UNAVAILABLE` means temporarily not
  orderable. Inactive means not public. Never conflate them.
- No public `activeOnly=false` escape hatch: unknown query parameters are
  rejected with 400.

### Prices

Whole Rupiah integers. `FIXED` with a price renders as formatted Rupiah via
one central formatter (`Intl.NumberFormat("id-ID")`); `REQUIRES_CONFIRMATION`
renders "Konfirmasi harga" (an indicative price may be shown as "mulai ...").
Never render null/undefined/NaN or raw enum labels.

### Database

Zero schema migrations expected. A genuine blocker stops the run with
AWAITING_APPROVAL. Automated DB-backed tests and E2E use only
`maba_printing_test` through the existing fail-closed guard. The development
database is never reset, truncated or dropped.

### Dependencies

Only stable versions compatible with React 19, Vite 8, TypeScript 6 and
Express 5. No Redux/Zustand, Axios, UI kits, animation frameworks, date
libraries, GraphQL/tRPC, API generators. Versions recorded in Project Memory.

### Quality

Strict TypeScript (no `any`, no `@ts-ignore`), Indonesian UI copy, mobile-first
responsive layout, semantic HTML, visible focus, keyboard-operable navigation,
restrained visual design, no TODOs for Phase-02 requirements, no stubbed
capabilities presented as complete.

---

## Phase Verification

TASK-02.10 is an independent checkpoint: it re-inspects the repository,
re-runs all verification, does not repair findings, and returns exactly one
verdict: PASS, FAIL or BLOCKED. Phase 02 is not marked human-accepted by the
AI.

---

## Stop Rule

Stop the autonomous run with AWAITING_APPROVAL or BLOCKED on: required
destructive change to a non-test database, an unapproved schema migration, a
material PRD/Architecture contradiction, migration drift/checksum corruption,
test-DB guard failure, suspected secret exposure, inability to preserve
Phase-01 behavior, risk of overwriting unrelated user changes, or an
unfixable blocking verification failure.

Do not begin Phase 03.
