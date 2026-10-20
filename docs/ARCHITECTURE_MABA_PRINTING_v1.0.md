# MABA PRINTING — Technical Architecture

**Version:** 1.0  
**Status:** FROZEN BASELINE / Source of Truth  
**Product:** MABA PRINTING  
**PRD Reference:** `PRD_MABA_PRINTING_v1.0.md`

---

## 1. Purpose

Dokumen ini adalah **source of truth untuk HOW**: bagaimana MABA PRINTING v1.0 dibangun. Dokumen ini tidak mengubah product behavior pada PRD. Jika kebutuhan teknis memerlukan perubahan requirement, konflik MUST dilaporkan sebelum perubahan material dilakukan.

## 2. Architecture Principles

Gunakan incremental development, vertical slices, thin controllers, Service business logic, server validation/authorization, explicit migrations, secure defaults, minimal necessary abstraction, tests bersama feature, dan provider-agnostic deployment bila praktis.

Avoid business logic di React component/Controller, DB query dari frontend/View, unnecessary abstraction, speculative features, dan secrets dalam source.

## 3. High-Level Architecture

```text
React + Vite + TypeScript
          ↓ HTTPS / REST
Express + TypeScript
          ↓
Route → Middleware → Validator → Controller → Service
          ↓
Repository (when justified)
          ↓
Prisma ORM
          ↓
PostgreSQL

Private Files → StorageService → Private Object Storage
Google → Backend verification → Application session
WhatsApp → Deep link only
QRIS → Static / manual confirmation
```

## 4. Approved Stack

- Language: TypeScript
- Package Manager: npm
- Frontend: React + Vite + TypeScript + React Router + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Validation: Zod
- Database: PostgreSQL
- ORM: Prisma ORM
- Forms: React Hook Form where useful
- Server state: TanStack Query where useful
- Backend/API tests: Vitest + Supertest
- Frontend tests: Vitest + React Testing Library
- Critical E2E: Playwright
- Version Control: Git

Do not introduce Redux for MVP without demonstrated need/approval.

## 5. Repository

Single repository using npm workspaces:

