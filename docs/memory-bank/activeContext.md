* Current focus: All core web UIs implemented. Guardrails added for pricing margins. Observability dashboards wired. Ready to harden and pick first real award portal.
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
  1. Hardening: Rate limiting tuning, security headers documentation (pass through code and docs)
  2. M3: Select first external award portal and implement real adapter + scheduling + curation UI
  3. Power BI model and curated warehouse tables (M4)
  4. Manifest signing/verification and approval signatures (submission/approvals hardening)
* Pending decisions:
  - First portal to target for award ingestion (Qatar Government Procurement Portal?)
* Risks:
  - Portal ToS or anti-bot controls
  - Parsing quality on PDFs
  - Data quality for competitor names and award values
* Assumptions:
  - AAD tenant available when ready for production auth
  - Azure Qatar Central subscription ready
  - Power BI licenses available for executives
