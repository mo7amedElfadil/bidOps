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
  buyer: string
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
| Monaqasat | `monaqasat` | 🚧 In progress | Qatar MoF Monaqasat (public awards only) |
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

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `COLLECTOR_MODE` | `once` | `once` or `scheduled` |
| `COLLECTOR_INTERVAL_MINUTES` | `60` | Minutes between scheduled runs |
| `COLLECTOR_ONLY` | (empty) | Run only specific adapter |
| `COLLECTOR_SAMPLE_ENABLED` | `true` | Enable sample adapter |
| `COLLECTOR_MONAQASAT_ENABLED` | `false` | Enable Monaqasat adapter |
| `COLLECTOR_QATAR_GOV_ENABLED` | `false` | Enable Qatar Gov adapter |
| `COLLECTOR_RATE_LIMIT_MS` | `1000` | Delay between requests |
| `QATAR_GOV_PORTAL_URL` | `https://portal.gov.qa` | Base portal URL |
| `QATAR_GOV_AWARDS_PATH` | `/en/awards` | Awards listing path |
| `QATAR_GOV_DELAY_MS` | `800` | Per-row delay for Qatar Gov |
| `MONAQASAT_PORTAL_URL` | `https://monaqasat.mof.gov.qa` | Base portal URL |
| `MONAQASAT_AWARDED_PATH` | `/TendersOnlineServices/AwardedTenders/1` | Awarded tenders path |
| `MONAQASAT_DELAY_MS` | `800` | Per-row delay for Monaqasat |

## API Endpoints

### Staging

| Method | Path | Description |
|--------|------|-------------|
| GET | `/awards/staging` | List staging records |
| POST | `/awards/staging` | Create staging record |
| POST | `/awards/staging/:id/curate` | Promote to curated event |

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

## Normalization Shape

```json
{
  "portal": "qatar-gov",
  "tenderRef": "QG-2024-001",
  "buyer": "Ministry of Technology",
  "title": "IT Infrastructure Project",
  "awardDate": "2024-01-15",
  "winners": ["TechCorp Solutions LLC"],
  "awardValue": 1250000,
  "currency": "QAR",
  "codes": ["IT-001", "INFRA-002"],
  "sourceUrl": "https://portal.gov.qa/award/001"
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