```text
maba-printing/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   └── shared/
├── docs/
├── .github/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Workspaces:
- `apps/*`
- `packages/*`

Root package MUST be private. Do not add a monorepo orchestration framework unless later justified and approved.

## 6. Documentation

Recommended:

```text
docs/
├── PRD_MABA_PRINTING_v1.0.md
├── ARCHITECTURE_MABA_PRINTING_v1.0.md
├── API_CONTRACTS.md
├── DATABASE_SCHEMA.md
├── SECURITY.md
├── IMPLEMENTATION_STATUS.md
└── ai/
    ├── PROJECT_STATE.md
    ├── DECISIONS.md
    ├── CURRENT_TASK.md
    ├── CHANGELOG_AI.md
    └── KNOWN_ISSUES.md
```

## 7. Frontend Structure

```text
apps/web/src/
├── app/
│   ├── router/
│   └── providers/
├── pages/
├── features/
│   ├── auth/
│   ├── printing/
│   ├── atk/
│   ├── laptop-service/
│   ├── software-installation/
│   ├── orders/
│   └── admin/
├── components/
│   ├── ui/
│   └── layout/
├── services/api/
├── hooks/
├── types/
├── utils/
├── config/
└── assets/
```

Prefer feature-oriented organization. Generic UI belongs in `components/ui`.

## 8. Routing

Conceptual:

```text
PUBLIC
/
 /printing
 /atk
 /laptop-service
 /software-installation
 /locations
 /track-order

AUTH
/login
/signup

MEMBER
/account
/account/orders
/account/orders/:publicId

ADMIN
/admin/login
/admin
/admin/orders
/admin/orders/:id
/admin/products
/admin/services
/admin/locations
/admin/settings
```

`Continue as Guest` is navigation, not authentication.

## 9. Frontend State

Use React local state for local UI, Auth Context/Provider for session state, and TanStack Query where server-state caching/refetching is useful. Avoid Redux unless approved.

## 10. Forms

Recommended:

```text
React Form
 ↓
Client Zod
 ↓
API
 ↓
Server Zod
 ↓
Service
```

Server validation remains authoritative. React Hook Form SHOULD be used for complex forms when useful.

## 11. Backend Structure

```text
apps/api/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── src/
    ├── config/
    ├── controllers/
    ├── services/
    ├── repositories/
    ├── validators/
    ├── routes/
    ├── middleware/
    ├── policies/
    ├── utils/
    ├── errors/
    ├── types/
    ├── jobs/
    ├── app.ts
    └── server.ts
```

## 12. Backend Responsibilities

Flow:

```text
Route
 ↓
Middleware
 ↓
Validator
 ↓
Controller
 ↓
Service
 ↓
Repository when justified
 ↓
Prisma
 ↓
PostgreSQL
```

Routes map HTTP. Middleware handles cross-cutting concerns. Validators validate body/params/query. Controllers MUST remain thin. Services own business rules/use-case orchestration/transactions. Repository is used only when meaningful for complex/reusable persistence; do not wrap every trivial Prisma call.

## 13. REST API

Prefix: `/api/v1`

Candidate public endpoints:

```text
GET  /health
GET  /public/settings
GET  /locations
GET  /services
GET  /products
POST /orders
GET  /orders/track/:publicId
```

Authentication:

```text
POST /auth/register
POST /auth/login
POST /auth/google
POST /auth/logout
GET  /auth/me
```

Member:

```text
GET   /account/profile
PATCH /account/profile
GET   /account/orders
GET   /account/orders/:publicId
```

Admin:

```text
GET   /admin/dashboard
GET   /admin/orders
GET   /admin/orders/:id
PATCH /admin/orders/:id/status
PATCH /admin/orders/:id/pricing
PATCH /admin/orders/:id/payment
```

Admin CRUD also covers Products, Services, Locations, relevant Settings. Exact contracts SHOULD later be recorded in `API_CONTRACTS.md`.

## 14. API Contract

Success:

```json
{"data": {}, "message": "Operation successful"}
```

Collection:

```json
{"data": [], "meta": {"page": 1, "limit": 12, "total": 42, "totalPages": 4}}
```

Error:

```json
{"message": "Validation failed", "errors": {"field": ["Error message"]}}
```

Optional stable error `code` MAY be added. Production MUST NOT expose secrets/stack traces.

## 15. Authentication Architecture

Use secure server-managed authentication/session semantics with browser cookies.

Requirements:
- no sensitive auth token dependency on `localStorage`;
- `HttpOnly` where appropriate;
- `Secure` production cookies;
- appropriate `SameSite`;
- backend verifies authenticated state.

A PostgreSQL-backed server session strategy is preferred when practical. Exact session package/store can be finalized in Authentication Phase while preserving these security properties.

## 16. Identity

One `users` identity model for Member/Admin.

Conceptual fields:
- UUID id;
- name;
- unique email;
- password hash;
- WhatsApp;
- role;
- Google identity;
- active status;
- timestamps.

Roles:
- `MEMBER`
- `ADMIN`

Guest has no User row merely for ordering. Admin may have separate `/admin/login` UX but shares secure auth infrastructure.

## 17. Passwords

Preferred password hashing: Argon2id when reliably supported by deployment. Any alternative must remain a recognized secure password hash and be documented. Plaintext passwords MUST NEVER be stored/logged.

## 18. Google Authentication

Browser → Google → backend identity verification → find/create eligible Member → application session.

Backend MUST verify Google identity. Frontend claims are not trusted. Google sign-in MUST NOT grant ADMIN automatically.

## 19. Authorization

Backend MUST enforce roles/resource ownership. Member can access only own private orders. Admin endpoints require ADMIN. Public tracking exposes only safe subset. File download requires authorization. Hidden frontend controls are not authorization.

## 20. CSRF & CORS

Cookie-authenticated state-changing requests MUST have appropriate CSRF defense based on deployment/session topology. Credentialed production CORS MUST use explicit allowed origins, never wildcard. Development may allow explicitly configured local origin.

## 21. Database & ORM

PostgreSQL + Prisma ORM. Persistent schema changes use Prisma migrations. Already-applied migrations SHOULD NOT be casually edited. Production uses controlled migrations, not ad-hoc schema mutation.

## 22. IDs

Internal entities SHOULD use UUIDs. Orders also have unique indexed non-predictable Public Order IDs. Sequential DB IDs MUST NOT be exposed as Guest tracking secrets.

## 23. Time

Persist timestamps in UTC. Display relevant business time using `Asia/Jakarta`/WIB initially.

## 24. Money

IDR stored as integer Rupiah:

`Rp25.000 → 25000`

Never use floating-point money arithmetic.

## 25. Preliminary Physical Schema

### users
UUID id, name, unique email, password_hash where applicable, WhatsApp, role, Google identity, is_active, timestamps.

### locations
UUID id, name, address, opening-hours representation, is_active, timestamps.

### service_categories / services
Category + service identity, description, `price_type`, optional price, availability/active state, timestamps.

### location_services
Join relation for location-specific service availability.

### product_categories / products
Category, product name/description, integer price, image reference, `AVAILABLE|UNAVAILABLE`, active state, timestamps.

### orders
UUID id, unique public_id, nullable user_id, nullable location_id, order_type, customer_name snapshot, customer_whatsapp snapshot, description, requested_completion_at, status, estimated_total, final_total, admin_notes, completed_at, timestamps.

Types:
- `PRINTING`
- `ATK`
- `LAPTOP_SERVICE`
- `SOFTWARE_INSTALLATION`

### order_items
order_id, nullable product_id where needed, product_name_snapshot, unit_price_snapshot, quantity, subtotal.

### Type-specific details
Prefer extension tables where data is materially different:
- `laptop_service_requests`;
- `software_installation_requests`;
- `printing_requests` only if dedicated data is actually required.

Avoid empty tables merely for symmetry.

### order_files
order_id, original_name, storage_key, MIME type, size, uploaded_at, delete_after, deleted_at.

### payments
order_id, method, status, amount, confirmed_by, confirmed_at, timestamps.

Methods: `CASH`, `QRIS_STATIC`.
Statuses: `UNPAID`, `PENDING_CONFIRMATION`, `PAID`.

### order_status_history
order_id, status_from, status_to, changed_by_admin_id, changed_at.

### admin_audit_logs
admin_id, action, entity_type/id, old/new value when relevant, timestamp.

### business_settings
Global operational settings only. Do not turn all structured domain data into generic key/value settings.

## 26. Indexes

Expected important indexes:
- users email unique;
- Google identity unique where used;
- orders public_id unique;
- orders user_id/status/type/created_at;
- product category/availability;
- status history order/time;
- order_files order.

Avoid speculative excessive indexing.

## 27. Deactivation

Products, Services, Locations SHOULD prefer active/inactive rather than destructive delete when history may reference them. Order snapshots preserve historical meaning.

## 28. Order Aggregate

`orders` is central for all four business lines.

Guest: `user_id = NULL`.
Member: `user_id = authenticated user`.

Customer snapshot MUST remain even if profile changes later.

## 29. Status Transitions

```text
SUBMITTED   → CONFIRMED | CANCELLED
CONFIRMED   → IN_PROGRESS | CANCELLED
IN_PROGRESS → READY | CANCELLED
READY       → COMPLETED
COMPLETED   → terminal
CANCELLED   → terminal
```

Service layer enforces transitions. Frontend is not authoritative.

## 30. Historical Product Snapshot

Order items preserve product name/unit price/quantity. Catalog price changes MUST NOT rewrite historical order meaning.

## 31. Pickup Fee

```text
distance <= 5 km → 0
distance > 5 km  → additional km × IDR 2,000
```

Distance is manually confirmed by Admin in MVP. No Maps API. Service layer owns calculation when system calculation is used.

## 32. Pricing

Price types:
- `FIXED`
- `REQUIRES_CONFIRMATION`

Final total MAY remain null until Admin confirms. Original consumer request remains preserved.

## 33. Transactions

Use DB transactions when related writes form one logical operation.

Examples:
- order + items + details + initial status history;
- status update + history + audit;
- payment update + audit.

Keep transactions short.

## 34. File Storage

Do not store large binaries in PostgreSQL. DB stores metadata + storage key.

Use abstraction:

```text
StorageService
├── upload()
├── download()
├── delete()
└── metadata()
```

Development MAY use local private storage. Production uses private object storage. Provider is deferred until deployment.

## 35. Upload Pipeline

```text
Browser
 ↓
Upload middleware
 ↓
count/size/type validation
 ↓
FileService
 ↓
Private Storage
 ↓
metadata
 ↓
PostgreSQL
```

Do not trust extension alone. Validate MIME/type appropriately. Randomize storage keys. Treat original filenames as untrusted metadata.

## 36. Storage Compensation

Object storage is outside PostgreSQL transactions. If upload succeeds but DB operation fails, attempt cleanup/compensation for orphaned objects. Failed storage MUST NOT be represented as successful upload.

## 37. File Retention

After `COMPLETED`, eligible deletion time may be `completed_at + 30 days`. Use idempotent cleanup job. Scheduler provider is selected at deployment. No distributed job infrastructure is required for MVP.

## 38. WhatsApp

Deep-link only. Helper/service MAY build message. No token/webhook/bot/Business API. Primary number configurable.

## 39. Payment

Manual confirmation. Static QRIS selection MUST NOT auto-mark PAID. Backend/Admin controls payment state. No gateway webhook.

## 40. Public Tracking

`GET /api/v1/orders/track/:publicId` returns a safe DTO only, e.g. Public ID, type, status, dates. Never serialize full Order to public tracking. Apply rate limiting.

## 41. File Download

Private download goes through authorized backend or controlled short-lived storage access. Admin can access relevant files. Member access, if exposed, is restricted to own order. Guest public tracking never exposes file download.

## 42. Security Middleware

Use as appropriate:
- security headers;
- CORS allowlist;
- request limits;
- rate limiting;
- secure cookies;
- authentication;
- authorization/policies;
- validation;
- centralized error handler.

Production debug output disabled.

## 43. Environment Variables

Commit `.env.example`, never `.env`.

Candidate backend variables:

```text
NODE_ENV=
PORT=
DATABASE_URL=
SESSION_SECRET=
FRONTEND_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STORAGE_PROVIDER=
STORAGE_BUCKET=
UPLOAD_MAX_FILE_SIZE=
UPLOAD_MAX_FILES=
TRUST_PROXY=
LOG_LEVEL=
WHATSAPP_NUMBER=
```

Frontend public variables may include:

```text
VITE_API_BASE_URL=
VITE_GOOGLE_CLIENT_ID=
```

Never place server secrets in `VITE_*`.

## 44. Brand Configuration

Centralize safe owner-editable frontend branding, e.g.:

```text
apps/web/src/config/brand.ts
apps/web/src/assets/brand/
```

Products/services/locations SHOULD come from backend/database rather than duplicated constants.

## 45. Errors

Use centralized predictable error handling. Categories may include Validation, Authentication, Authorization, NotFound, Conflict, BusinessRule. Avoid repetitive controller try/catch when centralized handling safely covers it.

## 46. Logging & Request IDs

Structured logs SHOULD include timestamp, request ID, route/method, status, duration, error category. Never log passwords, session secrets, OAuth tokens, storage credentials, private documents. Assign request IDs where practical for safe correlation.

## 47. Pagination & Query Efficiency

Growing collections MUST support pagination. Avoid unlimited order/product responses, N+1 queries, and obvious inefficient query structures. Add indexes from actual access patterns.

## 48. Testing Architecture

Backend unit: business rules/status/pickup/payment/services.

Backend integration: routes, validation, authentication, authorization, persistence.

Frontend: forms, critical components/states/access behavior.

E2E: Guest order, Member auth/order/history, Guest tracking, Admin login/status update.

Risk-based testing; do not chase 100% coverage for its own sake.

## 49. Test Environments & Seed

Separate development/test/production. Tests MUST NOT use production DB. Development seed MAY create development Admin, dummy location/services/products. Development credentials MUST NOT become production credentials.

## 50. Migration Workflow

```text
edit Prisma schema
 ↓
create migration
 ↓
inspect migration
 ↓
apply development
 ↓
run tests
 ↓
commit schema + migration
```

No normal ad-hoc production schema mutation.

## 51. Code Quality

Use strict TypeScript, avoid `any` unless justified, use ESLint/consistent formatting, focused functions, meaningful reuse, and no abstraction merely for appearance.

Comments SHOULD explain why. Owner-editable configuration MAY contain clear MABA PRINTING comments.

## 52. Local Development

Frontend/backend run via npm scripts. PostgreSQL MAY run through Docker Compose. Docker should not unnecessarily block straightforward local debugging. `.env.example` documents configuration.

## 53. Deployment

Provider-agnostic topology:

```text
User
 ↓
Frontend Hosting
 ↓ HTTPS
Node/Express API
 ├── Managed PostgreSQL
 └── Private Object Storage
```

Prefer same-site/same-parent-domain where practical for cookies. Cross-site deployment requires exact CORS, credentials, Secure/SameSite cookies, and CSRF protection. Providers are selected near deployment based on current limits/pricing.

## 54. Health Endpoint

`GET /api/v1/health` → minimal `{"status":"ok"}`. Do not expose credentials/infrastructure internals.

## 55. CI

When foundation is ready, CI SHOULD eventually run install, lint, typecheck, tests, build, Prisma validation. GitHub Actions MAY be used.

## 56. Development Phases

```text
00 Repository & Tooling
01 Application/Foundation
02 Database Foundation
03 Authentication
04 Public Website
05 Locations & Business Configuration
06 Printing
07 ATK
08 Laptop Service
09 Software Installation
10 Unified Order System
11 File Upload
12 Tracking
13 Member Account
14 Admin Dashboard
15 Payment
16 WhatsApp
17 Audit & Security Hardening
18 Integration / E2E Testing
19 Performance & Accessibility
20 Production Deployment
21 Production Verification
```

Phases MAY be refined into smaller tasks without changing requirements. Never implement all phases in one AI turn.

## 57. Vertical Slice Workflow

```text
Requirement
 ↓
Schema/Migration if needed
 ↓
Repository if justified
 ↓
Service
 ↓
Validator
 ↓
Controller
 ↓
Route
 ↓
Frontend
 ↓
Tests
 ↓
Verification
```

One execution task at a time. Stop after verified completion.

## 58. AI Project Memory

Repository documents are persistent AI context:

```text
docs/ai/
├── PROJECT_STATE.md
├── DECISIONS.md
├── CURRENT_TASK.md
├── CHANGELOG_AI.md
└── KNOWN_ISSUES.md
```

Chat history is not the sole memory.

## 59. Source-of-Truth Hierarchy

1. `PRD_MABA_PRINTING_v1.0.md`
2. `ARCHITECTURE_MABA_PRINTING_v1.0.md`
3. `DECISIONS.md`
4. `CURRENT_TASK.md`
5. Existing verified implementation

Lower sources MUST NOT silently override higher sources. Material conflict → inspect/report before broad changes.

## 60. AI Guardrails

MUST inspect before editing, implement approved scope only, avoid invented requirements, preserve unrelated working behavior, justify meaningful dependencies, migrate schema explicitly, test relevant behavior, report actual verification, and update project memory.

MUST NOT fabricate command results, disable security, weaken valid tests, expose secrets, perform destructive migration without approval, silently expand MVP, or automatically continue to the next task.

## 61. Human Approval Gates

Explicit approval required before:
- material stack/architecture change;
- major dependency;
- destructive migration;
- security reduction;
- MVP scope expansion;
- irreversible production operation;
- material source-of-truth conflict resolution;
- removal of significant verified functionality.

Low-risk internal details may be decided autonomously.

## 62. Feature Definition of Done

Feature requires approved behavior, architecture compliance, relevant validation/authorization, migration when needed, relevant tests, applicable typecheck/lint/build verification, no hardcoded secret, no critical regression, and project-memory update.

## 63. Production Readiness

Before production completion verify build, migrations, HTTPS, secure cookie/CORS/CSRF topology, DB, private storage, Google configuration, Guest/Member/Admin critical flows, upload/download authorization, safe tracking DTO, QRIS/Cash, WhatsApp deep link, responsive UI, and non-sensitive logging.

## 64. Deferred Provider Decisions

Intentionally deferred:
- frontend host;
- Node API host;
- managed PostgreSQL provider;
- object storage provider;
- scheduler/cron provider.

Choose near deployment using current capabilities/limits/pricing. Deferral does not permit architecture redesign.

## 65. Architecture Freeze

Architecture v1.0 is baseline. Compatible internal details MAY evolve. Material architecture changes require explicit decision. Future features do not alter MVP automatically. Security/technical impossibility MUST be reported. AI MUST NOT silently substitute another stack.

## 66. Final Operating Model

Build the simplest maintainable, secure, testable implementation that correctly satisfies the frozen MABA PRINTING MVP specification. Do not optimize for maximum abstraction or maximum code generation.

---

**End of Technical Architecture — MABA PRINTING v1.0**
