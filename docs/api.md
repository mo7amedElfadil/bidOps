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
POST /auth/register     # Request account (email, password, name)
POST /auth/login        # Login (email, password) → { access_token }
POST /auth/dev-login    # Quick dev login (email, name?, role?, tenantId?) → { access_token }
POST /auth/invite       # Admin invite user (email, name, role, businessRoleIds)
POST /auth/accept-invite # Accept invite + set password
POST /auth/forgot-password # Request reset link
POST /auth/reset-password  # Reset password
POST /auth/change-password # Change password (auth)
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
| GET | `/opportunities` | List opportunities (filters: clientId, status, stage, maxDaysLeft, minRank, page, pageSize) | All |
| GET | `/opportunities/:id` | Get single opportunity | All |
| POST | `/opportunities` | Create opportunity (use `clientId` or `clientName`) | MANAGER, ADMIN |
| PATCH | `/opportunities/:id` | Update opportunity | MANAGER, ADMIN |
| PATCH | `/opportunities/:id/bid-owners` | Replace bid owners (userIds[]) | MANAGER, ADMIN |
| GET | `/opportunities/:id/checklist` | Get submission checklist | All |
| PATCH | `/opportunities/:id/checklist` | Update submission checklist | MANAGER, ADMIN, CONTRIBUTOR |
| DELETE | `/opportunities/:id` | Delete opportunity | ADMIN |

### Clients
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/clients` | List clients (page, pageSize) | All |
| POST | `/clients` | Create client | MANAGER, ADMIN |

### Import
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| POST | `/import/tracker` | Import tracker CSV (multipart) | MANAGER, ADMIN |
| GET | `/import/templates/tracker.csv` | Download template CSV | All |
| GET | `/import/issues` | List tracker import issues (query: opportunityId, resolved) | All |
| PATCH | `/import/issues/:id/resolve` | Resolve an import issue | MANAGER, ADMIN, CONTRIBUTOR |

### Settings
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/settings/sla` | Get SLA thresholds | All |
| PUT | `/settings/sla` | Update SLA thresholds | MANAGER, ADMIN |
| GET | `/settings/holidays` | Get holiday calendar | All |
| PUT | `/settings/holidays` | Update holiday calendar | MANAGER, ADMIN |
| GET | `/settings/retention` | Get retention policy | All |
| PUT | `/settings/retention` | Update retention policy | ADMIN |
| GET | `/settings/timezone` | Get timezone offset | All |
| PUT | `/settings/timezone` | Update timezone offset | ADMIN |
| GET | `/settings/import-date-format` | Get tracker import date format (MDY/DMY/AUTO) | All |
| PUT | `/settings/import-date-format` | Update tracker import date format | ADMIN |

### Attachments
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/attachments` | List attachments (query: entityType, entityId, page, pageSize) | All |
| POST | `/attachments` | Upload attachment (multipart file) | MANAGER, ADMIN, CONTRIBUTOR |
| GET | `/attachments/:id/download` | Download attachment | All |

### Search
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/search` | Search documents (query: q) | All |

### Compliance
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/compliance/:opportunityId` | List compliance clauses | All |
| POST | `/compliance/:opportunityId/import` | Import PDF (multipart) | MANAGER, ADMIN |
| POST | `/compliance/:opportunityId/import.csv` | Import CSV (export schema) | MANAGER, ADMIN |
| PATCH | `/compliance/:id` | Update clause | MANAGER, ADMIN, CONTRIBUTOR |
| GET | `/compliance/:opportunityId/export.csv` | Export as CSV | All |

### Clarifications
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/clarifications/:opportunityId` | List clarifications | All |
| POST | `/clarifications/:opportunityId` | Create clarification | MANAGER, ADMIN, CONTRIBUTOR |
| POST | `/clarifications/:opportunityId/import.csv` | Import CSV (export schema) | MANAGER, ADMIN, CONTRIBUTOR |
| PATCH | `/clarifications/item/:id` | Update clarification | MANAGER, ADMIN, CONTRIBUTOR |
| GET | `/clarifications/:opportunityId/export.csv` | Export as CSV | All |

