# MABA PRINTING

Website layanan terpadu untuk jasa cetak dokumen, penjualan ATK, service laptop, dan instalasi software — ditujukan terutama untuk mahasiswa, dengan konsumen umum tetap dapat menggunakan layanan.

## Development Status

**Phase 00 — Repository & Tooling Foundation (in progress).**

The repository skeleton, root npm workspace, a minimal React + Vite + TypeScript frontend foundation (`apps/web`), and a minimal Express + TypeScript backend foundation (`apps/api`, health endpoint only) exist. No database, authentication, or product feature has been implemented yet.

## Approved Stack

- **Language:** TypeScript
- **Package manager:** npm (workspaces)
- **Frontend:** React + Vite + React Router + Tailwind CSS
- **Backend:** Node.js + Express
- **Validation:** Zod
- **Database / ORM:** PostgreSQL + Prisma ORM
- **Testing:** Vitest, Supertest, React Testing Library, Playwright

## Repository Structure

```text
maba-printing/
├── apps/
│   ├── web/        # Frontend (React + Vite foundation)
│   └── api/        # Backend API (Express foundation)
├── packages/
│   └── shared/     # Shared code (package foundation, empty API)
├── docs/           # Product & technical specification
│   └── ai/         # AI project memory & task documents
├── .env.example    # Environment inventory (reference only)
├── .gitignore
├── package.json
├── tsconfig.base.json  # Shared TypeScript compiler policy
└── README.md
```

## Local Environment

Each app owns its environment file. Copy the example next to it; `.env` files are git-ignored.

- `apps/api/.env.example` → `apps/api/.env` — server-only values. The Phase 00 API needs none; `PORT` defaults to `3000`.
- `apps/web/.env.example` → `apps/web/.env` — `VITE_*` values only. These are embedded in the browser bundle and are public: never put secrets there.

## Commands

First time on a machine:

1. `npm install`
2. `npx playwright install chromium` (one-time browser download for E2E)

Then, from the repository root (no manual build step needed):

| Command                | Purpose                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run dev`          | Web (Vite, port 5173) and API (port 3000) together               |
| `npm run dev:web`      | Web only                                                         |
| `npm run dev:api`      | API only                                                         |
| `npm run build`        | Production build: shared → api → web                             |
| `npm run start:api`    | Start the built API (run `npm run build` first)                  |
| `npm run typecheck`    | TypeScript check of all workspaces                               |
| `npm run lint`         | ESLint                                                           |
| `npm run format`       | Prettier write                                                   |
| `npm run format:check` | Prettier check                                                   |
| `npm run test`         | Unit/component/API tests (Vitest)                                |
| `npm run test:e2e`     | Browser smoke test (Playwright, Chromium)                        |
| `npm run clean`        | Remove generated build output (`dist/`, TypeScript build caches) |

## Documentation

- [Product Requirements (PRD)](docs/PRD_MABA_PRINTING_v1.0.md)
- [Technical Architecture](docs/ARCHITECTURE_MABA_PRINTING_v1.0.md)
- [Project State](docs/ai/PROJECT_STATE.md)
- [Decisions](docs/ai/DECISIONS.md)
- [Current Task](docs/ai/CURRENT_TASK.md)
