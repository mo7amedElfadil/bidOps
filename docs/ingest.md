# Ingestion

Covers award-result collectors, portal adapters, parsing, and scheduling.

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Portal 1   │     │   Portal 2   │     │   Portal N   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────┐
│              Source Adapters (Playwright)            │
│  - SampleAdapter                                     │
│  - MonaqasatAdapter                                  │
│  - QatarGovAdapter                                   │
│  - MonaqasatAvailableAdapter                         │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│                  Staging Table                        │
│  (AwardStaging: new → curated)                       │
└──────────────────────────┬───────────────────────────┘
                           │ Curation UI
                           ▼
┌──────────────────────────────────────────────────────┐
│              Curated Events (AwardEvent)             │
│  + Entity Resolution (winner → Competitor)           │
└──────────────────────────────────────────────────────┘
```

## Adapters

### Base Interface

```typescript
interface AwardRecord {
  portal: string
  tenderRef: string
  client: string
  title: string
  awardDate: Date
  winners: string[]
  awardValue?: number
  currency?: string
  codes?: string[]
  sourceUrl?: string
}

interface SourceAdapter {
  id: string
  label: string
  portalUrl: string
  isEnabled: () => Promise<boolean>
  run: () => Promise<AwardRecord[]>
}
```

### Implemented Adapters

| Adapter | ID | Status | Description |
|---------|-----|--------|-------------|
| Sample | `sample` | ✅ Active | Demo adapter with sample data |
| Monaqasat | `monaqasat` | 🚧 In progress | Qatar MoF Monaqasat (public awards only, English locale enforced) |
| Monaqasat Available | `monaqasat_available` | 🚧 In progress | Qatar MoF Available Ministry Tenders (purchase link + close date) |
| Qatar Gov | `qatar-gov` | 🔧 Template | Qatar e-Procurement portal (template) |

### Adding New Adapters

1. Create adapter in `apps/collectors/src/adapters/`
2. Extend `BaseAdapter` class
3. Implement `run()` method with Playwright scraping
4. Register in `adapters/index.ts`
5. Add env toggle: `COLLECTOR_{ID}_ENABLED=true|false`

## Running Collectors

```bash
# One-time run (all enabled adapters)
make collectors-run

# Run specific adapter
COLLECTOR_ONLY=sample make collectors-run

# Scheduled mode (continuous)
COLLECTOR_MODE=scheduled COLLECTOR_INTERVAL_MINUTES=60 make collectors-run
```

Collector runs now enqueue jobs onto the `bidops-default` BullMQ queue. The new `workers` service listens to that queue, calls the collectors' `/run` or `/run-tenders` endpoints (`COLLECTORS_URL`), and also keeps SLA ticks + notification batches running even when the API restarts.

UI-triggered runs can call `POST /awards/collect` with `fromDate` and `toDate` (YYYY-MM-DD).
Available tenders can be fetched via `POST /tenders/collect` (adapter `monaqasat_available`), also supporting `fromDate` / `toDate` filters in the body so you can scrape only the desired window.

Awarded tenders pagination:
- Collector walks pages in order until it reaches a page whose newest award date is earlier than `fromDate` (or hits `MONAQASAT_MAX_PAGES`).
- This ensures older pages are scanned when a date range is set.

Deduplication:
- In-memory de-duplication per run (prefers `tenderRef`, falls back to `sourceUrl` or title).
- Staging cleanup per run removes older duplicates for `portal+tenderRef`.
- Inserts delete existing staging rows by `portal+tenderRef` (or `portal+sourceUrl` when `tenderRef` is missing) before creating.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `COLLECTOR_MODE` | `once` | `once` or `scheduled` |
| `COLLECTOR_INTERVAL_MINUTES` | `60` | Minutes between scheduled runs |
| `COLLECTOR_ONLY` | (empty) | Run only specific adapter |
| `COLLECTOR_SAMPLE_ENABLED` | `true` | Enable sample adapter |
| `COLLECTOR_MONAQASAT_ENABLED` | `false` | Enable Monaqasat adapter |
| `COLLECTOR_MONAQASAT_AVAILABLE_ENABLED` | `false` | Enable Monaqasat available tenders adapter |
| `COLLECTOR_QATAR_GOV_ENABLED` | `false` | Enable Qatar Gov adapter |
| `COLLECTOR_RATE_LIMIT_MS` | `1000` | Delay between requests |
| `QATAR_GOV_PORTAL_URL` | `https://portal.gov.qa` | Base portal URL |
| `QATAR_GOV_AWARDS_PATH` | `/en/awards` | Awards listing path |
| `QATAR_GOV_DELAY_MS` | `800` | Per-row delay for Qatar Gov |
| `MONAQASAT_PORTAL_URL` | `https://monaqasat.mof.gov.qa` | Base portal URL |
| `MONAQASAT_AWARDED_PATH` | `/TendersOnlineServices/AwardedTenders/1` | Awarded tenders path |
| `MONAQASAT_AVAILABLE_PATH` | `/TendersOnlineServices/AvailableMinistriesTenders/1` | Available ministry tenders path |
| `MONAQASAT_MAX_PAGES` | `10` | Max pages to scan when collecting awards |
| `MONAQASAT_TENDER_MAX_PAGES` | `10` | Max pages to scan when collecting available tenders |
| `MONAQASAT_DELAY_MS` | `800` | Per-row delay for Monaqasat |
| `COLLECTOR_TRANSLATE_TITLES` | `true` | Translate Arabic titles to English (stores original separately) |
| `COLLECTOR_TRANSLATION_PROVIDER` | `openai` | Translation provider (openai or gemini) |

