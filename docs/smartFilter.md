# Smart Filter (Available Tenders)

Purpose: classify Monaqasat tenders by ITSQ/IoT relevance, keep every raw tender, and power the filter buckets in the available tenders UI.

## Goals

- Keep all tenders (no silent drops) while surfacing the most relevant ones.
- Provide explainable matches (score + reasons) to build trust.
- Allow reprocessing when activities or thresholds change.
- Keep manual decisions (promote, Go/No-Go) separate from classification.

## Non-goals

- Replace the Go/No-Go workflow or approvals.
- Hide/delete tenders based on automation alone.
- Ship a black-box ML ranking without explanations.

## Data model (aligns with current schema)

Existing:

- `MinistryTender` (raw tender from collectors)
  - `portal`, `tenderRef`, `title`, `titleOriginal`, `ministry`, `publishDate`, `closeDate`, `embedding`
  - `requestedSectorType`, `tenderBondValue`, `documentsValue`, `tenderType`
  - `purchaseUrl`, `sourceUrl`, `status`, `createdAt`, `updatedAt`, `tenantId`

Add:

- `TenderActivity` (admin config)
  - `id`, `name`, `description`, `scope` (ITSQ | IOT_SHABAKA | OTHER)
  - `keywords[]`, `negativeKeywords[]`, `weight`, `isHighPriority`, `isActive`, `embedding`
  - `tenantId`, `updatedAt`
- `TenderClassification` (computed, recomputable)
  - `id`, `tenderId`, `classificationVersion`, `score`, `isNew`
  - `matchedActivityIds[]`, `matchedScopes[]`, `matchedKeywords[]`
  - `reasons[]`, `updatedAt`
- `TenderClassificationRun` (audit + stats)
  - `id`, `runType` (collector | reprocess), `classificationVersion`
  - `rangeFrom`, `rangeTo`, `startedAt`, `finishedAt`, `stats`, `triggeredBy`

Config (store in `AppSetting` as JSON):

- `tenders.smartFilter.threshold` (number, default 30)
- `tenders.smartFilter.similarityThreshold` (number, default 0.35)
- `tenders.smartFilter.newWindowHours` (number, default 24)
- `tenders.smartFilter.groupScopes` (string array, default ["ITSQ", "IOT_SHABAKA"])

## Classification logic (semantic embeddings)

Input text:

- `title`, `ministry`, `requestedSectorType`, `tenderType`
- `titleOriginal` is stored for i18n, but embeddings use the English `title`

Embedding strategy:

- Use pgvector (`vector(1536)`) for tender/activity embeddings.
- Activity text = `name` + `description` + `keywords[]` (negative-only activities use `negativeKeywords[]`).
- Tender text = `title` + `ministry` + `requestedSectorType` + `tenderType`.
- Cosine similarity drives matching and scoring.

Scoring (suggested defaults):

- Each matched activity adds `round(similarity * 100 * weight)`.
- `isHighPriority` adds a fixed bonus (ex: +15).
- Negative-only activities subtract `round(similarity * 100 * weight)`.
- `TenderClassification` stores per-scope scores (`scoreItsq`, `scoreIotShabaka`, `scoreOther`) and overall `score`.

Match rule:

- `similarity >= similarityThreshold` (default 0.35).
- Reasons include activity name + similarity to keep results explainable.

## Filter buckets (UI behavior)

Filters should be independent (toggle on/off):

- `New`: `now - createdAt <= newWindowHours` AND `closeDate >= now` (if closeDate exists)
- `ITSQ`: classification includes at least one activity where `scope = ITSQ`
- `IoT`: classification includes at least one activity where `scope = IOT_SHABAKA`
- `Group`: classification includes any scope listed in `tenders.smartFilter.groupScopes`
- When a scope filter is active, the UI displays the scope-specific score; Group shows the overall score.
- `Promoted`: `MinistryTender.status = "promoted"` OR `opportunityId` exists
- `Go/No-Go`: reflect `Opportunity.goNoGoStatus` when linked
  - `PENDING`, `APPROVED`, `REJECTED` map to filters and badges

Default view:

- `New` + (`ITSQ` or `IoT`) on by default
- `Rejected` (Go/No-Go) off by default

## Workflow

Collector run:

1. Upsert `MinistryTender`
2. Generate tender embedding (if missing)
3. Ensure activity embeddings (if missing)
4. Run semantic classification against the tender
5. Store `TenderClassification` + bump run stats
6. UI consumes classification fields directly in the list

Reprocess run:

- Triggered when activities or config change
- Refresh missing embeddings + recompute classification for the last N months or full history
- Increment `classificationVersion` for traceability

Manual actions:

- Promote -> sets `MinistryTender.status = "promoted"` and creates/links an `Opportunity`
- Go/No-Go lives on the `Opportunity` and does not rewrite classification

## API surface (additions)

- `GET /tenders` filters:
  - `scope=ITSQ|IOT_SHABAKA|GROUP`, `minScore`, `isNew`, `promoted`, `goNoGoStatus`
- `GET /tenders/:id/classification`
- `GET /tenders/activities`
- `POST /tenders/activities`
- `PATCH /tenders/activities/:id`
- `POST /tenders/reprocess` (admin only)

## UI requirements

- Filter pills: New, ITSQ, IoT, Group, Promoted, Go/No-Go (Pending, Approved, Rejected)
- Badge for score + top 3 matched activities
- "Why" tooltip showing `reasons[]`
- Admin page for activities + thresholds + group scopes

## Implementation plan

Phase 1 (MVP):

- Add `TenderActivity` + `TenderClassification` models, embeddings, and API CRUD
- Run semantic classifier on collector upsert
- Add filters and classification badges in `Available Tenders`

Phase 2 (hardening):

- Add reprocess job + run history
- Add config UI backed by `AppSetting`
- Add metrics: match rate, approval rate, false positives

Phase 3 (optional):

- ML ranker using Go/No-Go outcomes as labels
- Add hybrid lexical + semantic fallback for audits if needed

## Edge cases

- Tender updated on portal: reclassify if content hash changes
- Missing close date: treat as "New" only by createdAt window
- Arabic-only titles: translate to English on ingest; keep Arabic in `titleOriginal`
- Attachments missing: classify on available fields and log a warning
