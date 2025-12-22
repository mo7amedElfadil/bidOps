# ITSQ BidOps – Comprehensive Development Plan

**Document Purpose**: This plan serves as the single source of truth for the ITSQ BidOps platform development. It captures the complete vision, current implementation status, architecture decisions, and roadmap. This document is maintained in the Memory Bank and should be consulted at the start of every development session.

**Last Updated**: 2025-12-08  
**Status**: M0–M2 Complete, M3 External Collector In Progress

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Vision & Objectives](#project-vision--objectives)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Lifecycle Workflow & State Machine](#lifecycle-workflow--state-machine)
5. [Data Model & Schema](#data-model--schema)
6. [Architecture & Technology Stack](#architecture--technology-stack)
7. [Current Implementation Status](#current-implementation-status)
8. [Feature Roadmap](#feature-roadmap)
9. [External Data Ingestion Strategy](#external-data-ingestion-strategy)
10. [Security & Compliance](#security--compliance)
11. [Analytics & Power BI Integration](#analytics--power-bi-integration)
12. [Development Workflow](#development-workflow)
13. [Acceptance Criteria](#acceptance-criteria)
14. [Risks & Mitigations](#risks--mitigations)
15. [Next Steps & Decisions Pending](#next-steps--decisions-pending)

---

## Executive Summary

**ITSQ BidOps** is a comprehensive, Jira-style web platform designed to manage the complete bid lifecycle for ITSQ, from initial tender discovery through submission, evaluation, and outcome tracking. The platform centralizes collaboration, automates SLA monitoring and escalations, manages compliance matrices and pricing approvals, and enriches decision-making through automated ingestion of external award results to build competitor intelligence.

**Key Differentiators**:
- Zero missed deadlines through automated SLA timers and escalation workflows
- Single source of truth for all bid-related documents, clarifications, pricing, and approvals
- Automated competitor intelligence through external award data ingestion
- Executive dashboards providing real-time KPIs and analytics
- Full audit trail for compliance and governance

**Current Phase**: M0 Foundations Complete → M1 Core Features In Progress  
**Target Go-Live**: 16 weeks from project start (indicative timeline)

---

## Project Vision & Objectives

### Primary Goal

Build a production-ready, multi-tenant BidOps platform that enables ITSQ to:
1. **Manage the full bid lifecycle** from sourcing and purchase through submission and outcome
2. **Prevent missed deadlines** via SLA timers, alerts, and automated escalations
3. **Centralize collaboration** around RFPs, clarifications, compliance matrices, pricing, and approvals
4. **Build competitor intelligence** through automated ingestion of external award results
5. **Enable data-driven decisions** via executive dashboards and analytics

### Success Metrics

- **100% on-time submissions** during UAT and after go-live
- **≥ 98% field mapping accuracy** when importing the current tracker
- **≥ 200 award records ingested** for first portal with **≤ 2% numeric parse error** after curation
- **Power BI dashboards refresh automatically** and align with DB snapshots
- **Zero missed deadlines** via SLA engine and escalation workflows
- **Consistent submission packs** with manifest and checksum verification
- **Clean audit trail** of all approvals and mutations

### Scope Boundaries

**In Scope (v1)**:
- Opportunity management (Kanban, timeline, list views)
- SLA timers and escalations (email/Teams)
- Document vault with versioning and tags
- Compliance matrix builder (PDF import → clause extraction)
- Clarifications module with numbering and exports
- Pricing workspace (BoQ, vendor quotes, approvals)
- Submission pack builder (ZIP + manifest + checksum)
- Outcome recording with reason codes
- External award collectors (staging → curation → analytics)
- Power BI analytics integration
- Azure AD SSO (with local dev fallback)
- Full audit logging

**Out of Scope (v1)**:
- ERP functions (invoicing, procurement payments)
- Post-award project execution beyond closeout
- Contract management after award
- Vendor payment workflows
- Full CRM capabilities

---

## User Roles & Permissions

### Role Taxonomy

The platform implements a **Role-Based Access Control (RBAC)** model with the following roles:

1. **ADMIN**
   - Full system access
   - Tenant settings, templates, master data management
   - User management and role assignments
   - System configuration

2. **MANAGER**
   - Owns opportunity records
   - Plans workflow and assigns tasks
   - Manages clarifications and submission gates
   - Initiates pricing approvals
   - Can create and edit opportunities, BoQ items, compliance matrices

3. **CONTRIBUTOR**
   - Section authors, graphics, QA
   - Can create/edit opportunities, attachments, clarifications
   - Can update compliance responses
   - Can add BoQ items and vendor quotes
   - Cannot delete or approve pricing packs

4. **VIEWER**
   - Read-only access to opportunities, documents, compliance matrices
   - Can view dashboards and analytics
   - Cannot create or modify data

### Permission Model

- **Role-based**: Access controlled by role (ADMIN, MANAGER, CONTRIBUTOR, VIEWER)
- **Tenant-scoped**: All data queries filtered by `tenantId` from JWT
- **Record-level**: Ownership and sharing links for specific entities (future enhancement)
- **Immutable audit log**: All edits, downloads, and approvals recorded

### Teams (Future Enhancement)

Teams can be assigned to opportunities for collaboration, with team-level permissions and notifications.

---

## Lifecycle Workflow & State Machine

### High-Level Stages

The platform implements a state machine for opportunity lifecycle management:

1. **Sourcing** → Tender discovered (portal scrape/manual import)
2. **Qualification** → Go/no-go decision, strategy, team assignment, timelines
3. **Purchase** → Tender docs purchased; bond/guarantee preparation
4. **Elaboration** → RFI/clarifications, site visits, compliance matrix, solution design, vendor quotes
5. **Pricing & Approvals** → BoQ pricing, commercials, internal approval chain
6. **Submission** → Technical & commercial pack assembly, portal upload/hand-delivery logging
7. **Evaluation** → Post-submission Q&A, demos, samples, negotiations
8. **Outcome** → **Won / Lost / Withdrawn / Cancelled**
9. **Closeout** → Lessons learned documentation, repository updates, metrics refresh

### Gates & Automations

**SLA Timers**:
- **Submission Date**: Countdown to submission deadline
- **Clarification Deadline**: Time remaining to submit clarifications
- **Bond Validity**: Expiration tracking for tender bonds/guarantees
- **Price Freeze**: Deadline for final pricing approval
- **Question Window**: Time remaining for post-submission Q&A

**Escalation Rules**:
- Email/Teams notifications when due in X days (configurable thresholds: warn, alert, urgent)
- Automatic escalation to managers when overdue
- Digest emails for executives summarizing pipeline status

**Approval Gates**:
- **Legal** → **Finance** → **Executive** (sequential workflow)
- Electronic sign-off with timestamp and remarks
- Immutable audit trail of all approval decisions

**State Transitions**:
- All stage transitions are audited
- Gates prevent invalid transitions (e.g., cannot submit without approvals)
- Automated calculations (e.g., `daysLeft` recalculation on `submissionDate` changes)

---

## Data Model & Schema

### Core Entities

#### Opportunity
Central entity representing a bid opportunity.

**Fields**:
- `id` (UUID, primary key)
- `clientId` (FK to Client)
- `ownerId` (FK to User, nullable)
- `tenderRef` (string, nullable) - External tender reference
- `title` (string, required)
- `description` (text, nullable)
- `sourcePortal` (string, nullable) - Portal where tender was discovered
- `discoveryDate` (datetime, nullable)
- `submissionDate` (datetime, nullable) - **Critical for SLA calculations**
- `status` (string, nullable) - e.g., "Open", "Closed", "Cancelled"
- `stage` (string, nullable) - Current lifecycle stage
- `priorityRank` (integer, nullable) - Priority ranking (1 = highest)
- `daysLeft` (integer, nullable) - Calculated days until submission
- `modeOfSubmission` (string, nullable) - "Portal", "Email", "Hand"
- `bondRequired` (boolean, default false)
- `bondAmount` (float, nullable)
- `validityDays` (integer, nullable) - Tender validity period
- `dataOwner` (string, nullable) - Business owner name
- `tenantId` (string, default "default") - **Multi-tenant isolation**
- `createdAt`, `updatedAt` (timestamps)

**Relationships**:
- Belongs to `Client`
- Optional owner (`User`)
- Has many `Attachment`, `ComplianceClause`, `Clarification`, `BoQItem`, `VendorQuote`, `PricingPack`, `Outcome`

#### Client
Represents the client/authority issuing the tender.

**Fields**:
- `id` (UUID, primary key)
- `name` (string, required, unique per tenant)
- `tenantId` (string, default "default")
- `sector` (string, nullable)
- `createdAt`, `updatedAt` (timestamps)

**Constraints**:
- Unique constraint on `(name, tenantId)` to prevent duplicates within tenant

#### User
Platform users with authentication and authorization.

**Fields**:
- `id` (UUID, primary key)
- `email` (string, unique, required)
- `name` (string, required)
- `role` (enum: ADMIN, MANAGER, CONTRIBUTOR, VIEWER, default VIEWER)
- `team` (string, nullable) - Future team assignment
- `passwordHash` (string, nullable) - For local auth (argon2 hashed)
- `tenantId` (string, required)
- `createdAt`, `updatedAt` (timestamps)

**Authentication**:
- Local: email/password with argon2 hashing
- AAD: OIDC with `aad_oid` mapping (future)

#### Attachment
File attachments linked to any entity (opportunity, clarification, etc.).

**Fields**:
- `id` (UUID, primary key)
- `entityType` (string, required) - e.g., "opportunity", "clarification"
- `entityId` (string, required) - FK to entity
- `filename` (string, required)
- `size` (integer, bytes)
- `version` (integer, default 1) - Version tracking
- `hash` (string, required) - Content hash (SHA-256)
- `storagePath` (string, required) - Blob storage path
- `tenantId` (string, default "default")
- `createdAt` (timestamp)

**Storage**: Abstracted via StorageService (local filesystem for dev, Azure Blob for prod)

#### ComplianceClause
Extracted requirement clauses from RFP PDFs.

**Fields**:
- `id` (UUID, primary key)
- `opportunityId` (FK to Opportunity)
- `section` (string, nullable) - Section identifier
- `clauseNo` (string, nullable) - Clause number
- `requirementText` (text, required) - **Verbatim text preserved**
- `mandatoryFlag` (boolean, default false)
- `response` (text, nullable) - Our response text
- `status` (string, nullable) - "compliant", "partial", "non-compliant", "tbd"
- `evidence` (string, nullable) - Link to evidence document
- `owner` (string, nullable) - Owner name
- `createdAt`, `updatedAt` (timestamps)

**Key Principle**: **Verbatim requirement text must be preserved** - no summarization or paraphrasing.

#### Clarification
Questions and responses for tender clarifications.

**Fields**:
- `id` (UUID, primary key)
- `opportunityId` (FK to Opportunity)
- `questionNo` (string, required) - Question number (e.g., "Q1", "Q2.3")
- `text` (text, required) - Question text
- `status` (string, nullable) - "open", "submitted", "answered", "closed"
- `submittedOn` (datetime, nullable)
- `responseOn` (datetime, nullable)
- `responseText` (text, nullable)
- `file` (string, nullable) - Link to response file
- `createdAt`, `updatedAt` (timestamps)

#### BoQItem
Bill of Quantity line items for pricing.

**Fields**:
- `id` (UUID, primary key)
- `opportunityId` (FK to Opportunity)
- `lineNo` (integer, required)
- `category` (string, nullable)
- `description` (string, required)
- `qty` (float, default 1)
- `unit` (string, nullable) - e.g., "EA", "M", "KG"
- `oem` (string, nullable) - OEM name
- `sku` (string, nullable) - SKU code
- `unitCost` (float, default 0)
- `markup` (float, default 0) - Fraction (e.g., 0.15 = 15%)
- `unitPrice` (float, default 0) - Calculated: `unitCost * (1 + markup)`
- `createdAt`, `updatedAt` (timestamps)

#### VendorQuote
Vendor quotes for BoQ items.

**Fields**:
- `id` (UUID, primary key)
- `opportunityId` (FK to Opportunity)
- `vendor` (string, required)
- `quoteNo` (string, nullable)
- `validity` (datetime, nullable) - Quote validity expiration
- `leadTimeDays` (integer, nullable)
- `currency` (string, nullable) - e.g., "USD", "QAR"
- `files` (string, nullable) - Link to quote files
- `createdAt`, `updatedAt` (timestamps)

#### PricingPack
Versioned pricing pack with approvals.

**Fields**:
- `id` (UUID, primary key)
- `opportunityId` (FK to Opportunity)
- `version` (integer, default 1) - Version number
- `baseCost` (float, default 0) - Sum of BoQ items
- `overheads` (float, default 0) - Fraction (e.g., 0.1 = 10%)
- `contingency` (float, default 0) - Fraction
- `fxRate` (float, default 1) - FX conversion rate
- `margin` (float, default 0.15) - Margin fraction (15%)
- `totalPrice` (float, default 0) - Calculated total
- `createdAt`, `updatedAt` (timestamps)

**Calculation**: `totalPrice = (baseCost * (1 + overheads) * (1 + contingency) * fxRate) * (1 + margin)`

#### Approval
Approval chain entries for pricing packs.

**Fields**:
- `id` (UUID, primary key)
- `packId` (FK to PricingPack)
- `type` (enum: LEGAL, FINANCE, EXECUTIVE)
- `approverId` (string, required) - User ID
- `status` (enum: PENDING, APPROVED, REJECTED, default PENDING)
- `signedOn` (datetime, nullable)
- `remarks` (text, nullable)
- `createdAt`, `updatedAt` (timestamps)

**Workflow**: Sequential (Legal → Finance → Executive). All must approve before submission.

#### Outcome
Bid outcome recording.

**Fields**:
- `id` (UUID, primary key)
- `opportunityId` (FK to Opportunity)
- `status` (enum: WON, LOST, WITHDRAWN, CANCELLED)
- `date` (datetime, required)
- `winner` (string, nullable) - Winner name (if lost)
- `awardValue` (float, nullable) - Award value if won
- `notes` (text, nullable)
- `reasonCodes` (string array) - Loss reason codes
- `createdAt` (timestamp)

#### AwardStaging
Raw award data from external collectors (before curation).

**Fields**:
- `id` (UUID, primary key)
- `portal` (string, required) - Source portal name
- `tenderRef` (string, nullable)
- `buyer` (string, nullable) - Buyer/authority name
- `title` (string, nullable)
- `closeDate` (datetime, nullable)
- `awardDate` (datetime, nullable)
- `winners` (string array) - Winner names
- `awardValue` (float, nullable)
- `codes` (string array) - Business activity codes
- `notes` (text, nullable)
- `rawPath` (string, nullable) - Path to raw HTML/PDF in blob
- `status` (string, nullable) - "new", "parsed", "curated"
- `createdAt` (timestamp)

#### AwardEvent
Curated award events for analytics.

**Fields**:
- `id` (UUID, primary key)
- `portal` (string, required)
- `tenderRef` (string, nullable)
- `buyer` (string, nullable)
- `title` (string, nullable)
- `awardDate` (datetime, nullable)
- `winners` (string array)
- `awardValue` (float, nullable)
- `codes` (string array)
- `createdAt` (timestamp)

#### AuditLog
Immutable audit trail of all mutations.

**Fields**:
- `id` (UUID, primary key)
- `actorId` (string, required) - User ID
- `action` (string, required) - HTTP method (POST, PATCH, DELETE)
- `entity` (string, required) - Entity path/identifier
- `before` (JSON, nullable) - State before mutation
- `after` (JSON, nullable) - State after mutation
- `ip` (string, nullable) - Client IP address
- `timestamp` (datetime, default now)

**Principle**: Append-only, never deleted or modified.

#### AppSetting
Application-wide settings (key-value store).

**Fields**:
- `key` (string, primary key)
- `value` (string, required)
- `updatedAt` (timestamp)

**Examples**:
- `sla.warnDays` = "7"
- `sla.alertDays` = "3"
- `sla.urgentDays` = "1"

#### Notification
Email notification queue.

**Fields**:
- `id` (UUID, primary key)
- `type` (string, default "email")
- `to` (string, required) - Recipient email
- `subject` (string, required)
- `body` (text, required)
- `status` (string, default "pending") - "pending", "sent", "failed"
- `attempts` (integer, default 0)
- `lastError` (string, nullable)
- `createdAt` (timestamp)
- `sentAt` (datetime, nullable)

### Database Technology

- **Primary Database**: PostgreSQL 15
- **ORM**: Prisma (decision made: Prisma over TypeORM)
- **Migrations**: Prisma migrations (idempotent)
- **Connection Pooling**: Prisma client connection pool
- **Timezone**: Asia/Qatar (default for SLAs and reporting)

### Indexes & Performance

- Indexes on foreign keys (`opportunityId`, `clientId`, etc.)
- Indexes on frequently queried fields (`tenantId`, `status`, `stage`)
- Unique constraints: `(name, tenantId)` on Client, `email` on User
- Composite indexes for common query patterns

---

## Architecture & Technology Stack

### Monorepo Structure

**Repository**: Monorepo using `pnpm` workspaces and TurboRepo for build orchestration.

**Workspaces**:
- `apps/web` - React frontend application
- `apps/api` - NestJS backend API
- `apps/workers` - Background job workers (BullMQ)
- `apps/collectors` - External award data collectors
- `packages/shared-types` - Shared TypeScript types
- `packages/schemas` - Prisma schema and shared data models
- `packages/ui` - Shared UI components (future)
- `packages/adapters` - Portal adapter interfaces
- `packages/parser-tools` - PDF parsing utilities

**Build System**: TurboRepo for parallel builds and caching

### Frontend Architecture

**Technology Stack**:
- **Framework**: React 18+ with Vite
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (planned)
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: React Router v6
- **Charts**: Recharts (planned for dashboards)
- **Authentication**: MSAL for Azure AD (when `AUTH_PROVIDER=aad`), local JWT for dev

**Key Principles**:
- Component-based architecture
- Server state managed via TanStack Query
- Client-side routing with protected routes
- Responsive design (mobile-first)
- Accessibility (WCAG 2.1 AA target)

**Build Configuration**:
- API URL baked at build time via `VITE_API_URL` environment variable
- Docker Compose maps `WEB_API_URL` from root `.env` to build arg
- For local rebuild: `make rebuild-nc SERVICES="web"`

### Backend Architecture

**Technology Stack**:
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma (PostgreSQL)
- **Validation**: class-validator + class-transformer
- **API Documentation**: Swagger/OpenAPI (served at `/docs`)
- **Authentication**: Passport.js (JWT + OIDC strategies)
- **Authorization**: Custom `RolesGuard` + `JwtAuthGuard`
- **File Storage**: Abstracted via StorageService (local filesystem or Azure Blob, toggle via `STORAGE_PROVIDER`)
- **Search**: OpenSearch (decision made: OpenSearch over Postgres FTS)
- **Job Queue**: BullMQ on Redis
- **Email**: Nodemailer (SMTP, Mailhog for dev)

**Key Principles**:
- Modular architecture (feature modules)
- Dependency injection (NestJS DI)
- DTO validation at boundaries
- Global exception filters
- Global audit interceptor for mutations
- Tenant-scoped queries (RLS at service layer)

**API Design**:
- RESTful endpoints
- JSON request/response bodies
- Standard HTTP status codes
- Error responses with consistent format
- Pagination (future enhancement)

### Infrastructure

**Containerization**:
- Docker Compose for local development
- Dockerfiles for each service (`api`, `web`, `workers`, `collectors`)
- Multi-stage builds for optimization

**Services** (Docker Compose):
- **PostgreSQL 15**: Primary database
- **Redis 7**: Job queue and caching
- **OpenSearch 2.15**: Full-text search
- **OpenSearch Dashboards**: Search UI (optional)
- **Azurite**: Azure Blob Storage emulator (optional, only when `STORAGE_PROVIDER=azure`)
- **Mailhog**: Email testing (SMTP server + web UI)
- **OpenTelemetry Collector**: Telemetry aggregation
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization

**Ports**:
- API: 4000
- Web: 8080
- Grafana: 3000
- Mailhog Web UI: 8025
- OpenSearch Dashboards: 5601
- PostgreSQL: 5432
- Redis: 6379
- OpenSearch: 9200

**Deployment** (Production):
- **Target**: Azure Container Apps or AKS
- **Load Balancer**: Azure App Gateway with WAF
- **Blob Storage**: Azure Blob Storage (Qatar Central region) or local filesystem for simple deployments
- **Database**: Azure Database for PostgreSQL (Qatar Central)
- **Infrastructure as Code**: Bicep or Terraform
- **CI/CD**: GitHub Actions

### Search Architecture

**Decision**: OpenSearch (over Postgres FTS)

**Rationale**:
- Better full-text search capabilities
- Scalability for large document volumes
- Advanced query features (fuzzy matching, highlighting)
- Separate search cluster for performance isolation

**Indices**:
- `documents` - Full-text search across attachments
- `clauses` - Compliance clause search (future)

**Integration**:
- Documents indexed on upload
- Tenant-scoped queries (filter by `tenantId`)
- Search service abstracts OpenSearch API

### File Storage

**Storage Backend**: Abstracted via `StorageService` interface

**Providers** (toggle via `STORAGE_PROVIDER` env var):
- **local** (default for dev): Local filesystem storage in `LOCAL_STORAGE_PATH` (default: `./data/storage`)
- **azure** (for production): Azure Blob Storage

**Features**:
- Content-addressable storage (hash-based paths)
- Versioning support
- Container-based organization (`attachments` container)
- Metadata stored in PostgreSQL (`Attachment` table)

**Environment Variables**:
```
STORAGE_PROVIDER=local|azure
LOCAL_STORAGE_PATH=./data/storage        # for local provider
AZURE_STORAGE_CONNECTION_STRING=...      # for azure provider
ATTACHMENTS_CONTAINER=attachments
```

**Security**:
- Tenant isolation at application layer
- Immutability policies for audit logs (future)

### Background Jobs

**Queue System**: BullMQ on Redis

**Job Types**:
1. **SLA Tick** (`slaTick`): Periodic evaluation of SLA thresholds and notification creation
2. **Email Batch** (`processEmailBatch`): Batch email sending from notification queue
3. **PDF Parsing** (`parseRfp`) - Future: RFP PDF parsing for compliance matrix
4. **Award Ingestion** (`ingestAwards`) - Future: Scheduled award collector runs

**Scheduling**:
- SLA tick: Every 60 seconds (configurable)
- Email batch: Every 30 seconds (configurable)
- Collector runs: Daily at configured times (future)

### Observability

**Telemetry**:
- **OpenTelemetry**: Distributed tracing
- **Azure App Insights**: Application performance monitoring (production)
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization and dashboards

**Metrics**:
- API latency (p95 target: < 300ms)
- Queue depth and lag (SLO: < 30s)
- Parser error rate
- Collector success rate
- Database connection pool usage

**Logging**:
- Structured logging (JSON format)
- Log levels: ERROR, WARN, INFO, DEBUG
- Centralized log aggregation (future: Azure Log Analytics)

### Security Architecture

**Authentication**:
- **Production**: Azure AD SSO (OIDC)
- **Development**: Local database auth (email/password with argon2)
- **Toggle**: `AUTH_PROVIDER=local|aad` environment variable

**Authorization**:
- **RBAC**: Role-based access control (ADMIN, MANAGER, CONTRIBUTOR, VIEWER)
- **Tenant Isolation**: All queries filtered by `tenantId` from JWT
- **Record-Level**: Future enhancement for sharing specific entities

**Security Headers**:
- Helmet.js for security headers
- CORS configured for `WEB_ORIGIN`
- Rate limiting via `@nestjs/throttler` (default: 120 req/min)

**Secrets Management**:
- **Development**: `.env` files (gitignored)
- **Production**: Azure Key Vault (planned)
- **JWT Secret**: Environment variable (`JWT_SECRET`)

**Data Protection**:
- Encryption at rest (Azure managed)
- Encryption in transit (TLS everywhere)
- Data residency: Azure Qatar Central region

---

## Current Implementation Status

### M0 Foundations (✅ Complete)

**Monorepo Setup**:
- ✅ pnpm workspaces configured
- ✅ TurboRepo configured for builds
- ✅ Shared packages structure (`shared-types`, `schemas`, `adapters`, `parser-tools`)
- ✅ Root-level linting and formatting configs (ESLint, Prettier)

**Infrastructure**:
- ✅ Docker Compose with all services (Postgres, Redis, OpenSearch, Azurite, Mailhog, OTEL, Prometheus, Grafana)
- ✅ Dockerfiles for `api` and `web` services
- ✅ Makefile with comprehensive targets
- ✅ Environment variable templates (`example.env` files)

**Database**:
- ✅ Prisma schema defined (all core entities)
- ✅ Prisma migrations setup
- ✅ Database connection and service layer (`PrismaService`)

**API Foundation**:
- ✅ NestJS application scaffolded
- ✅ Health check endpoint (`/health`)
- ✅ Swagger/OpenAPI documentation (`/docs`)
- ✅ Global validation pipes
- ✅ Global exception filters
- ✅ Global audit interceptor
- ✅ Global roles guard
- ✅ JWT authentication strategy
- ✅ OIDC strategy (scaffolded, not wired for AAD yet)

**Authentication & Authorization**:
- ✅ Local auth endpoints (`/auth/register`, `/auth/login`, `/auth/dev-login`)
- ✅ JWT issuance and validation
- ✅ Role-based guards (`RolesGuard`, `JwtAuthGuard`)
- ✅ Tenant scoping in services
- ✅ Password hashing (argon2)
- ⚠️ AAD OIDC (scaffolded, benched for now - using local auth)

**Web Foundation**:
- ✅ React + Vite setup
- ✅ TypeScript configuration
- ✅ Tailwind CSS configured
- ✅ React Router setup
- ✅ API client with JWT token handling
- ✅ Auth gate component (`RequireAuth`)
- ✅ Dev login page (`/auth/dev`)

**CI/CD**:
- ✅ GitHub Actions workflow (lint, typecheck, build)
- ⚠️ Image build/push (planned)
- ⚠️ Migration dry-run (planned)
- ⚠️ API smoke tests (planned)

**Documentation**:
- ✅ Memory Bank structure (`docs/memory-bank/`)
- ✅ Core documentation (`docs/api.md`, `docs/web.md`, `docs/ops.md`, etc.)
- ✅ Environment variable documentation

### M1 Core Features (🔄 In Progress)

**Opportunities Module**:
- ✅ CRUD endpoints (`GET /opportunities`, `POST /opportunities`, `PATCH /opportunities/:id`, `DELETE /opportunities/:id`)
- ✅ Filtering (clientId, status, stage, maxDaysLeft, minRank)
- ✅ Tenant scoping
- ✅ Role-based access control
- ✅ Web UI: List view (`/`)
- ✅ Web UI: Kanban board (`/board`)
- ⚠️ Web UI: Timeline view (planned)
- ⚠️ SLA badge calculations (partial - needs SLA engine integration)

**Clients Module**:
- ✅ List endpoint (`GET /clients`)
- ✅ Create endpoint (`POST /clients`)
- ✅ Tenant scoping
- ✅ Role-based access control

**Import Module**:
- ✅ Tracker CSV import (`POST /import/tracker`)
- ✅ Template download (`GET /import/templates/tracker.csv`)
- ✅ Client and opportunity upsert logic
- ✅ Web UI: Import wizard (`/import/tracker`) with 3-step flow

**Settings Module**:
- ✅ SLA thresholds (`GET /settings/sla`, `PUT /settings/sla`)
- ✅ Role-based access control (PUT requires MANAGER/ADMIN)
- ✅ Default values from environment variables

**Attachments Module**:
- ✅ List endpoint (`GET /attachments?entityType&entityId`)
- ✅ Upload endpoint (`POST /attachments` with multipart file)
- ✅ Storage abstraction (local filesystem for dev, Azure Blob for prod)
- ✅ OpenSearch indexing on upload
- ✅ Tenant scoping
- ✅ Web UI: Attachments page (`/opportunity/:id/attachments`)

**Search Module**:
- ✅ Search endpoint (`GET /search?q=`)
- ✅ OpenSearch integration
- ✅ Tenant-scoped queries
- ⚠️ Clause search (planned)

**Compliance Module**:
- ✅ List clauses (`GET /compliance/:opportunityId`)
- ✅ PDF import (`POST /compliance/:opportunityId/import`)
- ✅ Update clause (`PATCH /compliance/:id`)
- ✅ CSV export (`GET /compliance/:opportunityId/export.csv`)
- ✅ Tenant access checks
- ✅ Web UI: Compliance Matrix (`/opportunity/:id/compliance`)
- ⚠️ PDF parser refinement (section detection, mandatory flags)

**Clarifications Module**:
- ✅ List (`GET /clarifications/:opportunityId`)
- ✅ Create (`POST /clarifications/:opportunityId`)
- ✅ Update (`PATCH /clarifications/item/:id`)
- ✅ CSV export (`GET /clarifications/:opportunityId/export.csv`)
- ✅ Tenant access checks
- ⚠️ Web UI (planned)

**Pricing Module**:
- ✅ BoQ CRUD (`GET /pricing/:opportunityId/boq`, `POST`, `PATCH`, `DELETE`)
- ✅ Vendor quotes CRUD (`GET /pricing/:opportunityId/quotes`, `POST`, `PATCH`)
- ✅ Pack recalculation (`POST /pricing/:opportunityId/pack/recalculate`)
- ✅ Tenant access checks
- ⚠️ Web UI (planned)
- ⚠️ Margin guardrails enforcement (planned)

**Approvals Module**:
- ✅ List approvals (`GET /approvals/:packId`)
- ✅ Bootstrap approval chain (`POST /approvals/:packId/bootstrap`)
- ✅ Decision endpoint (`POST /approvals/decision/:id`)
- ✅ Tenant access checks (via pack → opportunity)
- ⚠️ Web UI (planned)
- ⚠️ Signature storage (planned)

**Submission Module**:
- ✅ Build submission pack (`POST /submission/:opportunityId/build`)
- ✅ ZIP archive generation with manifest
- ✅ Checksum calculation
- ✅ Tenant access checks
- ⚠️ Web UI (planned)
- ⚠️ Manifest signing/verification (planned)

**Outcomes Module**:
- ✅ Get outcome (`GET /outcomes/:opportunityId`)
- ✅ Set outcome (`POST /outcomes/:opportunityId`)
- ✅ Tenant access checks
- ⚠️ Web UI (planned)
- ⚠️ Reason codes UI (planned)

**Awards Module**:
- ✅ Staging list (`GET /awards/staging`)
- ✅ Create staging (`POST /awards/staging`)
- ✅ Curate (`POST /awards/staging/:id/curate`)
- ✅ Events list (`GET /awards/events`)
- ✅ Web UI: Staging and curated views

**Analytics Module**:
- ✅ Awards CSV export (`GET /analytics/export/awards.csv`)
- ✅ Opportunities CSV export (`GET /analytics/export/opportunities.csv`)
- ✅ Tenant scoping on opportunities export
- ⚠️ Power BI integration deferred (CSV exports active)

**Workers**:
- ✅ SLA tick job (`slaTick`) - Evaluates SLA thresholds and creates notifications
- ✅ Email batch job (`processEmailBatch`) - Sends emails from notification queue
- ✅ BullMQ setup
- ✅ Redis integration
- ⚠️ Scheduled runs (planned - currently manual via `make sla-tick`)

**Collectors**:
- ✅ Scaffold created
- ✅ Playwright setup
- ✅ Sample collector inserting `AwardStaging` row
- ✅ Monaqasat adapter implemented (public awards)
- ⚠️ Live validation pending (Playwright host deps required)

### Known Issues & Limitations

1. **Port Conflicts**: Port 4000 may be in use by stray host Node processes. Solution: Kill process then `make up`.
2. **Web API URL**: Frontend API URL baked at build time. Must set `WEB_API_URL` in `.env` and rebuild with `make rebuild-nc SERVICES="web"`.
3. **AAD OIDC**: Benched for now - using local database auth. OIDC strategy scaffolded but not wired.
4. **SLA Calculations**: SLA engine runs but needs integration with opportunity `daysLeft` recalculation.
5. **PDF Parser**: Basic PDF parsing implemented, needs refinement for section detection and mandatory flags.
6. **Missing Web UIs**: Several modules have API endpoints but no web UI yet (Clarifications, Pricing, Approvals, Submission, Outcomes).

---

## Feature Roadmap

### Iteration A – Auth, RBAC, Audit, Search (🔄 In Progress)

**Status**: Mostly complete, minor refinements needed

**Tasks**:
- ✅ Local auth implementation (register/login/dev-login)
- ✅ JWT issuance and validation
- ✅ Role-based guards (global `RolesGuard`)
- ✅ Tenant scoping in all services
- ✅ Audit interceptor (global, captures POST/PATCH/DELETE)
- ✅ Search indexing (attachments indexed on upload)
- ✅ Search endpoint with tenant filtering
- ⚠️ AAD OIDC wiring (benched, using local auth)
- ⚠️ Audit log viewer UI (planned)
- ⚠️ Search UI enhancements (planned)

**Key Files**:
- `apps/api/src/auth/*` - Auth controllers, strategies, guards
- `apps/api/src/interceptors/audit.interceptor.ts` - Global audit
- `apps/api/src/search/*` - Search service and controller
- `apps/web/src/pages/Auth/DevLogin.tsx` - Dev login page
- `apps/web/src/router.tsx` - Auth gate wrapper

### Iteration B – Compliance Matrix & Clarifications (🔄 In Progress)

**Status**: API complete, UI partial

**Tasks**:
- ✅ Compliance API endpoints (list, import, update, export)
- ✅ Clarifications API endpoints (list, create, update, export)
- ✅ Compliance Matrix web UI (`/opportunity/:id/compliance`)
- ✅ PDF import and clause extraction
- ⚠️ Parser refinements (section detection, mandatory flags, better clause splitting)
- ⚠️ Clarifications web UI (`/opportunity/:id/clarifications`)
- ⚠️ Bulk edit/export performance optimizations
- ⚠️ Templates and print/export formatting

**Key Files**:
- `apps/api/src/modules/compliance/*` - Compliance service and controller
- `apps/api/src/modules/clarifications/*` - Clarifications service and controller
- `apps/web/src/pages/Compliance/Matrix.tsx` - Compliance UI
- `packages/parser-tools/*` - PDF parsing utilities (future)

### Iteration C – Pricing & Approvals, Submission Pack, Outcomes (🔄 In Progress)

**Status**: API complete, UI missing

**Tasks**:
- ✅ Pricing API endpoints (BoQ, quotes, pack recalculation)
- ✅ Approvals API endpoints (list, bootstrap, decision)
- ✅ Submission pack builder API (ZIP + manifest + checksum)
- ✅ Outcomes API endpoints (get, set)
- ⚠️ Pricing web UI (`/opportunity/:id/pricing`)
- ⚠️ Approvals web UI (approval chain visualization)
- ⚠️ Submission pack builder UI
- ⚠️ Outcomes web UI with reason codes
- ⚠️ Margin guardrails enforcement
- ⚠️ Approval signatures storage
- ⚠️ Manifest signing/verification utility
- ⚠️ Post-mortem template library

**Key Files**:
- `apps/api/src/modules/pricing/*` - Pricing service and controller
- `apps/api/src/modules/approvals/*` - Approvals service and controller
- `apps/api/src/modules/submission/*` - Submission service and controller
- `apps/api/src/modules/outcomes/*` - Outcomes service and controller

### Iteration D – External Awards Collector (⏳ Planned)

**Status**: Monaqasat adapter implemented; validation pending

**Tasks**:
- ✅ Collector scaffold with Playwright
- ✅ Staging and curation API endpoints
- ✅ First portal adapter (Monaqasat)
- ⚠️ Entity resolution (winner → Competitor fuzzy matching)
- ⚠️ Curation UI for staging records
- ⚠️ Scheduled runs (daily at configured times)
- ⚠️ Error handling and retry logic
- ⚠️ robots.txt and ToS compliance checks

**Key Files**:
- `apps/collectors/src/index.ts` - Collector entry point
- `apps/collectors/src/adapters/*` - Portal adapters (future)
- `apps/api/src/modules/awards/*` - Awards API

**Decision Pending**: Monaqasat live validation + edge cases (missing winner table, multiple winners)

### Iteration E – Analytics & Power BI (⏳ Planned)

**Status**: CSV exports complete, Power BI integration deferred

**Tasks**:
- ✅ Awards CSV export
- ✅ Opportunities CSV export
- ⚠️ Curated warehouse tables (star schema)
- ⚠️ Power BI semantic model (deferred)
- ⚠️ Executive dashboards (pipeline, win rate, velocity, competitor stats)
- ⚠️ Scheduled refresh jobs
- ⚠️ Email digests (weekly summaries)

**Key Files**:
- `apps/api/src/modules/analytics/*` - Analytics service
- `scripts/pbi-export.js` - Power BI export script (future)
- Power BI `.pbix` files (future)

### Iteration F – Hardening & Operations (⏳ Planned)

**Status**: Partial (rate limiting, CORS, helmet configured)

**Tasks**:
- ✅ Rate limiting (`@nestjs/throttler`)
- ✅ Security headers (Helmet)
- ✅ CORS configuration
- ⚠️ Observability dashboards (API latency, queue depth, parser errors, collector success)
- ⚠️ CI enhancements (build/push images, migration dry-run, API smoke tests)
- ⚠️ Secrets management (Azure Key Vault integration)
- ⚠️ Backup and retention policies
- ⚠️ Penetration testing preparation
- ⚠️ Performance tuning (database indexes, query optimization)
- ⚠️ Error monitoring and alerting

**Key Files**:
- `infra/compose.yml` - Infrastructure configuration
- `.github/workflows/ci.yml` - CI pipeline
- `docs/ops.md` - Operations documentation

---

## External Data Ingestion Strategy

### Overview

The platform ingests external award results from public tender portals to build competitor intelligence. This enables tracking of:
- Who won which tenders
- Award values and business activity codes
- Competitor behavior patterns
- Market trends

### Architecture

**Source Adapters**:
- Each portal has a `SourceAdapter` implementation
- Adapters implement a common interface for consistency
- Prefer official APIs where available
- Fallback to headless browser scraping (Playwright) when needed

**Collector Pattern**:
1. **Discovery**: Scheduled runs (daily at configured times)
2. **Extraction**: Portal adapter extracts award data
3. **Storage**: Raw HTML/PDF saved to Blob Storage
4. **Parsing**: Normalizer converts to structured JSON
5. **Staging**: Insert into `AwardStaging` table
6. **Curation**: Human-in-the-loop review and validation
7. **Curated**: Move to `AwardEvent` table for analytics

**Entity Resolution**:
- Fuzzy matching of winner names to `Competitor` entities
- Link by tax ID when publicly available
- Manual curation for ambiguous matches

### Governance

**Legal & Ethical**:
- Review portal Terms of Service before implementation
- Check `robots.txt` compliance
- Implement request throttling and back-off
- Respect IP allow-listing requirements
- Maintain audit log of all collection activities

**Technical**:
- Feature flags to enable/disable collectors per source
- Error handling and retry logic
- Monitoring and alerting for failures
- Data quality validation (numeric parsing, date formats)

**Data Quality**:
- Staging schema with validation rules
- Human curation step before analytics
- Sampling QA to measure parse error rates
- Target: ≤ 2% numeric parse error after curation

### Implementation Status

- ✅ Collector scaffold created
- ✅ Playwright setup
- ✅ Staging and curation API endpoints
- ⚠️ First portal adapter (pending decision)
- ⚠️ Entity resolution logic
- ⚠️ Scheduled runs
- ⚠️ Curation UI

**Decision Pending**: Which portal to target first?

---

## Security & Compliance

### Authentication

**Production**: Azure AD SSO (OIDC)
- MSAL on web frontend
- Passport OIDC strategy on API
- JWT issued after successful OIDC callback
- Conditional Access and MFA enforced via AAD

**Development**: Local database auth
- Email/password registration and login
- Password hashed with argon2
- JWT issued on successful login
- Toggle via `AUTH_PROVIDER=local|aad`

### Authorization

**Role-Based Access Control (RBAC)**:
- Roles: ADMIN, MANAGER, CONTRIBUTOR, VIEWER
- Global `RolesGuard` enforces role requirements
- Decorator-based role specification: `@Roles('MANAGER', 'ADMIN')`

**Tenant Isolation**:
- All queries filtered by `tenantId` from JWT
- Service layer enforces tenant scoping
- Record-level access checks via `TenantService.ensureOpportunityAccess()`

**Future Enhancement**: Record-level sharing for specific entities

### Data Protection

**Encryption**:
- At rest: Azure managed encryption
- In transit: TLS everywhere (HTTPS)

**Data Residency**:
- All data stored in Azure Qatar Central region
- Compliance with local data residency requirements

**Secrets Management**:
- Development: `.env` files (gitignored)
- Production: Azure Key Vault (planned)
- JWT secrets rotated periodically

### Audit & Compliance

**Audit Logging**:
- Global `AuditInterceptor` captures all mutations (POST, PATCH, DELETE)
- Immutable `AuditLog` entries (append-only)
- Captures: actor, action, entity, before/after state, IP, timestamp

**Compliance**:
- Full audit trail of approvals
- Immutable logs for regulatory compliance
- Export capabilities for audit reports

### Security Headers & Rate Limiting

**Security Headers** (Helmet.js):
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS)

**Rate Limiting**:
- Default: 120 requests per minute per IP
- Configurable via `RATE_LIMIT_TTL` and `RATE_LIMIT_LIMIT`
- Applied globally via `ThrottlerGuard`

**CORS**:
- Configured for `WEB_ORIGIN` environment variable
- Credentials enabled for cookie-based auth (future)

---

## Analytics & Power BI Integration

### Subject Areas

**Pipeline**:
- Count and value by stage, client, sector, owner
- Funnel visualization (sourcing → outcome)
- Stage duration metrics

**Hit Rate**:
- Win percentage by sector, client, OEM, deal size
- Trend analysis over time
- Comparison to industry benchmarks

**Velocity**:
- Cycle time from discovery → submission → award
- Stage transition times
- Bottleneck identification

**Pricing**:
- Margin waterfall analysis
- Cost vs price variance
- FX sensitivity analysis

**Compliance**:
- Mandatory gaps count
- Clarifications volume and turnaround time
- Compliance matrix completion rates

**Competitors**:
- Wins by buyer/sector
- Average award values
- Co-bid frequency analysis

### Data Model

**Star Schema Design**:

**Fact Tables**:
- `FactOpportunity` - Opportunity lifecycle events
- `FactPricing` - Pricing pack versions and calculations
- `FactClarification` - Clarification submissions and responses
- `FactSubmission` - Submission events and methods
- `FactOutcome` - Outcome records with reason codes

**Dimension Tables**:
- `DimClient` - Client master data
- `DimDate` - Date dimension for time-based analysis
- `DimSector` - Sector taxonomy
- `DimUser` - User/owner dimension
- `DimCompetitor` - Competitor profiles
- `DimOEM` - OEM master data

### Power BI Integration

**Semantic Model**:
- DirectQuery or Import mode (TBD based on data volume)
- Relationships defined between facts and dimensions
- Calculated measures for KPIs

**Dashboards**:
- Executive summary dashboard
- Pipeline dashboard
- Win rate dashboard
- Competitor intelligence dashboard

**Refresh Schedule**:
- Automated daily refresh (scheduled job)
- Manual refresh capability
- Incremental refresh for large fact tables (future)

### Implementation Status

- ✅ CSV exports for awards and opportunities
- ✅ Tenant scoping on exports
- ⚠️ Curated warehouse tables (planned)
- ⚠️ Power BI semantic model (planned)
- ⚠️ Dashboards (planned)
- ⚠️ Scheduled refresh jobs (planned)

---

## Development Workflow

### Getting Started

**Prerequisites**:
- Node.js 20+
- pnpm 9+
- Docker and Docker Compose
- Git

**Initial Setup**:
```bash
# Clone repository
git clone <repo-url>
cd bidOps

# Bootstrap workspace
make bootstrap

# Start infrastructure
make up

# Run database migrations
make db-migrate

# Start API in dev mode
make api-dev

# Start web in dev mode (separate terminal)
make web-dev
```

### Makefile Targets

**Infrastructure**:
- `make up` - Start all Docker services
- `make down` - Stop all Docker services
- `make logs` - View all logs
- `make logs-backend` - View API logs
- `make logs-frontend` - View web logs
- `make logs-monitoring` - View monitoring logs

**Database**:
- `make db-migrate` - Run Prisma migrations
- `make db-seed` - Seed database (if seed script exists)
- `make db-reset` - Reset database (drop, migrate, seed)

**Development**:
- `make api-dev` - Start API in dev mode (hot reload)
- `make web-dev` - Start web in dev mode (hot reload)
- `make workers-dev` - Start workers in dev mode
- `make collectors-run` - Run collectors manually

**Build & Test**:
- `make build` - Build all apps and packages
- `make lint` - Lint all code
- `make test` - Run tests (when implemented)

**Utilities**:
- `make import-sample` - Send sample CSV to import endpoint
- `make sla-tick` - Run SLA tick job manually
- `make pack-sample` - Generate sample submission pack
- `make parse-rfp` - Parse sample RFP PDF
- `make pbi-export` - Export data for Power BI
- `make seed-admin` - Create admin user and print JWT

**Rebuild**:
- `make rebuild [SERVICES="api web"]` - Rebuild specific services
- `make rebuild-nc [SERVICES="web"]` - Rebuild without cache

### Environment Variables

**Root `.env`** (for Docker Compose):
- `WEB_API_URL` - API URL for web build (default: `http://localhost:4000`)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT` - Redis connection
- `OPENSEARCH_HOST` - OpenSearch URL
- `AUTH_PROVIDER` - `local` or `aad`
- `JWT_SECRET` - JWT signing secret
- `WEB_ORIGIN` - CORS origin for web app

**API `.env`** (`apps/api/.env`):
- `PORT` - API port (default: 4000)
- `DATABASE_URL` - PostgreSQL connection
- `OPENSEARCH_HOST` - OpenSearch URL
- `AZURE_STORAGE_CONNECTION_STRING` - Blob storage connection
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` - Email configuration
- `AUTH_PROVIDER` - Auth provider toggle
- `JWT_SECRET` - JWT secret
- `WEB_ORIGIN` - CORS origin
- `RATE_LIMIT_TTL`, `RATE_LIMIT_LIMIT` - Rate limiting config

**Web `.env`** (`apps/web/.env`):
- `VITE_API_URL` - API base URL (baked at build time)

**Workers `.env`** (`apps/workers/.env`):
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_HOST`, `REDIS_PORT` - Redis connection
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` - Email configuration
- `SLA_WARN_DAYS`, `SLA_ALERT_DAYS`, `SLA_URGENT_DAYS` - SLA thresholds

**Collectors `.env`** (`apps/collectors/.env`):
- `DATABASE_URL` - PostgreSQL connection
- `PLAYWRIGHT_HEADLESS` - Headless browser mode

### Code Style & Standards

**TypeScript**:
- Strict mode enabled
- No `any` types (use `unknown` or proper types)
- ESLint for linting
- Prettier for formatting

**Naming Conventions**:
- Files: kebab-case (`opportunities.controller.ts`)
- Classes: PascalCase (`OpportunitiesController`)
- Functions/variables: camelCase (`listOpportunities`)
- Constants: UPPER_SNAKE_CASE (`ROLES_KEY`)

**API Design**:
- RESTful endpoints
- Plural resource names (`/opportunities`, `/clients`)
- HTTP verbs: GET (read), POST (create), PATCH (update), DELETE (delete)
- Consistent error responses
- DTO validation at boundaries

### Git Workflow

**Branching Strategy**:
- `main` - Production-ready code
- `develop` - Integration branch (if needed)
- Feature branches: `feature/description`
- Bug fixes: `fix/description`

**Commit Messages**:
- Conventional commits format preferred
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

### Testing Strategy (Planned)

**Unit Tests**:
- Service layer logic
- Utility functions
- DTO validation

**Integration Tests**:
- API endpoints (with test database)
- Database queries
- External service integrations (mocked)

**E2E Tests**:
- Critical user flows
- Authentication flows
- Submission pack generation

**Test Tools**:
- Vitest for unit/integration tests
- Playwright for E2E tests (planned)

---

## Acceptance Criteria

### Tracker Import

**Requirement**: Import "Currently Working – October 2025" sample with ≥ 98% field mapping accuracy.

**Test**:
1. Upload CSV file via `/import/tracker`
2. Verify clients created/updated correctly
3. Verify opportunities created with correct field mappings
4. Measure field mapping accuracy (should be ≥ 98%)

**Status**: ✅ API implemented, ⚠️ Accuracy testing pending

### SLA Engine

**Requirement**: Creating an opportunity with a close date triggers timers; escalations fire as due approaches; audit entries recorded.

**Test**:
1. Create opportunity with `submissionDate` in future
2. Verify `daysLeft` calculated correctly
3. Verify SLA tick job creates notifications at thresholds
4. Verify email notifications sent
5. Verify audit log entries created

**Status**: ✅ SLA tick job implemented, ⚠️ Integration with opportunity updates pending

### Compliance Matrix

**Requirement**: Parser converts 100-page RFP PDF into matrix preserving verbatim requirement text; export to CSV/XLSX; manual edit round-trip works.

**Test**:
1. Upload 100-page RFP PDF via `/compliance/:opportunityId/import`
2. Verify clauses extracted with verbatim text preserved
3. Export to CSV via `/compliance/:opportunityId/export.csv`
4. Edit clauses via PATCH endpoint
5. Re-export and verify changes persisted

**Status**: ✅ Basic implementation complete, ⚠️ 100-page test pending, ⚠️ XLSX export pending

### Pricing & Approvals

**Requirement**: BoQ with vendor quote attached → margin guardrails enforced → approval chain completes with signatures and audit.

**Test**:
1. Create BoQ items with vendor quotes
2. Recalculate pricing pack
3. Verify margin guardrails enforced (reject if below threshold)
4. Bootstrap approval chain (Legal → Finance → Executive)
5. Complete approval chain with signatures
6. Verify audit log entries for each approval

**Status**: ✅ API implemented, ⚠️ Margin guardrails pending, ⚠️ Signatures pending

### Submission Pack

**Requirement**: One-click pack builder outputs signed ZIP/PDF set with checksum manifest.

**Test**:
1. Upload attachments to opportunity
2. Call `/submission/:opportunityId/build`
3. Verify ZIP archive generated
4. Verify manifest file included with checksums
5. Verify all attachments included
6. Verify checksums match file contents

**Status**: ✅ Basic implementation complete, ⚠️ Signing/verification pending

### Collector

**Requirement**: Award adapter ingests ≥ 200 award rows with winner & value; ≤ 2% numeric parse error after curation.

**Test**:
1. Run collector for target portal
2. Verify ≥ 200 award rows ingested
3. Verify winner and award value extracted
4. Curate records (human review)
5. Measure numeric parse error rate (should be ≤ 2%)

**Status**: ⚠️ Monaqasat adapter implemented; live validation pending

### Dashboards

**Requirement**: Power BI shows pipeline, win%, velocity, competitor stats; refresh jobs succeed; drill-downs accurate.

**Test**:
1. Connect Power BI to curated warehouse
2. Verify dashboards display correct data
3. Verify refresh jobs succeed
4. Test drill-downs (client → opportunities → details)
5. Verify data aligns with DB snapshots

**Status**: ⚠️ Power BI integration deferred (CSV exports active)

### Operations

**Requirement**: `make up` starts stack; `make parse-rfp` generates matrix; `make collectors-run` pulls awards; CI builds/pushes images.

**Test**:
1. Run `make up` - verify all services start
2. Run `make parse-rfp` - verify matrix generated
3. Run `make collectors-run` - verify awards ingested
4. Verify CI pipeline builds and pushes images

**Status**: ✅ `make up` works, ✅ `make parse-rfp` works, ⚠️ `make collectors-run` blocked by Playwright host deps, ⚠️ CI image push pending

---

## Risks & Mitigations

### Technical Risks

**1. Portal ToS or Anti-Bot Controls**
- **Risk**: Target portals may block automated collection or change ToS
- **Mitigation**: 
  - Modular adapter architecture allows switching sources
  - Fallback to manual import
  - Legal review before implementation
  - robots.txt compliance checks
  - Request throttling and back-off

**2. Parsing Quality on PDFs**
- **Risk**: PDF parser may miss clauses or extract incorrectly
- **Mitigation**:
  - Human-in-the-loop curation step
  - Preserve verbatim text (no summarization)
  - Sampling QA to measure error rates
  - Iterative parser improvements based on feedback

**3. Data Quality for Competitor Names and Award Values**
- **Risk**: Inconsistent naming, missing values, parse errors
- **Mitigation**:
  - Staging schema with validation rules
  - Fuzzy entity resolution for competitor matching
  - Human curation before analytics
  - Target: ≤ 2% numeric parse error after curation

**4. SLA Logic Edge Cases**
- **Risk**: Timezone handling, holiday calendars, edge cases
- **Mitigation**:
  - Default timezone: Asia/Qatar
  - Configurable holiday calendars (future)
  - Comprehensive test coverage
  - Manual override capability

**5. Performance at Scale**
- **Risk**: Database queries slow with large datasets
- **Mitigation**:
  - Database indexes on frequently queried fields
  - Query optimization and profiling
  - Pagination for large result sets
  - Read replicas for analytics (future)

### Operational Risks

**1. Security Drift**
- **Risk**: Security configurations drift over time
- **Mitigation**:
  - Infrastructure as Code (Bicep/Terraform)
  - Baseline security policies
  - Quarterly security reviews
  - Automated key rotation

**2. Data Loss**
- **Risk**: Accidental deletion or corruption
- **Mitigation**:
  - Automated backups (planned)
  - Immutable audit logs
  - Point-in-time recovery (planned)
  - Retention policies

**3. Deadline Overload**
- **Risk**: Too many opportunities, missed deadlines
- **Mitigation**:
  - SLA engine with automated escalations
  - Executive dashboards for visibility
  - Priority ranking system
  - Digest emails summarizing pipeline

### Business Risks

**1. Scope Creep**
- **Risk**: Feature requests expand scope beyond MVP
- **Mitigation**:
  - Clear scope boundaries documented
  - Change control process
  - Prioritization framework
  - Regular stakeholder alignment

**2. User Adoption**
- **Risk**: Users resist new platform
- **Mitigation**:
  - User training and documentation
  - Phased rollout
  - Feedback collection and iteration
  - Support and help desk

---

## Next Steps & Decisions Pending

### Immediate Next Steps (This Week)

1. **Complete M1 Core Features**:
   - Finish web UIs for Clarifications, Pricing, Approvals, Submission, Outcomes
   - Integrate SLA engine with opportunity `daysLeft` recalculation
   - Add margin guardrails enforcement in pricing module

2. **Refine Compliance Parser**:
   - Improve section detection
   - Better clause splitting heuristics
   - Mandatory flag detection
   - Test with 100-page RFP

3. **First Portal Adapter Decision**:
   - Research candidate portals
   - Evaluate API availability vs scraping requirements
   - Legal/ToS review
   - Select first target portal

4. **CI Enhancements**:
   - Add image build/push to GitHub Actions
   - Add migration dry-run step
   - Add API smoke tests

### Decisions Pending

1. **First Award Portal Target**
   - Which portal to implement first?
   - Considerations: API availability, data quality, legal constraints, signal value

2. **Power BI Integration Mode**
   - DirectQuery vs Import mode?
   - Considerations: Data volume, refresh frequency, performance requirements

3. **Holiday Calendar**
   - How to handle Qatar holidays in SLA calculations?
   - Options: Hardcoded list, external API, manual configuration

4. **Record-Level Sharing**
   - How to implement sharing links for specific opportunities?
   - Options: Token-based URLs, explicit sharing table, team-based

5. **AAD OIDC Wiring**
   - When to wire AAD OIDC (currently benched)?
   - Dependencies: AAD tenant setup, app registration, redirect URIs

### Future Enhancements (Post-MVP)

1. **AI-Assisted Workflows**:
   - RFP parser with AI clause extraction
   - Clarification drafting assistance
   - Compliance gap heatmap
   - Bid summary generation

2. **Advanced Analytics**:
   - Predictive win probability
   - Competitor behavior analysis
   - Pricing optimization suggestions

3. **Mobile App**:
   - Native mobile app for iOS/Android
   - Push notifications for SLA alerts
   - Offline capability

4. **Integration APIs**:
   - Partner/OEM portal integrations
   - ERP system integration
   - CRM integration

---

## Appendix

### Key File Locations

**API**:
- Main entry: `apps/api/src/main.ts`
- Modules: `apps/api/src/modules/*`
- Auth: `apps/api/src/auth/*`
- Prisma schema: `apps/api/prisma/schema.prisma`

**Web**:
- Main entry: `apps/web/src/main.tsx`
- Pages: `apps/web/src/pages/*`
- Router: `apps/web/src/router.tsx`
- API client: `apps/web/src/api/client.ts`

**Infrastructure**:
- Docker Compose: `infra/compose.yml`
- Makefile: `Makefile`
- CI: `.github/workflows/ci.yml`

**Documentation**:
- Memory Bank: `docs/memory-bank/*`
- API docs: `docs/api.md`
- Ops docs: `docs/ops.md`
- Web docs: `docs/web.md`

### Useful Commands

```bash
# Start everything
make up

# View logs
make logs-backend

# Create admin user
make seed-admin

# Rebuild web after API URL change
make rebuild-nc SERVICES="web"

# Run SLA tick manually
make sla-tick

# Import sample tracker
make import-sample
```

### Contact & Support

For questions or issues:
1. Consult this plan document
2. Review Memory Bank files (`docs/memory-bank/`)
3. Check API documentation (`/docs` endpoint)
4. Review code comments and inline documentation

---

**End of Plan Document**

This plan is a living document and should be updated as the project evolves. All developers should read this plan at the start of each session to maintain context and alignment.
