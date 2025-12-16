# Web

UI scope and behaviors:

- Opportunity Kanban, timeline, list with filters/SLA indicators
- Opportunity overview shell with tabbed navigation across all workspaces
- Compliance Matrix editor preserving verbatim requirement text
- Clarifications module with numbering and exports
- Pricing workspace (BoQ, vendor quotes, guardrails, approvals)
- Submission pack builder and audit trail
- Outcome recording with reason codes
- Attachment search across entities
- SLA settings editor (warn/alert/urgent thresholds)

## Implemented Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Opportunities List | Table with filters, SLA badges, create modal |
| `/board` | Opportunities Kanban | Board grouped by stage with SLA badges |
| `/timeline` | Timeline View | Ordered by submission date; SLA thresholds displayed |
| `/import/tracker` | Tracker Import Wizard | CSV upload for bulk import |
| `/opportunity/:id` | Opportunity Overview | Summary plus quick links to all tabs |
| `/opportunity/:id/attachments` | Attachments Page | Upload/list attachments with hash/size |
| `/opportunity/:id/compliance` | Compliance Matrix | Clause management with PDF import/CSV export |
| `/opportunity/:id/clarifications` | Clarifications Q&A | Question numbering and response tracking |
| `/opportunity/:id/pricing` | Pricing Workspace | BoQ items, vendor quotes, pack calculator |
| `/opportunity/:id/approvals` | Approvals Workflow | Legal→Finance→Executive approval chain |
| `/opportunity/:id/submission` | Submission Pack Builder | Generate ZIP with manifest and checksum |
| `/opportunity/:id/outcome` | Outcome Recording | Won/Lost/Withdrawn status with reason codes |
| `/awards/staging` | Awards Staging | Review and curate collected awards |
| `/awards/events` | Curated Awards | View curated award events |
| `/search` | Attachment Search | Search attachments via `/search?q=` |
| `/settings/sla` | SLA Settings | View/edit warn/alert/urgent thresholds |
| `/auth/callback` | Auth Callback | Handles OAuth redirect |
| `/auth/dev` | Dev Login | Local development authentication |

## Tech Stack

- React + Vite
- TypeScript
- Tailwind CSS
- shadcn/ui components (planned/lightweight)
- React Router for navigation
- TanStack Query for data fetching/caching
- MSAL for Azure AD login (when `AUTH_PROVIDER=aad`)

## Environment / Build

- API URL is baked at build via `VITE_API_URL`
- Compose maps root `.env` `WEB_API_URL` to that build arg
- For local rebuild to pick new API URL: `make rebuild-nc SERVICES="web"`
- Minimum margin guardrail configurable via `VITE_MIN_MARGIN` (percent)

## Auth Flow

### AAD (Production)
1. Web redirects to `/auth/login`
2. API initiates OIDC flow with Azure AD
3. After auth, redirects to `/auth/callback`
4. JWT stored in localStorage
5. All API requests include `Authorization: Bearer <token>`

### Local (Development)
1. User visits `/auth/dev`
2. Enters email and optional role
3. POST to `/auth/dev-login` returns JWT
4. JWT stored via `utils/auth` helper in `localStorage`
5. All API requests include `Authorization: Bearer <token>`; 401 clears token and redirects to `/auth/dev`

## Component Patterns

### Page Layout
Each page follows a consistent pattern:
- Full height (`min-h-screen`) with slate-50 background
- Layout shell with top nav + secondary path crumb
- Max-width container with horizontal padding
- Section headings with action buttons/back links

### Form Patterns
- Controlled inputs with useState
- Grid layouts for form fields
- Save/Cancel buttons for edit forms
- Loading states during async operations

### Data Fetching
- TanStack Query for all reads; mutations invalidate or refetch keys
- Loading and error states on every query/mutation
- Token from `utils/auth`; 401 -> redirect to `/auth/dev`

## Visibility and Security

- Role-based visibility across modules
- Tenant scoping applied to queries
- Protected routes redirect to `/auth/dev` when no token
- Record-level sharing for selected entities where applicable
