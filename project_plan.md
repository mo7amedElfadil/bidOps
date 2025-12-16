# ITSQ BidOps – End‑to‑End Application Plan

## 1) Objectives & Scope

**Goal:** Build a Jira‑style web platform that manages the full bid lifecycle for ITSQ (from sourcing and purchasing a bid to award/lose/withdraw), centralizes collaboration, and powers analytics on win/loss, competitor behavior, pricing, effort, and ROI.

**Primary Outcomes**

* Zero missed deadlines via SLA timers, alerts, and escalations.
* Single source of truth for RFPs, clarifications, BOQs, site visits, pricing approvals, submission artifacts, and post‑award/closeout.
* Automated ingestion of external bid results to track competitors (winner, award value, business activity codes, etc.).
* Executive analytics in Power BI with drill‑downs by client, sector, OEM, bid size, cycle time, and reason codes.

---

## 2) Users, Roles & Permissions (RBAC)

* **Executive**: Portfolio dashboards, approvals, final sign‑off, read all.
* **Bid Manager**: Owns opportunity record, plans workflow, assigns tasks, manages clarifications, submission gates.
* **Solution Lead / Architect**: Owns technical solution, dependencies, risk log, BoM/BoQ assumptions.
* **Commercial/Finance**: Costing, price build‑up, margin guardrails, tender bond/guarantee tracking.
* **Legal/Contracts**: T&Cs review, exceptions, deviations log, compliance statements.
* **Sourcing/Vendor Mgmt**: OEM quotes, lead times, compliance certificates.
* **Contributors**: Section authors, graphics, QA.
* **Analyst**: Curates competitor dataset, market trends, post‑mortems.
* **Admin**: Tenant settings, templates, master data (clients, OEMs), taxonomies.

**Permission Model**: Role + Team + Record‑level ownership with sharing links; immutable audit log of edits, downloads, and approvals.

---

## 3) Lifecycle Workflow (State Machine)

### High‑Level Stages

1. **Sourcing** → tender discovered (portal scrape/manual import)
2. **Qualification** → go/no‑go, strategy, team, timelines
3. **Purchase** → tender docs bought; bond/guarantee prep
4. **Elaboration** → RFI/clarifications, site visit, compliance matrix, solution, vendor quotes
5. **Pricing & Approvals** → BoQ pricing, commercials, internal approvals
6. **Submission** → technical & commercial pack, portal upload/hand‑delivery log
7. **Evaluation** → post‑submission Q&A, demos, samples, negotiations
8. **Outcome** → **Won / Lost / Withdrawn / Cancelled**
9. **Closeout** → lessons learned, repository, metrics update

### Gates & Automations

* SLA timers on **Submission Date**, **Clarification Deadline**, **Bond Validity**, **Price Freeze**, **Question Window**.
* Escalation rules (email/Teams) when due in X days or overdue.
* Approval gates: Legal -> Finance -> Executive; electronic sign‑off.

---

## 4) Data Model (ERD Outline)

> Initial import aligns to your working tracker headers: **Customer, Tender Details, Description, Submission Date, Notes, Status, Business Owner, Bid Owner, Tender Bond Readiness, Tender Value, Validity, Mode of Submission, Days Left, Reformatted Date, Rank**.

### Core Entities

* **Opportunity**(id, client_id, sector, tender_ref, title, description, source_portal, discovery_date, submission_date, status, stage, priority_rank, days_left, mode_of_submission, bond_required, bond_amount, validity_days, data_owner)
* **Client**(id, name, authority_type, address, contact_points)
* **TenderPack**(id, opportunity_id, purchased_on, purchase_cost, documents[])
* **Clarification**(id, opportunity_id, question_no, text, submitted_on, response_on, file, status)
* **Event**(id, opportunity_id, type[site_visit/demo/pre‑bid], date, attendees, notes)
* **Task**(id, opportunity_id, assignee_id, type, status, due, checklist, attachments)
* **ComplianceMatrix**(id, opportunity_id, section_id, requirement_text, mandatory_flag, response, evidence, owner, status)
* **BoQItem**(id, opportunity_id, line_no, category, description, qty, unit, oem, sku, unit_cost, markup, unit_price, extensions)
* **VendorQuote**(id, opportunity_id, vendor, quote_no, validity, lead_time, currency, files)
* **PricingPack**(id, opportunity_id, version, base_cost, overheads, contingency, fx_rate, margins, total_price, approvals[])
* **Approval**(id, pack_id, type[legal/finance/executive], approver_id, status, signed_on, remarks)
* **Submission**(id, opportunity_id, method[portal/email/hand], timestamp, receipt_ref, files)
* **Outcome**(id, opportunity_id, status[won/lost/withdrawn/cancelled], date, winner, award_value, notes, reason_codes[])
* **Competitor**(id, name, legal_entity, activities[], historical_awards[])
* **Attachment**(id, entity_type, entity_id, filename, size, version, hash, storage_path)
* **User**(id, name, role, team, email, aad_oid)
* **AuditLog**(id, actor_id, action, entity, before, after, timestamp, ip)