## API Endpoints

### Staging

| Method | Path | Description |
|--------|------|-------------|
| GET | `/awards/staging` | List staging records |
| POST | `/awards/staging` | Create staging record |
| POST | `/awards/staging/:id/curate` | Promote to curated event |
| POST | `/tenders/collect` | Trigger available tenders collector |

### Available Ministry Tenders

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tenders` | List available tenders |
| POST | `/tenders` | Create tender record |
| PATCH | `/tenders/:id` | Update tender record |
| DELETE | `/tenders/:id` | Delete tender record |
| POST | `/tenders/:id/promote` | Promote tender to Opportunity |

### Available tender collection behavior

- The Monaqasat available-tender adapter now scans `AvailableMinistriesTenders/{page}` sequentially, matching the award collector's paging strategy. It increments the page number until it reaches the requested `fromDate` window or the configurable page cap.
- Date filtering uses `MONAQASAT_TENDER_FROM_DATE`/`MONAQASAT_TENDER_TO_DATE` (YYYY-MM-DD). The collector filters each card as it goes and stops when earlier pages fall entirely before `fromDate`, so runs stay efficient while still honoring the date window passed from the UI.
- Use `MONAQASAT_TENDER_MAX_PAGES` (default `10`) to bound how many pages are fetched per run, preventing runaway scraping while still covering the window that executives typically request.
- Monaqasat adapters force the English locale via `Accept-Language` headers, culture cookies, and an explicit `/Main/ChangeLang` call so fields are consistent even when the portal defaults to Arabic.
- When an Arabic title still appears, collectors translate it to English and store the Arabic text in `titleOriginal` for future bilingual support.

### Curated Events

| Method | Path | Description |
|--------|------|-------------|
| GET | `/awards/events` | List curated award events |

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/export/awards.csv` | Export awards as CSV |

## Data Flow

1. **Collection**: Adapter scrapes portal → returns `AwardRecord[]`
2. **Staging**: Records stored in `AwardStaging` with status `new`
3. **Curation**: Human review via UI → mark as `curated`
4. **Promotion**: `POST /awards/staging/:id/curate` → creates `AwardEvent`
5. **Analytics**: Curated events available for dashboards and exports
6. **Client sync**: Buyer/ministry names are upserted into `Client` on each collector run

## Potential Opportunities Filtering (Future)

Potential opportunities pulled from public tenders should be filtered to ITSQ-relevant projects. Add an AI/smart filtering layer to classify tenders by ITSQ professional activities before storing/showing them (manual override available).

## Normalization Shape

```json
{
  "portal": "qatar-gov",
  "tenderRef": "QG-2024-001",
  "client": "Ministry of Technology",
  "title": "IT Infrastructure Project",
  "awardDate": "2024-01-15",
  "winners": ["TechCorp Solutions LLC"],
  "awardValue": 1250000,
  "currency": "QAR",
  "codes": ["IT-001", "INFRA-002"],
  "sourceUrl": "https://portal.gov.qa/award/001"
}
```

### Available Tender Shape

```json
{
  "portal": "monaqasat",
  "tenderRef": "7144/2025",
  "title": "Supply of Drugs (ORLISTAT 120MG) HMC/TCS/8897/2025",
  "ministry": "Hamad Medical Corporation",
  "publishDate": "2025-12-22",
  "closeDate": "2026-01-12",
  "requestedSectorType": "Suppliers / Service Providers",
  "tenderBondValue": 65000,
  "documentsValue": 650,
  "tenderType": "Public Tender",
  "purchaseUrl": "https://monaqasat.mof.gov.qa/TendersOnlineServices/TenderDetails/655609"
}
```

## Governance & Compliance

### Legal/Ethical Checklist

Before enabling a new adapter:
- [ ] Review portal Terms of Service
- [ ] Check robots.txt compliance
- [ ] Verify data usage rights
- [ ] Document rate limiting requirements
- [ ] Obtain legal approval if needed

### Operational Guidelines

- **Rate Limiting**: Min 1 second between requests
- **Time Windows**: Consider daytime-only collection
- **Error Handling**: Graceful backoff on failures
- **Monitoring**: Alert on repeated failures
- **Feature Flags**: Disable adapters quickly if issues arise

### QA Sampling

- Sample 5% of staging records for manual verification
- Check for:
  - Correct value parsing (numeric parse error rate < 2%)
  - Winner name accuracy
  - Date parsing correctness
  - Duplicate detection

## Curation Workflow

1. View staging records in Admin UI
2. Review each record for accuracy (`/awards/staging`)
3. Fix any parsing errors (edit in DB/UI when available)
4. Mark as `curated` (POST `/awards/staging/:id/curate`)
5. Curated records visible at `/awards/events`
6. Entity resolution links winners to `Competitor` records
