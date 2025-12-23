# Ops

How to build, run, and operate the stack.

## Quick Start

```bash
# Clone and setup
git clone <repo> && cd bidOps
make bootstrap

# Copy environment files
cp apps/api/example.env apps/api/.env
cp apps/collectors/example.env apps/collectors/.env
cp .env.example .env

# Start infrastructure and apps
make up

# Open in browser
# Web: http://localhost:8080
# API Docs: http://localhost:4000/docs
# Grafana: http://localhost:3000 (admin/bidops)
# Mailhog: http://localhost:8025
```

## Makefile Targets

### Infrastructure
| Target | Description |
|--------|-------------|
| `make bootstrap` | Install toolchains, pnpm, pre-commit hooks |
| `make up` | Start all services (Docker Compose) |
| `make up-monitoring` | Start monitoring stack (Grafana/Prometheus/OTEL/Dashboards) |
| `make down` | Stop all services |
| `make logs` | Tail logs from all services |
| `make logs-backend` | Tail API and workers logs |
| `make logs-frontend` | Tail web logs |
| `make logs-monitoring` | Tail Prometheus and Grafana logs |

### Development
| Target | Description |
|--------|-------------|
| `make api-dev` | Run API in dev mode (hot reload) |
| `make web-dev` | Run web in dev mode (hot reload) |
| `make workers-dev` | Run workers in dev mode |
| `make lint` | Run linting |
| `make test` | Run tests |
| `make build` | Build all packages |

### Database
| Target | Description |
|--------|-------------|
| `make db-migrate` | Run Prisma migrations |
| `make db-seed` | Seed database with sample data (admin@example.com) |
| `make db-reset` | Reset database (drop and recreate) |

### Build & Deploy
| Target | Description |
|--------|-------------|
| `make rebuild` | Rebuild containers (uses cache) |
| `make rebuild-nc` | Rebuild containers (no cache) |
| `make rebuild SERVICES="api web"` | Rebuild specific services |

### Features
| Target | Description |
|--------|-------------|
| `make sla-tick` | Run SLA engine tick manually |
| `make import-sample` | Import sample tracker CSV |
| `make collectors-run` | Run award collectors |
| `make pack-sample` | Generate sample submission pack |
| `make parse-rfp` | Parse sample RFP to compliance matrix |
| `make pbi-export` | Export data for Power BI |

## Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | 5432 | PostgreSQL database |
| `redis` | 6379 | Redis for queues and cache |
| `opensearch` | 9200 | OpenSearch for full-text search |
| `dashboards` | 5601 | OpenSearch Dashboards |
| `mailhog` | 1025, 8025 | Dev email server (SMTP: 1025, UI: 8025) |
| `prometheus` | 9090 | Metrics collection |
| `grafana` | 3000 | Dashboards and visualization |
| `otel-collector` | 4317, 4318 | OpenTelemetry collector |
| `api` | 4000 | BidOps API |
| `web` | 8080 | BidOps Web UI |
| `collectors` | (internal) | Award collectors server (Playwright) |

### Optional Services

```bash
# Start Azurite for Azure Blob storage emulation
docker compose --profile azure-storage up -d
```

## Storage Providers

Toggle via `STORAGE_PROVIDER` environment variable:

### Local Storage (Default for Development)
- Files stored in `LOCAL_STORAGE_PATH` (default: `./data/storage`)
- No external dependencies
- Persisted via Docker volume `api_storage`

### Azure Blob Storage (Production)
- Set `STORAGE_PROVIDER=azure`
- Set `AZURE_STORAGE_CONNECTION_STRING` with your Azure credentials
- For local Azure dev, use Azurite profile

```bash
# Environment variables
STORAGE_PROVIDER=local|azure
LOCAL_STORAGE_PATH=./data/storage          # for local
AZURE_STORAGE_CONNECTION_STRING=...        # for azure
ATTACHMENTS_CONTAINER=attachments
```

## Auth Providers

Toggle via `AUTH_PROVIDER` environment variable:

### Local Auth (Development)
- Email/password authentication with argon2 hashing
- JWT token issuance
- Endpoints: `/auth/register`, `/auth/login`, `/auth/dev-login`