### Master Data & Taxonomy

* Sectors, OEMs, Technologies, Reason Codes (loss), Risk Categories, Business Activities (for competitor profiling).

---

## 5) External Data Ingestion (Bid Results & Competitors)

**Sources**: Target tender portals and public award notices (nationals/sectoral).

**Approach**

* Prefer official APIs or bulk open data where available.
* Else controlled **headless browser collectors** (Playwright) with: robots.txt and ToS checks, back‑off, daytime windows, and IP allow‑listing as required.
* Normalization layer converts scraped pages/PDFs into structured events: `{portal, tender_ref, buyer, title, close_date, award_date, winner(s), award_value, business_activity_codes, notes, files}`.
* **Entity Resolution**: Fuzzy match winners to **Competitor** entities; link by tax id when public.
* **Storage**: Raw HTML/PDF to Blob Storage; parsed JSON to **staging schema**; curated tables for analytics.

**Governance**

* Daily runbook, monitoring, and legal/ethical checklist per source. All collectors are switchable per source policy.

---

## 6) Architecture

**Frontend**: React/Vite + TypeScript, shadcn/ui, Tailwind; state via TanStack Query; rich text + file drop; Kanban and Timeline views.

**Backend**: NestJS (REST + OpenAPI); Background jobs with BullMQ; validation pipes & exception filters; file processing service.

**Data**: PostgreSQL (transactional); Redis (cache/queues); OpenSearch (full‑text in docs/clarifications); Azure Blob (files, versioning).

**AI/Docs**: OCR (Tesseract/textract pipeline), chunking, embeddings in OpenSearch; prompt‑templates library for RFP Q&A and compliance.

**Identity & Security**: Azure AD SSO (OIDC), role‑based access, record‑level sharing; Azure Key Vault; at‑rest + in‑transit encryption.

**Deployment**: Docker + Azure Container Apps (or AKS if needed); Azure App Gateway + WAF; App Insights for telemetry.

**Reporting**: Power BI over curated warehouse (Synapse Serverless or Postgres read‑replica) with semantic model.

---

## 7) Key Features (MVP → V2)

### MVP (Weeks 1‑8)

* Opportunity board (Kanban & List) with filters (client/sector/status/owner/days left/rank).
* SLA timers and escalations (email/Teams).
* Document vault with versioning & tags; submission pack builder.
* Clarifications module with numbering, exports, and response linking.
* Compliance Matrix builder (import RFP PDF → AI extracts numbered clauses → **verbatim text** column + **Our response** column).
* Price workspace (BoQ items, margins, approvals, freeze).
* Tender bond/guarantee tracker with validity alerts.
* Audit log & approvals workflow.
* Import wizard for the **Currently Working** tracker (CSV/XLSX mapping).

### V2 (Weeks 9‑16)

* External results collectors (awards; winner & value), competitor profiles.
* Lessons‑learned repository and standardized post‑mortem form.
* Executive dashboards (Power BI) and email digests.
* Scenario pricing (what‑if margins/FX).
* API for partner/OEM portals.

---

## 8) Analytics & Power BI

**Subject Areas**

* Pipeline: count & value by stage, client, sector, owner.
* Hit rate: win%, by sector/client/OEM/deal size; trend over time.
* Velocity: cycle time from discovery→submission→award.
* Pricing: margin waterfall; cost vs price variance; FX sensitivity.
* Compliance: mandatory gaps count; clarifications volume & turnaround.
* Competitors: wins by buyer/sector; average award values; co‑bid frequency.

**Model**: Star schema — Facts: `FactOpportunity`, `FactPricing`, `FactClarification`, `FactSubmission`, `FactOutcome` — Dimensions: `DimClient`, `DimDate`, `DimSector`, `DimUser`, `DimCompetitor`, `DimOEM`.

---

## 9) AI‑Assisted Workflows

* **RFP Parser**: PDF → clause extraction → sections mapped to WBS; preserve **verbatim** requirement text; generate response scaffolds; highlight mandatory items.
* **Clarification Drafting**: suggest concise questions with references.
* **Compliance Gap Heatmap**: surface red flags early; suggest mitigation tasks.
* **Bid Summary**: one‑pager for executives; risks; go/no‑go rationale.
* **Post‑Mortem Assist**: analyze outcome vs plan; update reason codes.

---

## 10) Security, Compliance & Audit

* Data residency in **Azure Qatar Central**.
* SSO with Conditional Access; MFA enforced.
* Row‑level security for sensitive commercials.
* Full audit trail, immutable logs (Azure Storage immutability policies for write‑once retention if required).
* Scraping governance: per‑source ToS review, robots.txt checks, request throttling, and graceful fallback to manual imports.

---

## 11) Migration & Seed

