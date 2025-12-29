# Enhancements

## Architecture Plan (Sequential Implementation)

**1. Search & Pagination**
- Expand every list endpoint (opportunities, awards, tenders, attachments, users) so the `q` filter touches every visible text column (`title`, `client`, `status`, `stage`, `team`, notification names, etc.) with case-insensitive `contains` semantics.
- Normalize pagination by creating shared `PaginationControls` (Prev/Next + manual “Go to page” + display totals) used across tables and ensure search/filter inputs reset the page and immediately refetch so the manual selection stays aligned with the current dataset.
- Optionally wire future keyword-intensive views to OpenSearch once available, but keep exact/substring matching from Postgres as the baseline.

**2. Timeline & Kanban (Gantt Overhaul)**
- Replace the ad-hoc Gantt wrapper with a dedicated library that supports draggable cards, adjustable columns (Name, From, To), SLA-threshold coloring, auto-scroll when dragging outside the viewport, and export-to-image (PNG/PDF) buttons.
- Build a reusable `TimelineGantt` component that houses the toolbar (zoom/pan controls, wrap toggle, export button), legend/threshold details, and the opportunity link behavior (cards navigate to detail pages).
- Ensure wrap toggles work reliably (affecting Name column text only) and allow users to resize the Name + date columns via drag handles with viewport-height defaults so columns fit within the screen but can expand when needed.

**3. Queue Services**
- Route long-running jobs (collectors, tracker imports, pricing recalculations, analytics exports) through the existing BullMQ queue instead of running them inline; add helpers for enqueuing and monitoring job status.
- Expose a `GET /jobs` endpoint so the UI can show running/completed/failed jobs, include actionable retry buttons, and feed this into dashboards (e.g., collectors page, import wizard).
- Document job queue usage in `docs/ops.md` so operators know how to trigger, monitor, and troubleshoot async workloads.

**4. User Management & Notifications**
- Update the Users admin page to support cross-page search, multi-select delete/curate, and bulk confirmations while keeping personal notification preferences in `/account`.
- Ensure admin flows only control tenant-wide defaults (business roles, routing defaults), while `/account` surfaces profile updates, password change links, and notification preferences tied to the current user.

**5. Documentation/Operational Updates**
- Keep `docs/approval_v2.md`, `docs/web.md`, and `docs/ops.md` aligned with the new flows: mention the shared pagination controls, queue-backed collectors/imports, new Gantt timeline expectations, bulk user actions, and `make down` behavior that preserves volumes.
- Update the Memory Bank `progress.md` (and `activeContext` if needed) once each feature completes so future sessions know what shipped.
