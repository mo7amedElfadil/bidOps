# Web

UI scope and behaviors:
 - Routes now declare an `errorElement` so any runtime failure renders the shared ErrorPage fallback (reload/home actions + status info).

- Opportunity Kanban, timeline, list with filters/SLA indicators
- Opportunities list shows countdown timer (dd:hh:mm) with circular progress ring and color thresholds
- Opportunity overview shell with tabbed navigation across all workspaces
- Opportunity overview allows selecting/add new business & bid owners, opening a modal to add users (name/email/type/role)
- Bid review dashboard (`/approvals/review`) summarizes pricing packs, approval chains, and lets the assigned reviewer finalize bids once every signature is captured
- Opportunity pages include a submission checklist (tender bond submitted, mandatory forms completed, final combined PDF ready, compliance created, clarifications sent or N/A, pricing approved) with per-item notes and attachments
- Post submission view (`/post-submission`) groups completed proposals or passed deadlines away from the active pipeline; board adds a “Post Submission” lane
- Settings page now drives the stage and status dropdowns used in opportunity forms
- Opportunity summary fields are editable; stage progression is shown with a dropdown and visual indicator
- Compliance Matrix editor preserving verbatim requirement text
- Clarifications module with numbering and exports
- Pricing workspace (BoQ, vendor quotes, guardrails, approvals)
- Pricing workspace supports custom columns, formulas, templates, and a pricing pack worksheet
- CSV import for compliance and clarifications (uses export schema)
- Submission pack builder and audit trail
- Outcome recording with reason codes
- Attachment search across entities
- Attachment download and AI extraction prompt (uses selected files as context)
- SLA settings editor (warn/alert/urgent thresholds)
- Holiday calendar and retention settings (admin configurable)
- Timezone offset (UTC+3 default, admin configurable)
- Import date format lock for tracker CSV (MDY/DMY/AUTO)
- English and Arabic content support
- Award staging can trigger Monaqasat collector with date range (from/to)
- Available ministry tenders view with request Go/No-Go approval CTA, promote-to-opportunity action, and purchase links
- Future: AI/smart filtering for potential opportunities so only ITSQ-relevant tenders are surfaced
- User management for ADMIN (create/edit/disable)
- Tracker import issues list (invalid values left empty, resolved on update)

## Implemented Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Opportunities List | Table with filters, SLA badges, create modal |
| `/board` | Opportunities Kanban | Board grouped by stage with SLA badges |
| `/timeline` | Timeline View | Ordered by submission date; SLA thresholds displayed |
| | | Timeline now uses `gantt-task-react` with adjustable name/from/to widths, optional text wrap, and export-to-image support. |
| `/import/tracker` | Tracker Import Wizard | CSV upload for bulk import |
| `/opportunity/:id` | Opportunity Overview | Summary plus quick links to all tabs; shows unresolved import issues |
| `/opportunity/:id/attachments` | Attachments Page | Upload/list/download attachments, run AI extraction |
| `/opportunity/:id/compliance` | Compliance Matrix | Clause management with PDF import/CSV export |
| `/opportunity/:id/clarifications` | Clarifications Q&A | Question numbering and response tracking |
| `/opportunity/:id/pricing` | Pricing Workspace | BoQ items, vendor quotes, pack calculator, worksheet |
| `/opportunity/:id/approvals` | Approvals Workflow | Legal→Finance→Executive approval chain |
| `/approvals/review` | Bid Review | Dashboard listing pricing packs, approvals status, and finalization action |
| `/opportunity/:id/submission` | Submission Pack Builder | Generate ZIP with manifest and checksum |
| `/opportunity/:id/outcome` | Outcome Recording | Won/Lost/Withdrawn status with reason codes |
| `/awards/staging` | Awards Staging | Review and curate collected awards |
| `/awards/events` | Curated Awards | View curated award events |
| `/tenders/available` | Available Tenders | List Monaqasat tenders and promote to opportunities |
| `/admin/users` | Users | Admin user management |
| `/admin/business-roles` | Business Roles | Manage business roles for routing and approvals |
| `/notifications` | Notifications | In-app notifications and preferences |
| `/search` | Attachment Search | Search attachments via `/search?q=` |
| `/settings/sla` | SLA Settings | View/edit thresholds, holiday calendar, retention policy |
| `/auth/callback` | Auth Callback | Handles OAuth redirect |
| `/auth/login` | Login | Email/password login |
| `/auth/signup` | Signup | Request access (pending approval) |
| `/auth/accept-invite` | Accept Invite | Set password from invite token |
| `/auth/forgot-password` | Forgot Password | Request password reset |
| `/auth/reset-password` | Reset Password | Set new password from reset token |
| `/auth/change-password` | Change Password | Update password (required for default admin) |
| `/auth/dev` | Dev Login | Local development authentication |

## Tech Stack

- React + Vite
- TypeScript
- Tailwind CSS
- shadcn/ui components (planned/lightweight)
- React Router for navigation
- TanStack Query for data fetching/caching
- MSAL for Azure AD login (when `AUTH_PROVIDER=aad`)
- Toast notifications for client-side error feedback

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
1. User visits `/auth/login` (or `/auth/dev` for dev shortcut)
2. Enters email/password
3. POST to `/auth/login` returns JWT
4. JWT stored via `utils/auth` helper in `localStorage`
5. If `mustChangePassword` is set, redirect to `/auth/change-password`
6. All API requests include `Authorization: Bearer <token>`; 401 clears token and redirects to `/auth/login`

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
- Client selector supports manual entry with datalist suggestions
- Opportunity create supports submission date/time and source/method inputs

### Data Fetching
- TanStack Query for all reads; mutations invalidate or refetch keys
- Loading and error states on every query/mutation
- Token from `utils/auth`; 401 -> redirect to `/auth/login`

## Visibility and Security

- Role-based visibility across modules
- Tenant scoping applied to queries
- Protected routes redirect to `/auth/login` when no token
- Record-level sharing for selected entities where applicable