* **Phase 0 import**: Map tracker columns → Opportunity fields (Customer→Client; Tender Details→tender_ref; Description→title/desc; Submission Date; Status; Business Owner; Bid Owner; Tender Bond Readiness; Tender Value; Validity; Mode of Submission; Days left; Rank).
* Historical folders ingestion: One‑time import of prior proposal packs with auto‑tagging by client/ref/date.

---

## 12) Project Plan & Timeline (Indicative 16 Weeks)

**Week 1‑2 – Discovery & Design**: workshops, confirm roles, finalize state machine, data model, and UX wireframes.
**Week 3‑4 – Foundations**: AuthN/Z, project skeleton, DB schema, file storage, CI/CD, environments.
**Week 5‑6 – Core Bid Ops**: Opportunities, tasks, SLA engine, notifications, document vault.
**Week 7‑8 – Compliance & Pricing**: matrix builder, BoQ pricing, approvals, submission pack.
**Week 9‑10 – External Collectors**: one source end‑to‑end (HTML/PDF→JSON→curated tables) + governance.
**Week 11‑12 – Dashboards**: Power BI semantic model; executive pack; email digests.
**Week 13‑14 – AI Assists**: RFP parser MVP; clarification helper.
**Week 15 – UAT & Security**: penetration test, performance tuning, guardrails.
**Week 16 – Go‑Live & Handover**: training, runbooks, playbooks, backlog triage.

---

## 13) Acceptance Criteria

* 100% of active bids tracked with SLA timers; no missed submission dates in UAT period.
* Import of the current tracker with ≥ 98% field match.
* Submission pack builder generates a consistent, signed PDF set.
* Approvals audit trail complete and exportable.
* External collector populates ≥ 200 award records with winner/value for at least one portal, with ≤ 2% parsing error on numeric fields.
* Power BI dashboards refresh automatically and align with DB snapshots.

---

## 14) ROM Budget (Build & Run)

* **Build (one‑time)**: 2‑3 FTE devs + 1 PM/BA + 0.5 QA + 0.25 Sec: **12–16 weeks**.
* **Cloud (monthly, small team)**: App + DB + Storage + Search + Monitoring: **US$400–900** (varies with file volume & search index). Power BI Pro licences extra as needed.

> Final cost depends on scope lock, number of collectors, and AI workloads.

---

## 15) Risks & Mitigations

* **Portal policy changes** → Modular collectors; switch to manual import or partner APIs.
* **Deadline overload** → SLA engine + exec digests + red/amber dashboards.
* **Data quality** → Staging schema with validations; human‑in‑the‑loop curation.
* **Security drift** → IaC + baseline policies; quarterly reviews; key rotation.

---

## 16) Product Backlog (Epics → Representative Stories)

1. **Auth & Admin**: SSO; teams/roles; master data; audit log viewer.
2. **Opportunities**: create/edit; Kanban; filters; timeline; rank; bulk import.
3. **SLA & Notifications**: timers; escalations; calendar holds; digest emails.
4. **Docs & Pack Builder**: vault; templates; watermarking; zipping; checksum.
5. **Compliance Matrix**: PDF import; verbatim clause capture; response; status heatmap; export.
6. **Pricing**: BoQ items; vendor quotes; margin guardrails; approval chain; freeze.
7. **Clarifications**: numbering; submission; response linking; exports.
8. **Submission**: method logging; receipts; post‑submission Q&A tracker.
9. **Outcomes**: result entry; reasons; competitor link; lessons learned.
10. **Collectors**: award parsing; entity resolution; curation UI.
11. **Analytics**: semantic model; standard dashboards; KPI goals; email digests.
12. **AI Assist**: RFP parser; clarification draft; post‑mortem assist.

---

## 17) Tech Stack (Proposed)

* **FE**: React/Vite, TypeScript, Tailwind, shadcn/ui, Recharts; MSAL for AAD login.
* **BE**: NestJS, TypeORM, PostgreSQL, Redis, BullMQ, OpenAPI; file service; PDF service.
* **Search/OCR**: OpenSearch; Tesseract + textract; optional Azure Form Recognizer.
* **Infra**: Azure Container Apps, Blob, App Gateway + WAF, App Insights, Key Vault, Bicep/Terraform IaC.
* **BI**: Power BI (import or DirectQuery to curated schema).

---

## 18) Next Steps

1. **Confirm** role taxonomy, approval gates, and loss reason codes.
2. **Send** 5–10 representative RFPs/BOQs to tune the parser and compliance templates.
3. **Prioritize** 1–2 award sources for the first collector (lowest friction, highest signal).
4. **Approve** MVP scope and 16‑week plan; lock the Definition of Done.
5. **Green‑light** environment setup in Azure Qatar Central and connect to AAD.

> Once approved, we’ll create a milestone plan and seed the system by importing the **example/Currently Working - October- 2025 - Live Updates.xlsx** tracker so day‑one value is visible to the exec team.

