# Docs index

This folder is the living documentation for ITSQ BidOps. Start here to navigate the project.

Read first:

- `project_plan.md`
- `context.md`

Sections:

- api.md — API endpoints, auth flows, schemas
- ingest.md — award-result collectors, portal adapters, parsers, schedules
- web.md — Kanban, timeline, compliance matrix UI, submission pack
- pricing.md — BoQ, vendor quotes, approvals, margin guardrails
- compliance.md — clause extraction, matrix, evidence, exports
- analytics.md — metrics, KPIs, semantic model, refresh
- Note: Power BI dataset integration is deferred; use CSV exports.
- security.md — AAD SSO, RBAC, RLS, secrets, retention, residency
- ops.md — Makefile targets, Docker, envs, migrations, runbooks, SLOs
  - Note: `AUTH_PROVIDER` toggles `local|aad`; `WEB_API_URL` bakes frontend API base

Memory Bank (critical for continuity):

- memory-bank/README.md — Memory discipline and workflows
- **memory-bank/plan.md** — **Comprehensive development plan** (verbose, team-shared)
- memory-bank/projectbrief.md — product scope and foundation
- memory-bank/productContext.md — user jobs and UX goals
- memory-bank/systemPatterns.md — architecture and design patterns
- memory-bank/techContext.md — stack and tooling
- memory-bank/activeContext.md — current sprint, decisions, risks
- memory-bank/progress.md — status, issues, decision log