### Azure AD OIDC (Production)
- Set `AUTH_PROVIDER=aad`
- Configure OIDC variables:
  - `OIDC_ISSUER`
  - `OIDC_CLIENT_ID`
  - `OIDC_CLIENT_SECRET`
  - `OIDC_REDIRECT_URI`
  - `AUTH_SUCCESS_REDIRECT`
  - `WEB_ORIGIN`

## Observability

### Grafana Dashboards

Access Grafana at http://localhost:3000 (admin/bidops)

Pre-configured dashboards:
- **BidOps Overview**: Key metrics and counts
  - API Response Time (p95)
  - API Request Rate
  - Total Opportunities
  - Awards Pending Curation
  - Curated Awards
  - Opportunities by Stage
  - Outcomes by Status

### Prometheus Metrics

Access Prometheus at http://localhost:9090

Scraped targets:
- `bidops-api:4000/metrics` - API metrics
- `prometheus:9090` - Self-monitoring
- `opensearch:9200` - OpenSearch health

### SLOs (Service Level Objectives)

| Metric | Target |
|--------|--------|
| API p95 latency | < 300ms |
| SLA engine tick | ≤ 60s |
| Queue lag | < 30s |
| Parser throughput | ≥ 40 pages/min |
| Collector parse error | ≤ 2% |

## Troubleshooting

### Port Conflicts

**API port 4000 in use:**
```bash
# Find and kill the process
lsof -i :4000
kill -9 <PID>
make up
```

**Web calling wrong API port:**
```bash
# Set correct API URL and rebuild
echo "WEB_API_URL=http://localhost:4000" >> .env
make rebuild-nc SERVICES="web"
```

## UAT Checklist (quick)
- Auth: dev-login, role-based access on protected routes
- Opportunities: create/update, SLA badge shows days left; timeline view orders by submission date
- Attachments: upload/list, search index
- Compliance: import PDF, edit/save, export CSV
- Clarifications: add/edit/export
- Pricing: BoQ/quotes, margin guardrail enforced (min margin), pack recalculation
- Approvals: bootstrap chain, approve/reject with remarks
- Submission: build pack, manifest/checksum shown
- Outcomes: record Won/Lost/Withdrawn with reason codes
- Awards: collectors-run seeds staging; curate to events; view staging/events in web
- Analytics: export awards/opportunities CSV

### Container Issues

**View container logs:**
```bash
docker compose -f infra/compose.yml logs -f api
docker compose -f infra/compose.yml logs -f web
```

**Restart a specific service:**
```bash
docker compose -f infra/compose.yml restart api
```

**Rebuild from scratch:**
```bash
make down
docker volume prune  # Warning: removes all volumes
make up
```

### Database Issues

**Reset database:**
```bash
make db-reset
```

**Run migrations manually:**
```bash
cd apps/api
DATABASE_URL=postgresql://bidops:bidops@localhost:5432/bidops npx prisma db push
```

## Runbooks

### Deploying Updates

1. Pull latest changes
2. Run `make build` to verify
3. Run `make rebuild-nc` to rebuild containers
4. Verify with `make logs`

### Scaling Workers

Workers can be scaled horizontally. Each instance processes jobs from BullMQ queues.

### Backup Procedures

**Database backup:**
```bash
docker exec bidops-postgres pg_dump -U bidops bidops > backup.sql
```

**Restore:**
```bash
cat backup.sql | docker exec -i bidops-postgres psql -U bidops bidops
```

### Retention Policy

- Default retention: 5 years.
- Maintain external backups per policy (offsite or separate Azure subscription).
- Retention period configurable via `GET/PUT /settings/retention` (ADMIN).

### Monitoring Alerts

Configure alerts in Grafana for:
- API error rate > 1%
- API p95 > 500ms
- Queue depth > 100 jobs
- Collector failures

## Environment Variables Reference

See `apps/api/example.env` for full list of API environment variables.
See `apps/collectors/example.env` for collector-specific variables.

AI (proposal extraction):
- `AI_PROVIDER` = `openai|gemini` (default: openai)
- `OPENAI_API_KEY`, `OPENAI_MODEL` (e.g., `gpt-4o-mini`)
- `GEMINI_API_KEY`, `GEMINI_MODEL` (e.g., `gemini-1.5-flash`)
