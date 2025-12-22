* Current focus: Monaqasat collector now triggerable from UI with date range; validate collector server stability.
* Recent changes:
  - Built all remaining web UI pages (Clarifications, Pricing, Approvals, Submission, Outcomes)
  - Updated Opportunities List with navigation links to all opportunity sections
  - Storage abstraction completed (local/Azure toggle via STORAGE_PROVIDER)
  - Pricing margin guardrail enforced via `PRICING_MIN_MARGIN`
  - Observability: Prometheus + Grafana provisioning with BidOps overview dashboard
  - Collectors: Adapter framework with Sample adapter and Qatar Gov template (template only)
  - Awards UI: Staging and curated awards pages with curate action
  - All API modules have tenant scoping and RBAC
  - Frontend refreshed with TanStack Query, protected layout/nav, opportunity overview shell, attachment search, SLA settings UI, and consistent opportunity tab headers
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
