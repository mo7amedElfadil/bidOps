# Context

## 1. Project summary

**Name:** ITSQ BidOps
**Purpose:** A Jira-style platform to manage the full tender lifecycle at ITSQ from discovery and purchase to submission, evaluation, and outcome, then analyze performance and market signals from public award data.

## 2. Background and problem statement

* Current tracking uses spreadsheets and scattered folders. This increases the chance of missed deadlines, inconsistent approvals, and weak institutional memory.
* External award results exist on public portals but are not consolidated. This limits competitor insight and pricing strategy.
* Executives need a single view of pipeline, hit rate, cycle time, and risks.

## 3. Business objectives

* Eliminate missed submission dates with SLA timers and escalations.
* Centralize RFP documents, clarifications, compliance, pricing, and approvals with full audit.
* Build a clean, queryable dataset for analytics and Power BI dashboards.
* Enrich internal records with public award results: winner, award value, and business activity codes.
* Reduce cycle time from discovery to submission and increase bid win rate.

## 4. In scope (v1)

* Web app with Kanban, timeline, and list views of opportunities.
* Compliance Matrix builder that preserves verbatim requirement text and supports export.
* Pricing workspace with BoQ, vendor quotes, margin guardrails, and approvals.
* Submission pack builder and immutable audit of approvals and changes.
* First external award collector with staging and curation.
* Power BI model over curated tables for executives.

## 5. Out of scope (v1)

* Post-award project delivery, invoicing, or procurement payments.
* Full CRM or contract lifecycle management.
* Complex workflow for supplier onboarding beyond attaching vendor quotes.

## 6. Stakeholders and users

* **Executive:** Portfolio dashboards, final sign-off.
* **Bid Manager:** Owns opportunities, plans schedules, manages gates.
* **Solution Lead/Architect:** Owns technical solution and compliance.
* **Commercial/Finance:** Costing, margins, approvals, tender bonds.
* **Legal/Contracts:** T&Cs, deviations, compliance statements.
* **Sourcing/Vendor:** OEM quotes and certifications.
* **Contributors:** Section authors, graphics, QA.
* **Analyst:** Curates competitor data and lessons learned.
* **Admin:** Tenant settings, taxonomies, templates.

## 7. Key definitions

* **Opportunity:** A tender being pursued with stage, dates, owners, and SLA state.
* **Tender Pack:** Purchased documents and artifacts tied to an opportunity.
* **Compliance Matrix:** Verbatim requirement text with our response, status, and evidence.
* **BoQ Item:** Line with quantity, unit cost, markup, and unit price.
* **Pricing Pack:** Versioned total price build with approvals.
* **Submission Pack:** Final set of signed files delivered to the buyer.
* **Outcome:** Won, Lost, Withdrawn, or Cancelled with reason codes.
* **Award Event:** Parsed public record containing winner and award value.
* **Competitor:** Resolved organization entity linked to award events.
* **SLA:** Timers and escalations tied to submission and other gates.

## 8. Data sources

* **Internal:** Spreadsheets such as “Currently Working – October 2025,” emails, proposal folders.
* **External:** Public tender portals and bulletins that publish award results. Prefer APIs when available. Headless collectors with ToS and robots checks when APIs do not exist.

## 9. Constraints and assumptions

* **Residency:** Host in Azure Qatar Central. At-rest and in-transit encryption.
* **Identity:** Azure AD SSO with MFA and Conditional Access.
* **Security:** Row-level security for commercial data. Immutable logs for audit.
* **Compliance:** Follow each portal’s ToS and robots.txt. Throttle and schedule collectors.
* **Time zone:** Asia/Qatar is the default for SLAs and reporting.
* **Assumptions:** Power BI licensing available. AAD tenant access granted. Azure subscription ready.

## 10. Technical context

* **Frontend:** React + Vite, TypeScript, Tailwind, shadcn/ui, TanStack Query.
* **Backend:** NestJS, PostgreSQL, Redis, BullMQ, OpenAPI.
* **Search and OCR:** OpenSearch for full text. Tesseract and textract for OCR and parsing. Azure Form Recognizer optional.
* **Files:** Azure Blob Storage with versioning and content hashes.
* **Analytics:** Power BI over curated tables. Optional Postgres read replica or Synapse Serverless.
* **Deployment:** Docker to Azure Container Apps or AKS. App Gateway with WAF. App Insights.

## 11. Success metrics

* 100% on-time submissions during UAT and after go-live.
* ≥ 98% field mapping accuracy when importing the current tracker.
* External collector ingests at least 200 award records with less than 2% numeric parse error after curation.
* Reduction in median cycle time from discovery to submission.
* Win rate improvement tracked quarterly.

## 12. Risks and mitigations

* **Portal policy changes:** Modular adapters, quick disable, and manual import fallback.
* **Parser accuracy on PDFs:** Sampling, QA queue, and human-in-the-loop corrections.
* **Sensitive commercials:** Row-level security, least privilege, audit, and periodic review.
* **Deadline overload:** SLA engine, exec digests, and red/amber dashboards.

## 13. Dependencies and integrations

* Azure AD, Azure Blob, Azure Key Vault, App Insights.
* Email and Teams for notifications.
* Power BI for dashboards.

## 14. Phasing and timeline summary

* **M0 Foundations:** Repo, CI, Docker, schema, auth, file storage.
* **M1 Core BidOps:** Opportunities, SLA engine, document vault.
* **M2 Compliance and Pricing:** Matrix builder, BoQ pricing, approvals, submission pack.
* **M3 External Collector:** First award source end to end.
* **M4 Analytics:** Power BI model and executive dashboards.

## 15. Governance and decision making

* Approval chain: Legal to Finance to Executive. Electronic signatures stored with audit.
* Weekly steering with Bid Manager and tech lead. Risks tracked and reviewed.

## 16. Change management and training

* Short videos and playbooks for Opportunity creation, Compliance Matrix, Pricing and Approvals, and Submission Pack.
* UAT with real tenders before go-live. Runbooks for on-call and support.

## 17. Open questions

* Which public portal is the first target for award ingestion?
* Preferred ORM: Prisma or TypeORM?
* Do we require bilingual artifacts in v1 (English and Arabic)?
* What is the policy for data retention and purge on lost opportunities?
