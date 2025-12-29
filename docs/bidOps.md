# ITSQ BidOps Platform Overview

This document gives a high-level description of the BidOps system: the product vision, the primary capabilities, the techniques we rely on, and the infrastructure and tools that support the platform end-to-end.

## Objective
ITSQ BidOps is a single source of truth for bid management. The platform’s goal is to surface relevant tenders, let ITSQ teams collaborate across opportunities, enforce SLAs, shepherd pricing/approvals, and close the loop with outcomes and analytics. The end objective is zero missed submission windows, auditable approvals, and a predictable, data-driven path from tender discovery to award or closeout.

## How we achieve the goal
1. **Automated intake & smart filtering** – We ingest public data (Monaqasat awards/available tenders, future collector adapters) into staging tables, apply rules and classifiers to highlight ITSQ-relevant opportunities, and keep a bilingual data trail. A built-in collector framework handles paging, dedupe, and CSV exports for Power BI.
2. **Opportunity lifecycle** – The web UI combines Kanban, list, and timeline views; opportunity CRUD handles manual entries plus collector promotions, with countdown timers, bid owners/business owners, and multilingual fields. Pricing workspaces support BoQ rows, vendor quotes, Excel-style formulas, FX conversions, and margin guardrails.
3. **Approvals and checklist** – Multi-stage approvals (Go/No-Go → Working → Pricing → Final submission) are enforced on both the API and UI: blocked reasons, reminder banners (tender bond, upload checklist), and finalization signing. Change requests, object locking, and notifications keep approvals traceable.
4. **Notifications & onboarding** – Business roles and configurable routing deliver targeted email/in-app alerts. Invite and self-service flows are integrated with onboarding checklists, user preferences, and templated emails (via shared branding helper) so teams can see “next actions.”
5. **Documentation & observability** – Every capability is documented (docs/checklist, ops, approval, etc.), and the stack includes monitoring (Grafana/Prometheus), email loggers, and build/test automation so we can ship features with confidence.

## Techniques and patterns
- **Shared helper modules** – Utilities such as the branding helper centralize environment-driven URLs, email assets, and support contacts.  
- **TanStack Query + shadcn UI** – Frontend components use TanStack Query for data fetching, React Router for navigation, and shadcn UI/tailwind tokens for the HyprDark/light themes.  
- **Prisma + NestJS** – Backend validation, RBAC, tenant scoping, and APIs run on NestJS with Prisma as the ORM.  
- **BullMQ + Redis** – Background jobs (collectors, notifications, SLA digest) run through BullMQ and Redis queues for resiliency.  
- **Email templating** – Emails render through `notifications/email/template.ts`, which inserts `APP_BASE_URL`, social links, and CTA metadata.  
- **Collector adapters** – Each portal adapter implements a common interface, forcing locale, deduping records, and storing translations for bilingual support.

## Infrastructure & tools
- **Docker Compose** runs Postgres (data), Redis (queues), OpenSearch (search), the API, web app, collectors, workers, mailhog, Grafana, Prometheus, and OpenTelemetry collector for observability.  
- **Makefile / CLI helpers** (`make up`, `make logs`, `make db-migrate`, `make collectors-run`) standardize local operations.  
- **Playwright** (collectors) is provisioned for adapters that navigate portal UI/JS.  
- **PNPM monorepo + Turbo** orchestrate builds across apps (`@itsq-bidops/api`, `web`, `workers`, `collectors`) and shared packages (`tender-classifier`, `parser-tools`, `shared-types`).  
- **Prisma migrations** maintain schema changes (`schema.prisma`, migrations directory); seeds capture default admins, business roles, and retention policies.  
- **Grafana + Prometheus dashboards** track API latency, collector jobs, queue lag, and opportunity metrics. Alerts can fire on SLA ticks, collector backlogs, or email failures.  
- **Mailhog (dev)** receives outbound messages for verification; production uses the configured SMTP provider (Office 365 or Gmail + OAuth2/app password) plus aggregated notification digests.

This document can serve as the architectural framing for new team members, product reviews, or operator runbooks. Update it as we evolve the platform (additional adapters, new UI paradigms, evolving SLA reminders, etc.) so the narrative stays synchronized with the living docs and memory bank.
