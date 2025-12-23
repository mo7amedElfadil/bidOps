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
  - Tenders: Monaqasat available-tender adapter now walks pages until the requested date window (or `MONAQASAT_TENDER_MAX_PAGES`) so date-range filtering works like the award collector
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
