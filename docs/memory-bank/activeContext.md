* Current focus: Opportunity workflow hardening, pricing templates/formulas/FX, CSV imports, and AI extraction from attachments.
* Recent changes:
  - Built all remaining web UI pages (Clarifications, Pricing, Approvals, Submission, Outcomes)
  - Updated Opportunities List with navigation links to all opportunity sections
  - Storage abstraction completed (local/Azure toggle via STORAGE_PROVIDER)
  - Pricing workspace uses a default 25% margin; users may override per item or pack
  - Observability: Prometheus + Grafana provisioning with BidOps overview dashboard
  - Collectors: Adapter framework with Sample adapter and Qatar Gov template (template only)
  - Awards UI: Staging and curated awards pages with edit/delete; staging list supports date filtering and pagination
  - Opportunities: Create form supports manual client input via datalist; submission time, method, and source
  - Opportunities: Overview header now uses client name; summary is editable; stage progression indicator added
  - Compliance & Clarifications: CSV import endpoints and UI actions added
  - Pricing: Added pricing pack worksheet rows, custom columns, Excel-style formulas, and template selection
  - Settings: FX rates table (base QAR) with live conversion used in pricing calculations
  - Attachments: Download endpoint + AI extraction (prompt + selected files) to draft compliance, clarifications, proposal sections
  - Tenders: Available ministry tenders collector + UI list with promote-to-opportunity action
  - Tenders: Added Go/No-Go rejection action with optional reason (tender list)
  - Collectors: Arabic titles can be translated to English during collection while preserving the original text
  - Approvals: Review queue now supports filtering to "my approvals" with next-action messaging
  - User management: authored plan for onboarding, invites, password reset, and default admin bootstrapping
  - User management: local auth lifecycle endpoints (invite/accept/reset/change), user status flags, default admin bootstrap
  - Ops: SMTP env now supports external providers (Office 365) for outbound email delivery
  - Docs: Added a comprehensive end-to-end testing guide
  - Tenders: Monaqasat available-tender adapter now walks pages until the requested date window (or `MONAQASAT_TENDER_MAX_PAGES`) so date-range filtering works like the award collector
  - Collectors: Monaqasat award + available adapters now force English locale via headers, culture cookie, and ChangeLang
  - Approvals: Added decision DTO (supports changes requested/resubmitted), stage gating, and Go/No-Go request updates
  - Opportunities: Submission checklist model + endpoints, and change request module (create/list/update)
  - Web: Available tenders now includes a Go/No-Go request modal that routes to the opportunity on submission
  - Web: Opportunity overview now includes the submission checklist and bond reminder banner
  - Web: Change requests panel added to opportunity overview (create + status update)
  - Web: Approvals page now supports change-request and resubmission statuses with stage-specific CTA labels
  - Users: Admin can edit email; create defaults to firstName@it-serve.qa when email omitted
  - Web: Post submission added (new route, list section, and board lane using daysLeft/stage/status)
  - Ops: Workers container updated (bullseye image, prisma generate mount, redis maxRetriesPerRequest) so collector jobs run
  - API: Tenant pack access now returns NotFound for missing packs and controllers await access checks
  - Users: Admin user management module and UI
  - All API modules have tenant scoping and RBAC
  - Frontend refreshed with TanStack Query, protected layout/nav, opportunity overview shell, attachment search, SLA settings UI, and consistent opportunity tab headers
  - Added `/approvals/review` review page that lists pricing packs, highlights approval statuses, and exposes the finalize action once all steps are approved
  - Tracker import issues tracked per opportunity; UI lists invalid cells and clears when corrected
  - Tracker import date parsing hardened (MM/DD vs DD/MM); bid owners parsed into user links with missing users flagged
  - Admin setting added to lock tracker import date format (MDY/DMY/AUTO); missing owners create temp users and issues
  - Opportunity overview now supports reassigning business owner and bid owners via user selectors
  - Opportunity overview now provides a modal to create new users (name/email/type/role) and assign them as owners
  - Settings now allows editing stage and status picklists that feed opportunity dropdowns
  - Tender collector endpoint now accepts `fromDate`/`toDate` so available tenders can be limited to a date window
  - Notifications: Business roles added (admin-managed) and user preferences + routing defaults added
  - Notifications: Event-driven dispatch for opportunity creation and review requests; SLA alerts de-duped with longer cadence
* Completed iterations:
  - M0: Foundations (monorepo, Docker, CI, schema, auth, storage) ✓
  - M1: Core Opportunities, SLA engine, document vault ✓
  - M2: Compliance matrix and pricing approvals ✓
  - Iteration A (Auth, RBAC, Audit, Search) ✓
  - Iteration B (Compliance Matrix & Clarifications) ✓
  - Iteration C (Pricing & Approvals, Submission Pack, Outcomes) ✓
* Next priorities:
  1. Hardening: SLA holiday calendar config; retention policy config; security docs pass
  2. M3: Validate Monaqasat adapter against live pages; tune parsing (winners, award value)
  3. Power BI integration deferred; continue using CSV exports
  4. Submission/approval signing alignment with PM/Executive flow
* Pending decisions:
  - Monaqasat selectors validation and edge cases (missing winner tables, multiple winners)
  - Holiday calendar behavior in SLA (calendar days vs business days)
  - Bilingual UI scope (full i18n vs content-only)
* Risks:
  - Portal ToS or anti-bot controls
  - Parsing quality on PDFs
  - Data quality for competitor names and award values
* Assumptions:
  - AAD tenant available when ready for production auth
  - Azure Qatar Central subscription ready
  - Power BI licenses available for executives
