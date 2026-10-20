\# MABA PRINTING — Decisions



This document records accepted product and

technical decisions.



Do not silently override an ACCEPTED decision.



\---



\## ADR-001 — Application Stack



Status: ACCEPTED



Decision:



Frontend:

React + Vite + TypeScript



Backend:

Express + TypeScript



Database:

PostgreSQL



Reason:



Selected as the primary development stack

for MABA PRINTING.



\---



\## ADR-002 — Application Architecture



Status: ACCEPTED



Decision:



Backend uses:



Route

→ Middleware

→ Validator

→ Controller

→ Service

→ Repository when justified

→ Prisma

→ PostgreSQL



Controllers must remain thin.



Business logic belongs in services.



\---



\## ADR-003 — Repository Strategy



Status: ACCEPTED



Decision:



Use one repository containing:



apps/web

apps/api

packages/shared



Reason:



Simplifies project management and AI context.



\---



\## ADR-004 — Consumer Account



Status: ACCEPTED



Decision:



Consumer account is OPTIONAL.



Consumers may continue as Guest or create

a Member account.



\---



\## ADR-005 — Guest Orders



Status: ACCEPTED



Decision:



Guest orders use a non-predictable Public Order ID.



Guest does not require an account.



\---



\## ADR-006 — Member Authentication



Status: ACCEPTED



MVP supports:



\- Email + Password

\- Google OAuth



WhatsApp OTP authentication is NOT part

of MVP.



\---



\## ADR-007 — WhatsApp



Status: ACCEPTED



MVP uses WhatsApp deep links only.



No WhatsApp Business API.



No automated WhatsApp notification.



\---



\## ADR-008 — Payment



Status: ACCEPTED



MVP payment methods:



\- CASH

\- QRIS\_STATIC



No automatic payment gateway.



Payment confirmation is performed manually

by Admin.



\---



\## ADR-009 — Order Status



Status: ACCEPTED



Lifecycle:



SUBMITTED

→ CONFIRMED

→ IN\_PROGRESS

→ READY

→ COMPLETED



Additional state:



CANCELLED



\---



\## ADR-010 — Pricing



Status: ACCEPTED



Prices may use:



FIXED



or



REQUIRES\_CONFIRMATION



\---



\## ADR-011 — ATK Inventory



Status: ACCEPTED



MVP inventory does not track numeric stock.



Availability:



AVAILABLE

UNAVAILABLE



\---



\## ADR-012 — File Upload



Status: ACCEPTED



Multiple files may be uploaded.



Different supported file types may exist

inside the same order.



Files must still be validated.



Unsupported or oversized files may be sent

through WhatsApp instead.



\---



\## ADR-013 — File Retention



Status: ACCEPTED



Order files may be deleted 30 days after

the order reaches COMPLETED.



Order metadata may remain.



\---



\## ADR-014 — Private Files



Status: ACCEPTED



Customer order files must NOT be exposed

through predictable public URLs.



\---



\## ADR-015 — Laptop Pickup



Status: ACCEPTED



Distance <= 5 km:

FREE



Distance > 5 km:

IDR 2,000 per additional kilometer.



Distance is confirmed manually by Admin.



No Maps API in MVP.



\---



\## ADR-016 — Multiple Locations



Status: ACCEPTED



MABA PRINTING may have multiple business locations.



Each location may have:



\- address

\- operating hours

\- service availability



All locations use the same primary WhatsApp number.



\---



\## ADR-017 — Admin Model



Status: ACCEPTED



Multiple Admin users are supported.



MVP Admin users have the same permissions.



Important Admin actions are auditable.



\---



\## ADR-018 — Identity Model



Status: ACCEPTED



Member and Admin use the same underlying

identity model with role-based authorization.



Admin UX may use a separate login route.



\---



\## ADR-019 — Money



Status: ACCEPTED



IDR monetary values are stored as integer values.



Do not use floating point representation

for money.



\---



\## ADR-020 — Database Migrations



Status: ACCEPTED



Schema changes require migrations.



Do not modify already-applied migrations

without explicit justification.



\---



\## ADR-021 — Frontend Global State



Status: ACCEPTED



Do not introduce Redux for MVP unless

complexity later justifies it.



Prefer:



\- React local state

\- Context where appropriate

\- server-state/query tooling when justified



\---



\## ADR-022 — Hosting



Status: DEFERRED



Hosting provider is intentionally not locked.



The application must remain reasonably

provider-agnostic.



Final provider selection occurs near deployment.



\---



\## ADR-023 — Branding



Status: ACCEPTED



Business owner will manually provide/update:



\- logo

\- QRIS asset

\- brand colors

\- final business information



Code must expose clear configuration points

without scattering values across components.



\---



\## ADR-024 — MVP Scope



Status: ACCEPTED



Features categorized as FUTURE must not

silently enter MVP implementation.



New scope requires explicit approval.

