\# MABA PRINTING — PHASE 00



\## PHASE



Phase ID:



PHASE-00



Phase Name:



Repository \& Tooling Foundation



Status:



PLANNED



\---



\# 1. OBJECTIVE



Establish the initial development repository and tooling foundation for MABA PRINTING.



This phase must create a clean foundation for later application development without implementing product features.



\---



\# 2. REQUIRED CONTEXT



Before proceeding, read:



\- PRD

\- Technical Architecture

\- Master Prompt

\- DECISIONS.md

\- PROJECT\_STATE.md

\- CURRENT\_TASK.md

\- KNOWN\_ISSUES.md



Verify that implementation has not already progressed beyond the documented state.



\---



\# 3. IN SCOPE



Phase 00 includes:



\- root repository structure

\- npm workspace

\- React + Vite + TypeScript application foundation

\- Express + TypeScript application foundation

\- shared package foundation

\- TypeScript configuration

\- linting

\- formatting

\- environment-variable foundation

\- test tooling foundation

\- root development scripts

\- documentation integration



\---



\# 4. OUT OF SCOPE



Do NOT implement:



\- PostgreSQL schema

\- Prisma domain models

\- authentication

\- Google OAuth

\- business locations

\- products

\- services

\- orders

\- file upload

\- payment

\- WhatsApp business behavior

\- Member dashboard

\- Admin dashboard

\- production deployment



Basic placeholder application responses are acceptable only when needed to verify tooling.



\---



\# 5. EXPECTED REPOSITORY



Expected high-level structure:



maba-printing/

├── apps/

│   ├── web/

│   └── api/

├── packages/

│   └── shared/

├── docs/

│   ├── PRD\_MABA\_PRINTING\_v1.0.md

│   ├── ARCHITECTURE\_MABA\_PRINTING\_v1.0.md

│   └── ai/

├── package.json

├── .gitignore

├── .env.example

└── README.md



Exact tooling files may be added when justified.



\---



\# 6. TASKS



TASK-00.01

Repository Initialization



TASK-00.02

React + Vite + TypeScript Foundation



TASK-00.03

Express + TypeScript Foundation



TASK-00.04

Shared Package Foundation



TASK-00.05

TypeScript Configuration



TASK-00.06

Code Quality Foundation



TASK-00.07

Environment Configuration Foundation



TASK-00.08

Testing Foundation



TASK-00.09

Unified Development Scripts



TASK-00.10

Phase Verification



\---



\# 7. CONSTRAINTS



Use npm.



Preserve the approved monorepo architecture.



Do not introduce product functionality.



Do not add a monorepo orchestration framework unless clearly necessary and explicitly approved.



Avoid unnecessary dependencies.



Do not add Redux.



Do not add database tooling during this phase unless the architecture/task is explicitly revised.



\---



\# 8. SECURITY



No real credentials may be committed.



`.env.example` may contain variable names and safe placeholders only.



No secret should be required merely to verify Phase 00.



\---



\# 9. TESTING EXPECTATIONS



At completion, tooling should demonstrate that:



\- frontend test infrastructure works

\- backend test infrastructure works

\- TypeScript validation works

\- linting works

\- builds work

\- root workspace commands work



Use minimal foundation tests.



Do not create fake product tests.



\---



\# 10. PHASE COMPLETION



Phase 00 is complete only when all TASK-00 tasks have individually completed verification.



The final phase verification must confirm:



\- dependency installation succeeds

\- TypeScript checks succeed

\- lint succeeds

\- tests succeed

\- frontend build succeeds

\- backend build succeeds

\- workspace scripts operate correctly

\- project-memory documentation reflects actual state



Do not begin Phase 01 automatically.



STOP after final Phase 00 verification.

