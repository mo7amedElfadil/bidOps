* Repository: Monorepo with pnpm and Turbo. Workspaces for `web`, `api`, `workers`, `collectors`, `packages/*` (schema, ui, adapters, parsing tools).
* State machine: Opportunity stage transitions with gates and timers. All transitions audited.
  * Stages: Sourcing → Qualification → Purchase → Elaboration → Pricing & Approvals → Submission → Evaluation → Outcome → Closeout.
  * Automations: SLA timers on submission/clarifications/bond/price-freeze; email/Teams escalations when due/overdue.
* Pricing patterns: BoQ and pricing pack worksheet support custom columns and Excel-style formulas; templates can be global or opportunity-scoped; FX rates stored centrally (base QAR) for live conversion.
* Ingestion pattern: `SourceAdapter` interface per portal. Headless browser with throttling. PDF and HTML saved to Blob. Normalizer outputs a unified `AwardEvent` shape. Fuzzy entity resolution links winners to Competitor records.
* Tender smart filter: semantic embeddings (pgvector) compare tenders to `TenderActivity` profiles, writing `TenderClassification` per `MinistryTender`; reprocess increments a classification version for audit.
* Documents: Blob storage with content hash and version. Submission pack builder composes signed ZIP and PDFs.
* Search: OpenSearch for full text across docs, clarifications, and requirements. Postgres for transactions. Redis for queues and cache. Append-only AuditLog.
* Config: Environment and source configs are signed and versioned. Feature flags for collectors.