### Pricing
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/pricing/:opportunityId/boq` | List BoQ items | All |
| POST | `/pricing/:opportunityId/boq` | Create BoQ item | MANAGER, ADMIN, CONTRIBUTOR |
| PATCH | `/pricing/boq/:id` | Update BoQ item | MANAGER, ADMIN, CONTRIBUTOR |
| DELETE | `/pricing/boq/:id` | Delete BoQ item | MANAGER, ADMIN |
| GET | `/pricing/:opportunityId/pack-rows` | List pricing pack rows | All |
| POST | `/pricing/:opportunityId/pack-rows` | Create pricing pack row | MANAGER, ADMIN, CONTRIBUTOR |
| PATCH | `/pricing/pack-rows/:id` | Update pricing pack row | MANAGER, ADMIN, CONTRIBUTOR |
| DELETE | `/pricing/pack-rows/:id` | Delete pricing pack row | MANAGER, ADMIN |
| GET | `/pricing/:opportunityId/quotes` | List vendor quotes | All |
| POST | `/pricing/:opportunityId/quotes` | Create vendor quote | MANAGER, ADMIN, CONTRIBUTOR |
| PATCH | `/pricing/quotes/:id` | Update vendor quote | MANAGER, ADMIN, CONTRIBUTOR |
| POST | `/pricing/:opportunityId/pack/recalculate` | Recalculate pricing pack | MANAGER, ADMIN |
| GET | `/pricing/templates` | List pricing templates (query: workspace, opportunityId) | All |
| POST | `/pricing/templates` | Create pricing template | MANAGER, ADMIN |
| PATCH | `/pricing/templates/:id` | Update pricing template | MANAGER, ADMIN |
| DELETE | `/pricing/templates/:id` | Delete pricing template | MANAGER, ADMIN |

### Approvals
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/approvals/:packId` | List approvals for pack | All |
| POST | `/approvals/:packId/bootstrap` | Create approval chain | MANAGER, ADMIN |
| POST | `/approvals/request` | Request Go/No-Go approval from tender | MANAGER, ADMIN |
| POST | `/approvals/reject` | Reject Go/No-Go approval from tender | MANAGER, ADMIN |
| POST | `/approvals/decision/:id` | Submit approval decision (supports CHANGES_REQUESTED/RESUBMITTED) | All |
| GET | `/approvals/review` | List pricing packs and approvals pending review (query: `scope=mine|all`) | All |
| POST | `/approvals/:packId/finalize` | Finalize approvals and move opportunity to submission | MANAGER, ADMIN |

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
| GET | `/awards/staging` | List staging records (optional: fromDate, toDate) | All |
| POST | `/awards/staging` | Create staging record | MANAGER, ADMIN |
| PATCH | `/awards/staging/:id` | Update staging record | MANAGER, ADMIN |
| DELETE | `/awards/staging/:id` | Delete staging record | MANAGER, ADMIN |
| POST | `/awards/staging/:id/curate` | Curate staging record | MANAGER, ADMIN |
| GET | `/awards/events` | List curated award events | All |
| PATCH | `/awards/events/:id` | Update curated event | MANAGER, ADMIN |
| DELETE | `/awards/events/:id` | Delete curated event | MANAGER, ADMIN |
| POST | `/awards/collect` | Trigger collector run with optional date range | MANAGER, ADMIN |

### Available Ministry Tenders
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/tenders` | List available tenders (optional: fromDate, toDate) | All |
| GET | `/tenders/:id` | Get tender | All |
| POST | `/tenders` | Create tender | MANAGER, ADMIN |
| PATCH | `/tenders/:id` | Update tender | MANAGER, ADMIN |
| DELETE | `/tenders/:id` | Delete tender | ADMIN |
| POST | `/tenders/:id/promote` | Promote tender to opportunity | MANAGER, ADMIN |
| POST | `/tenders/collect` | Trigger available tenders collector | MANAGER, ADMIN |

### Users
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/users` | List users (page, pageSize, q) | ADMIN, MANAGER |
| GET | `/users/:id` | Get user | ADMIN |
| POST | `/users` | Create user (name, email optional; defaults to `firstName@it-serve.qa`) | ADMIN, MANAGER |
| PATCH | `/users/:id` | Update user (email, role, team, `userType`) | ADMIN |
| PATCH | `/users/:id/business-roles` | Replace user business roles | ADMIN |
| DELETE | `/users/:id` | Disable user | ADMIN |

### Business Roles
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/business-roles` | List business roles | MANAGER, ADMIN |
| POST | `/business-roles` | Create business role | ADMIN |
| PATCH | `/business-roles/:id` | Update business role | ADMIN |
| DELETE | `/business-roles/:id` | Delete business role | ADMIN |

### Notifications
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/notifications` | List in-app notifications (status=unread optional) | All |
| PATCH | `/notifications/:id/read` | Mark notification read | All |
| POST | `/notifications/read-all` | Mark all notifications read | All |
| GET | `/notifications/preferences` | List user notification preferences | All |
| PATCH | `/notifications/preferences` | Update user notification preferences | All |
| GET | `/notifications/defaults` | List notification routing defaults | ADMIN |
| PATCH | `/notifications/defaults` | Update notification routing defaults | ADMIN |

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
| GET | `/settings/timezone` | Get timezone offset hours | All |
| PUT | `/settings/timezone` | Update timezone offset hours | ADMIN |
| GET | `/settings/fx-rates` | List FX rates (base QAR) | All |
| POST | `/settings/fx-rates` | Upsert FX rate | ADMIN |
| PATCH | `/settings/fx-rates/:id` | Update FX rate | ADMIN |
| DELETE | `/settings/fx-rates/:id` | Delete FX rate | ADMIN |
| GET | `/settings/opportunity/stages` | Get opportunity stage dropdown | All |
| PUT | `/settings/opportunity/stages` | Update opportunity stage dropdown (array) | ADMIN, MANAGER |
| GET | `/settings/opportunity/statuses` | Get opportunity status dropdown | All |
| PUT | `/settings/opportunity/statuses` | Update opportunity status dropdown (array) | ADMIN, MANAGER |

### AI Extraction
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| POST | `/ai/extract` | Run AI extraction on selected attachments (prompt + outputs) | MANAGER, ADMIN, CONTRIBUTOR |

### Proposal Drafts
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/proposal/:opportunityId` | List proposal draft sections | All |
| GET | `/proposal/:opportunityId/export.csv` | Export proposal sections as CSV | All |

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

Paginated list endpoints return:
```json
{ "items": [], "total": 0, "page": 1, "pageSize": 25 }
```
### Change Requests
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/change-requests` | List change requests (query: opportunityId, status) | All |
| POST | `/change-requests` | Create change request | MANAGER, ADMIN, CONTRIBUTOR |
| PATCH | `/change-requests/:id` | Update change request status/impact | MANAGER, ADMIN |
