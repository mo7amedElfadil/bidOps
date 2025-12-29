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
    - Bid review page (`/approvals/review`) with pricing pack summaries, approval badges, and finalize action
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
  * Settings: stage and status picklists are now configurable and drive opportunity dropdowns
  * Collectors: Available tender run accepts date filters so `/tenders/collect` can pull a date window
  * Collectors: Monaqasat available tender adapter now walks pages until the requested `fromDate` window or `MONAQASAT_TENDER_MAX_PAGES`, mirroring the awards crawler
  * Collectors: Monaqasat award + available adapters now force English locale via headers, culture cookie, and ChangeLang
  * Approvals: Added decision DTO (supports changes requested/resubmitted), stage gating, and Go/No-Go request enhancements
  * Opportunities: Submission checklist model + endpoints
  * Change Requests: New module with create/list/update APIs
  * Web: Available tenders includes a Go/No-Go request modal wired to `/approvals/request`
  * Web: Opportunity overview includes submission checklist UI and bond reminder banner
  * Web: Change requests panel added to opportunity overview (create + status update)
  * Web: Approvals page supports change-request/resubmission statuses and stage-specific CTA labels
  * Users: Admin can edit email; create defaults to firstName@it-serve.qa when email omitted
  * Web: Post submission route, list section, and board lane added (daysLeft/stage/status rules)
  * Ops: Workers container fixed for collector queue (bullseye image, prisma generate mount, redis maxRetriesPerRequest)
  * API: Tenant pack access now returns NotFound for missing packs and controllers await access checks
  * Date filters: Added backend + UI normalization for tender/award ranges; tender list now supports from/to filters
  * Notifications: Added business roles, notification routing defaults, preferences, and in-app notification endpoints/UI
  * Notifications: Event-driven dispatch for opportunity creation and review requests; SLA alerts de-duped with longer cadence
  * Tenders/Opportunities: Go/No-Go status mapped to tenders list and displayed as status chips with quick access to linked opportunities
  * Tenders: Added reject action for Go/No-Go with optional reason
  * Collectors: Added optional Arabic-to-English title translation with original-title preservation
  * Approvals: Review queue supports scope=mine/all and highlights next action in the UI
  * Docs: Added a comprehensive user management + auth plan (onboarding, invites, password reset, default admin)
  * Auth: Implemented local auth lifecycle (invite/accept/reset/change), user status fields, and default admin bootstrap
  * Ops: SMTP auth support wired for external email providers (env-driven)
  * Docs: Added full end-to-end testing guide for all modules
  * Web: Added role-based onboarding guide and streamlined navigation/view switcher
  * Web: Added dashboard landing page and moved opportunities list to `/opportunities`
  * API/Web: Added `/users/me` for current-user context (dashboard + onboarding)
  * Web: Added admin setup checklist to dashboard (users/roles/notification defaults)
  * Opportunities: Added server-side "my queue" filter and dashboard quick link
  * Analytics: Added onboarding + approval turnaround telemetry endpoint
  * Web: Header layout now exposes notification inbox/dropdown with badge and actionable items
  * Web: Navigation simplified into a grouped mega menu dropdown to tidy the header
  * Web: Account page now hosts personal profile updates, change-password access, and individual notification preferences
  * Web: Change request submissions now send change-request notifications to bid owners
  * Web: Standardized tenders/awards filters with shared Button/Input/Card components; tender search placement aligned with awards
  * Web: Navigation now includes a User group for personal settings; Settings page separates SLA vs general configuration
  * Web: Settings split into separate routes for SLA, opportunity lists, and system defaults with a shared settings nav
  * Web: Notifications now link to the action target (payload actionUrl or opportunity fallback) from inbox and list views
  * Web: Access requests now dispatch to admins (email + in-app) and record notification preferences per admin roles
  * Web: Admin user grid exposes copyable invite link (via new endpoint) so admins can share invites out-of-band
  * Web: Timeline dark theme override now forces gantt SVG row backgrounds/grid to use theme card colors
  * Tenders: Smart filter models (activities/classifications), classification engine, and UI filter badges added
  * Collectors: Available tenders classify on ingest; API exposes smart filter activities, classification, and reprocess endpoints
  * Tenders: Added seed script for default ITSQ/IoT activities and adjusted "New" filter to use tender timestamps
  * Web: Admin Tender Activities page (CRUD + translate + reprocess)
  * Tenders: Seed script now merges Arabic keyword variants
  * Collectors: Arabic titles enforced to translate; untranslated Arabic is skipped and stored only when English translation succeeds
  * Tenders API: Arabic titles auto-translate on create/update with originals stored in `titleOriginal`; added `/tenders/translate` admin backfill endpoint
  * Tenders: Smart filtering now uses semantic embeddings stored in pgvector with similarity scoring and updated classification
  * Tenders: Batch embedding/translation backfills to reduce per-tender API calls during reprocess
  * Tenders: Recommendation notifications default to new tenders; manual send endpoint/UI for Sales/Executive/Admin with scope/threshold criteria
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
  * 2025-12-07: Default margin set to 25%; observability dashboards provisioned; collectors adapter framework with Qatar Gov template
  * 2025-12-08: First award portal target = Monaqasat (public data only)
  * 2025-12-08: Power BI integration deferred; CSV exports remain current integration point
  * 2025-12-08: Retention default = 5 years with external backups
  * Pending: Monaqasat selectors/sample award HTML; SLA holiday behavior; bilingual UI scope
