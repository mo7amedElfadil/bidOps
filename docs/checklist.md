# Feature Checklist & Plan

This document tracks the remaining work across collectors, opportunities, approvals, notifications, and infrastructure. I’ll keep it updated as each item is verified, wired, or documented.

## Implementation Checklist

| Category | Description | Status | Notes / Next Doc Updates |
| --- | --- | --- | --- |
| Monaqasat collectors | Date-range filtering against awarded/available endpoints, English locale enforcement, pagination + dedupe, export-ready CSV so Power BI pulls can stay consistent. | ⚠️ Pending | `docs/ingest.md` already outlines the adapter framework; keep it in sync with new parameters/CSV contracts. |
| Opportunities | CRUD, countdown timers, bilingual-friendly fields, manual client input + collector sync, FX conversion / pricing templates, checklist reminders (bond, uploads) with timer color cues + exports. | ⚠️ In progress | `docs/web.md`, `docs/api.md`, and memory bank SHOULD describe the checklist and SLA gating once final. |
| Approvals + workflow | Multi-stage sequence (Go/No-Go → Working → Pricing → Final), change requests, reminders (bond + portal), finalize/submit path with AI extraction/attachments and status chips. | ⚠️ In progress | `docs/approval.md`, `docs/approval_v2.md`, `docs/web.md`, and `docs/api.md` need updates for the refined processes. |
| Notifications & onboarding | Business roles, verbose user management (invite/signup flows, onboarding checklist), notification defaults + preferences, templated emails, in-app inbox, SLA digest, clear plan for email throttling and finalization notifications. | ⚠️ Pending | Document UI flows in `docs/notifications-plan.md` + roadmap in `docs/user-management-plan.md` and `docs/web.md`. |
| Documentation & memory bank | Keep `docs/api.md`, `docs/web.md`, `docs/ingest.md`, `docs/ops.md`, `docs/notifications-plan.md`, and every memory-bank file aligned with the latest architecture/rollouts. | ⚠️ Ongoing | Add evidence of updates to `docs/checklist.md` as items land. |
| Testing & automation | End-to-end guide updates (Playwright once installed), TypeScript builds for API/workers, `make` targets logging + monitoring, collector job coverage. | ⚠️ Ongoing | Expand `docs/e2e-test-guide.md` alongside the rollout of each feature. |

## Plan for Missing Features

1. **Finish collector stabilization (Monaqasat awards + available tenders):**
   * Ensure date-range filters loop through pages until the requested window or the configured max so datasets aren’t truncated.
   * Force English locale and translate Arabic titles while persisting originals.
   * Deduplicate on `(portal, tenderRef)` or `(portal, sourceUrl)`, update client table, and emit CSV exports for Power BI imports.
   * Document the new parameters (fromDate/toDate, page limits) in `docs/ingest.md`.

2. **Solidify opportunities + pricing pillars:**
   * Wire client/bid owner updates, status chips, countdown rings, and bilingual data entry into the pipeline UI.
   * Guarantee pricing templates include Excel-style FX conversion, guardrails, margin defaults, custom columns, and AI-assisted proposal drafts.
   * Tie submissions to the new checklist (bond reminder, uploads). If data is missing, preserve issues in the tracker import UI and notify users in the table.
   * Update `docs/api.md` and `docs/web.md` with the new fields, filters, and endpoints once they are stable.

3. **Amp up approvals & notifications:**
   * Enforce sequential approvals (Go/No-Go, Working, Pricing, Final) with blocked reasons, “next action” labels, change requests, and finalization signing.
   * Add reminder banners/toasts for close deadlines and bond purchases plus an SLA-backed digest (less spammy than the old 60s tick).
   * Ensure `NotificationsService` routes user/role/default recipients and wires each template (`opportunity-created`, `approval-decision`, `bond-reminder`, etc.) with `APP_BASE_URL`, logo, socials, and CTA metadata.
   * Document flows in `docs/approval.md`, `docs/approval_v2.md`, `docs/notifications-plan.md`, and mirror them in the memory bank.

4. **Complete onboarding + user/task experiences:**
   * Define business roles vs. access roles, allow admins to create defaults, and expose preferences in the `/account` panel.
   * Productionize the invite/signup flows, include email verification, and log every notification (email + in-app) while respecting digest preferences.
   * Revisit the mega menu / navigation to make the personal User group (Account/Notifications) separate from Admin tools.
   * Record the onboarding experiences in `docs/user-management-plan.md`, `docs/web.md`, and `docs/memory-bank/activeContext.md`.

5. **Monitoring, tests, documentation:**
   * Confirm `make up`, `make logs`, `make db-migrate`, and the TypeScript builds run cleanly with the new directories and helper shared across packages.
   * Update `docs/ops.md` with any new `make` targets (logs, monitoring toggle, collector jobs) plus mention the `shared` helper and email template contract.
   * Expand `docs/e2e-test-guide.md` with checklist steps for approvals, attachments, and notifications; reference `docs/checklist.md` as the single source of truth for remaining work.

As each item is verified, mark the Status column above and add the relevant doc updates; once everything is green, we can circle back and remove this checklist (or reduce it to maintenance notes). Let me know if you want me to begin with one specific bucket. 
