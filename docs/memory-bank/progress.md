* Done:
  * Seeded `docs/` and Memory Bank with baseline content
  * Monorepo bootstrapped with apps and packages
  * Docker Compose infra scaffolded (Postgres, Redis, OpenSearch, OTEL, Grafana/Prometheus, Mailhog)
  * Makefile targets scaffolded
  * API skeleton (NestJS + Swagger + health) created
  * Web app scaffolded (Vite + React + Tailwind)
  * Workers and Collectors scaffolds created
  * Shared packages (types, schemas, adapters, parser-tools) added
  * CI workflow scaffolded
  * Env variables documented and config loaders added
  * Lint/format configs added
  * Local auth implemented (register/login/dev-login with JWT)
  * Global RBAC and tenant scoping
  * Storage abstraction implemented (local filesystem for dev, Azure Blob for prod)
  * Web UIs completed:
    - Opportunities List with action links
    - Opportunities Kanban Board
    - Tracker Import Wizard
    - Attachments Page
    - Compliance Matrix with PDF import and CSV export
    - Clarifications (Q&A) with add/edit/export
    - Pricing Workspace (BoQ items, vendor quotes, pack calculator)
    - Approvals workflow UI (bootstrap chain, approve/reject)
    - Submission Pack Builder
    - Outcome Recording (Won/Lost/Withdrawn/Cancelled with reason codes)
  * API modules implemented:
    - Opportunities CRUD with filters and tenant scoping
    - Clients CRUD
    - Import (tracker CSV upload)
    - Settings (SLA thresholds)
    - Attachments (upload/list with search indexing)
    - Compliance (clauses CRUD, PDF import, CSV export)
    - Clarifications (Q&A CRUD, CSV export)
    - Pricing (BoQ items, vendor quotes, pack recalculation)
    - Approvals (bootstrap chain, approve/reject decisions)
    - Submission (pack builder with manifest and checksum)
    - Outcomes (record bid results)
    - Awards (staging, curation, events)
    - Analytics (CSV exports for opportunities and awards)
  * Pricing guardrails: minimum margin enforced via `PRICING_MIN_MARGIN`
  * Observability: Prometheus + Grafana provisioning with BidOps overview dashboard
  * Collectors: Adapter framework with Sample adapter and Qatar Gov template; staging insert and scheduling support
  * Awards UI: Web staging and curated awards pages with curate action
  * Frontend refreshed with TanStack Query + protected layout/nav; opportunity overview shell; attachment search; SLA settings UI; tracker wizard cleanup; auth helper redirects on 401
  * Settings: Added holiday calendar and retention policy endpoints
  * Settings UI: Added holiday calendar and retention policy configuration
  * Docs: Updated analytics to defer Power BI integration; ingest to target Monaqasat; retention policy and bilingual notes
  * Collectors: Monaqasat adapter now parses awarded tenders list and tender details for winners/award value
  * Collectors: Monaqasat adapter forces English locale and captures buyer names from details
  * Collectors: Added HTTP server to trigger runs with date range; UI supports manual trigger
  * Collectors: In-memory dedupe per run; staging cleanup for duplicate `portal+tenderRef`; delete+insert by `portal+tenderRef` (or `portal+sourceUrl` when missing)
  * Collectors: Available ministry tenders adapter and collector endpoint; records stored in `MinistryTender`
  * Opportunities: Create supports manual client input (datalist) and clientName upsert
  * Awards staging list supports date range filtering
  * Web: Available tenders page with promote-to-opportunity action and purchase link
  * API: Available tenders module (list/create/update/delete/promote/collect)
  * Users: Admin user management API + UI (create/edit/disable)
  * Opportunities: Submission date/time + source/method inputs; countdown ring in list
  * Opportunities: Overview header uses client name; summary fields editable; stage progression indicator
  * Compliance & Clarifications: CSV import endpoints and UI actions
  * Pricing: Pack worksheet rows, custom columns, formulas, and templates (global/opportunity)
  * Settings: FX rates table (base QAR) with live conversion in pricing
  * Attachments: Download support and AI extraction flow for compliance/clarifications/proposal drafts
  * Pagination: Opportunities, awards, tenders, attachments, clients, users
  * Frontend: Toast notifications for API errors
  * Settings: Timezone offset (UTC+3 default) configurable by admins
  * Dev ops: Monitoring services moved behind compose profile; added `make up-monitoring`
  * API: Fixed AuditInterceptor bootstrap crash; API now starts in Docker
  * Tracker import issues: invalid values recorded as ImportIssue rows and shown in import wizard + opportunity overview; cleared on update
  * Tracker import: date parsing avoids month overflow; bid owners linked to users with missing users flagged
  * Settings: import date format lock (MDY/DMY/AUTO) and temp user creation for missing owners
  * Opportunities: bid owner reassignment endpoint and UI selectors for owners
  * Opportunities: overview now allows creating new users (name/email/type/role) via modal for owner assignment
* Next:
  * Rate limiting defaults + security headers docs (hardening sweep)
  * Validate Monaqasat adapter against live pages; add edge-case handling
  * Power BI integration deferred; maintain CSV exports for PBI import
* Issues:
  * Port 4000 conflicts from stray host node process (if present, kill process then `make up`)
  * Web API URL baked at build; ensure `WEB_API_URL` set before rebuild
  * Playwright host deps missing; run `pnpm --filter @itsq-bidops/collectors exec playwright install --with-deps`
* Decision log:
  * 2025-12-06: Documentation aligned with `project_plan.md` and `context.md`
  * 2025-12-06: ORM = Prisma (confirmed)
  * 2025-12-06: Search = OpenSearch (confirmed)
  * 2025-12-06: Auth = Local database for dev, AAD OIDC for prod (AUTH_PROVIDER toggle)
  * 2025-12-06: Storage = Local filesystem for dev, Azure Blob for prod (STORAGE_PROVIDER toggle)
  * 2025-12-06: All core web UIs implemented (Clarifications, Pricing, Approvals, Submission, Outcomes)
  * 2025-12-07: Margin guardrail enforced via `PRICING_MIN_MARGIN`; observability dashboards provisioned; collectors adapter framework with Qatar Gov template
  * 2025-12-08: First award portal target = Monaqasat (public data only)
  * 2025-12-08: Power BI integration deferred; CSV exports remain current integration point
  * 2025-12-08: Retention default = 5 years with external backups
  * Pending: Monaqasat selectors/sample award HTML; SLA holiday behavior; bilingual UI scope
