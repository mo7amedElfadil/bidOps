# Task 1: Harden Monaqasat Collectors

## Context
`docs/ingest.md` already frames the collector architecture, but the implementation still needs polishing so it matches the “date-range-anchored pagination, English locale, deduped outputs, Power BI-friendly CSV” promise in `docs/checklist.md`.

## Goals
1. Allow API-triggered runs (`POST /awards/collect`, `/tenders/collect`) to accept `fromDate`/`toDate` and stop paging once the oldest entry is before `fromDate`.
2. Force Monaqasat responses to English via headers/cookies and, when Arabic titles slip through, translate them while storing the original for future bilingual needs.
3. Deduplicate by `(portal + tenderRef)` (or `sourceUrl` fallback), upsert buyer/client data, and capture the resulting records so the CSV exports contain clean data for Power BI ingestion.
4. Document the runtime behavior and new CSV schema in `docs/ingest.md` (including any collector env vars or job parameters).

## Steps
1. Start by reviewing `apps/collectors/src/adapters/monaqasat.ts` and `apps/collectors/src/tenders/monaqasat-available.ts` to confirm how `fromDate`/`toDate` are currently applied. Add instrumentation to record which page produced the boundary date so the loop knows when to stop.
2. Confirm headers/cookies for English locale, then add translation logic for the handful of cases where the portal still returns Arabic (store the original field in `titleOriginal` or a new column).
3. Update the collector pipeline (maybe `apps/collectors/src/index.ts` or the queue job) to dedupe incoming rows per-run and to remove older duplicates in the staging table; ensure the final curated rows feed the CSV export controller in `apps/api/src/modules/awards` (or a new export endpoint for tenders).
4. Emit a standardized CSV (fields: `source`, `tenderRef`, `title`, `titleOriginal`, `client`, `closeDate`, `awardDate`, `value`, `currency`, `status`, `portal`, `sourceUrl`). Update `docs/ingest.md` with the column list and how `fromDate/toDate` influence the run.
5. Add automated tests or logs verifying that a request with `fromDate` only visits relevant pages, and mention this behavior (and the CSV contract) in `docs/checklist.md` so we know it’s handled.
