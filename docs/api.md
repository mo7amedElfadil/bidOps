# API

This document summarizes REST endpoints, auth flows, and schemas.

## Overview

- **Base URL**: `http://localhost:4000` (dev)
- **OpenAPI Docs**: `GET /docs`
- **Health Check**: `GET /health`

## Authentication

Auth provider toggle via `AUTH_PROVIDER` environment variable:

### Local Auth (Development)
```
POST /auth/register     # Create account (email, password, name, role?, tenantId?)
POST /auth/login        # Login (email, password) → { access_token }
POST /auth/dev-login    # Quick dev login (email, name?, role?, tenantId?) → { access_token }
```

### AAD OIDC Auth (Production)
```
GET /auth/login         # Initiates OIDC flow → redirects to Azure AD
GET /auth/callback      # Handles callback → redirects with token fragment
```

### JWT Claims
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "ADMIN|MANAGER|CONTRIBUTOR|VIEWER",
  "tenantId": "tenant-uuid"
}
```

## Authorization

### Roles
| Role | Description |
|------|-------------|
| ADMIN | Full access to all resources and settings |
| MANAGER | Can create/edit opportunities, manage team |
| CONTRIBUTOR | Can edit assigned opportunities |
| VIEWER | Read-only access |

### Tenant Scoping
- All queries are scoped to the user's `tenantId`
- Record-level sharing for specific entities where applicable
- Enforced at service layer and in analytics exports

## Endpoints

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |

### Opportunities
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/opportunities` | List opportunities (filters: clientId, status, stage, maxDaysLeft, minRank) | All |
| GET | `/opportunities/:id` | Get single opportunity | All |
| POST | `/opportunities` | Create opportunity | MANAGER, ADMIN |
| PATCH | `/opportunities/:id` | Update opportunity | MANAGER, ADMIN |
| DELETE | `/opportunities/:id` | Delete opportunity | ADMIN |

### Clients
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/clients` | List clients | All |
| POST | `/clients` | Create client | MANAGER, ADMIN |

### Import
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| POST | `/import/tracker` | Import tracker CSV (multipart) | MANAGER, ADMIN |
| GET | `/import/template` | Download template CSV | All |

### Attachments
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/attachments` | List attachments (query: entityType, entityId) | All |
| POST | `/attachments` | Upload attachment (multipart file) | MANAGER, ADMIN, CONTRIBUTOR |

### Search
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/search` | Search documents (query: q) | All |

### Compliance
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/compliance/:opportunityId` | List compliance clauses | All |
| POST | `/compliance/:opportunityId/import` | Import PDF (multipart) | MANAGER, ADMIN |
| PATCH | `/compliance/:id` | Update clause | MANAGER, ADMIN, CONTRIBUTOR |
| GET | `/compliance/:opportunityId/export.csv` | Export as CSV | All |

### Clarifications
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/clarifications/:opportunityId` | List clarifications | All |
| POST | `/clarifications/:opportunityId` | Create clarification | MANAGER, ADMIN, CONTRIBUTOR |
| PATCH | `/clarifications/item/:id` | Update clarification | MANAGER, ADMIN, CONTRIBUTOR |
| GET | `/clarifications/:opportunityId/export.csv` | Export as CSV | All |

### Pricing
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/pricing/:opportunityId/boq` | List BoQ items | All |
| POST | `/pricing/:opportunityId/boq` | Create BoQ item | MANAGER, ADMIN, CONTRIBUTOR |
| PATCH | `/pricing/boq/:id` | Update BoQ item | MANAGER, ADMIN, CONTRIBUTOR |
| DELETE | `/pricing/boq/:id` | Delete BoQ item | MANAGER, ADMIN |
| GET | `/pricing/:opportunityId/quotes` | List vendor quotes | All |
| POST | `/pricing/:opportunityId/quotes` | Create vendor quote | MANAGER, ADMIN, CONTRIBUTOR |
| PATCH | `/pricing/quotes/:id` | Update vendor quote | MANAGER, ADMIN, CONTRIBUTOR |
| POST | `/pricing/:opportunityId/pack/recalculate` | Recalculate pricing pack | MANAGER, ADMIN |

### Approvals
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/approvals/:packId` | List approvals for pack | All |
| POST | `/approvals/:packId/bootstrap` | Create approval chain | MANAGER, ADMIN |
| POST | `/approvals/decision/:id` | Submit approval decision | All |

### Submission
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| POST | `/submission/:opportunityId/build` | Build submission pack | MANAGER, ADMIN |

### Outcomes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/outcomes/:opportunityId` | Get outcome | All |
| POST | `/outcomes/:opportunityId` | Set/update outcome | MANAGER, ADMIN |

### Awards (External Data)
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/awards/staging` | List staging records | All |
| POST | `/awards/staging` | Create staging record | MANAGER, ADMIN |
| POST | `/awards/staging/:id/curate` | Curate staging record | MANAGER, ADMIN |
| GET | `/awards/events` | List curated award events | All |
| POST | `/awards/collect` | Trigger collector run with optional date range | MANAGER, ADMIN |

### Analytics
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/analytics/export/awards.csv` | Export awards CSV | All |
| GET | `/analytics/export/opportunities.csv` | Export opportunities CSV | All |

### Settings
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/settings/sla` | Get SLA thresholds | All |
| PUT | `/settings/sla` | Update SLA thresholds | MANAGER, ADMIN |
| GET | `/settings/holidays` | Get SLA holiday calendar dates | All |
| PUT | `/settings/holidays` | Update SLA holiday calendar dates | MANAGER, ADMIN |
| GET | `/settings/retention` | Get retention policy (years) | All |
| PUT | `/settings/retention` | Update retention policy (years) | ADMIN |

## Security

### Rate Limiting
- Configured via `@nestjs/throttler`
- Default: 100 requests per 60 seconds per IP
- Configurable via `RATE_LIMIT_TTL` and `RATE_LIMIT_LIMIT` env vars

### Security Headers
- Helmet middleware enabled for security headers
- CORS configured via `WEB_ORIGIN` env var

### Data Protection
- Asia/Qatar is the default timezone for SLAs and reporting
- Row-level security (RLS) for sensitive commercials
- Tenant scoping on all queries
- Audit logging for key mutations

## Error Model

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

## Pagination

List endpoints support optional pagination:
- `limit`: Number of records (default varies by endpoint)
- `offset`: Skip records
