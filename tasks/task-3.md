# Task 3: Elevate Approvals & Notifications Workflow

## Context
`docs/approval.md`, `docs/approval_v2.md`, and `docs/notifications-plan.md` describe a sequential approval chain, reminders, and templated emails. We must confirm the services/UI reflect that narrative and then plan the remaining touches.

## Goals
1. Enforce sequential approvals (Go/No-Go → Working → Pricing → Final) with stage-specific "blocked reasons" and "next action" CTAs; ensure finalization locks artifacts and triggers the `approval-decision` template.
2. Add reminder banners/toasts for the final week (bond purchase, checklist readiness) and move away from the old SLA tick so the frequency matches the new digest approach.
3. Expand `NotificationsService` so it respects user/role/default routing, includes CTA metadata, and wires each template (`opportunity-created`, `approval-decision`, `bond-reminder`, etc.) with the shared branding helper; document this in `docs/notifications-plan.md`.
4. Update the UI and docs so the approvals inbox (`/approvals/review`) clearly shows the pending reviewer, blocked reason, and finalization CTA.

## Steps
1. Audit `apps/api/src/modules/approvals/approvals.service.ts` plus the approvals controllers/UI to confirm stage gating, notifications, and checklist sync exist; note any gaps versus the doc plan in `docs/checklist.md`.
2. Build or refine reminder logic (bond, portal). Consider hooking into the checklist update code to fire notifications/toasts when deadlines slip; document the reminder cadence in `docs/approval.md`.
3. Ensure `NotificationsService` dispatches the new templates with the CTA/payload data (the worker already renders them); verify the templates align with the doc-specified placeholders.
4. Extend `docs/api.md`, `docs/web.md`, and the memory bank entries to describe the multi-stage flow and the updated inbox; mark the checklist row as complete once the docs and code match.
