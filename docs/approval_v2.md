# Approval v2 Playbook

## Context & Motivation
* `docs/approval.md` describes the ideal flow: Go/No-Go → Working → Pricing → Final Submission, role‑specific CTAs, checklist sync, and event‑driven reminders. Today the UI simply lists approval rows, the review page is passive, finalization doesn’t signal anything, and there are no in‑app notifications, so users still “run loops” to find their next action.
* The goal of **Approval v2** is to make approvals user friendly by: highlighting the pending stage, surfacing blocked reasons/next steps, turning `/approvals/review` into an actionable inbox, enabling a finalization path that updates the checklist and opportunity stage, and emitting in-app notifications whenever a request, decision, or finalization occurs.

## Success Criteria
1. Each approval card shows who needs to act next, why it’s blocked (if applicable), and uses role‑specific labels (“Approve Working Stage,” “Review Pricing,” etc.).
2. The review page is a true inbox: queue filtering, clear next approver, actionable buttons, and a working finalize button that only enables after all necessary approvals and updates checklist/ stage.
3. In-app notifications (via `/notifications`) are created for request submissions, decisions (approved/changes/rejected), and finalization events so users get alerts.
4. The checklist automatically marks pricing-approved when finalize runs and add manual toggles for compliance/clarifications, while portal credentials entry is hidden from the UI but kept for backward compatibility.

## High-Level Implementation Plan

### 1. Audit & data alignment
* Confirm Prisma models (OpportunityChecklist, Approval, Notification) already have the necessary fields. If not, create migrations.
* Map each approval stage to an in-app “activity” string so notifications can reference `NotificationActivities`.
* Update DTOs (approval decisions, checklist) if extra metadata is needed (blockedReason, stage label, etc.).

### 2. Backend behavior
* Extend `ApprovalsService` to:
  * Compute “next required approval” along the ordered stages and include reasons for blocking (e.g., “Waiting for Legal signoff”).
  * Emit notifications whenever `requestWorkApproval`, `decision`, or `finalize` runs (including channel metadata) through `NotificationsService.dispatch`.
  * Ensure `finalize` transitions opportunity stage/status, marks checklist `pricingApproved`, and optionally sends notifications to interested business roles.
* Update controllers/services to return enriched payloads so the UI gets the queue + next step context and notification metadata.

### 3. UI improvements
* `/approvals/:id` – show stage headers, next action CTA, comment history, and indicate responsible approver. Buttons should change label per role/stage as described in the docs.
* `/approvals/review` – turn into an inbox: show each pack’s next pending approval, allow filtering `mine/all`, include finalize button logic (enable only when stage ready). Provide quick links to opportunity overview, mark actions taken, and show whether pricing/compliance/bond checklist items are satisfied.
* Add toast/banner indicating blocked reason (e.g., “Pricing stage waits on Finance”).
* Keep portal credentials checkbox hidden but still available via API in case older trackers rely on it.

### 4. Notifications
* Define new `NotificationActivities` entries (`APPROVAL_REQUESTED`, `APPROVAL_DECISION`, `FINALIZATION_COMPLETED`).
* Hook into `NotificationsService.dispatch` inside the approval service methods with payloads describing the stage, approval title, and opportunity ID.
* Ensure the frontend review page retrieves `/notifications` or subscribes to the new activity (possibly via existing inbox UI) so users see alerts.

### 5. Coordination & docs
* Update `docs/approval.md` to reflect the new UI cues, notification flows, and finalize behavior.
* Write `docs/approval_v2.md` to track this plan (done) plus ongoing implementation notes.
* Adjust `docs/web.md`/`docs/api.md` as necessary to describe new endpoints/responses.

## Immediate Next Steps
1. Expand the approvals query to include `nextStage`, `blockedReason`, and which role owns it; surface this in the review page.
2. Wire `ApprovalsService.finalize` to emit notifications and toggle pricing checklist, confirming the UI handshake updates.
3. Implement in-app notification dispatch + UI hook so users receive approval-related alerts.

Once these steps are underway, continue with the UI polish, checklist sync, and documentation updates listed above.

## Implementation checklist (current sprint)

| Phase | Outcome | Notes |
|-------|---------|-------|
| Backend metadata | `review` payload returns `nextStageLabel`, `nextActionLabel`, `blockedReason`, `readyToFinalize`, and `assignedToMe`; finalize updates opportunity stage + checklist | Ensures the UI can show “blocked by” cues and only enable finalize when every approval is green |
| Notifications | `finalize`, `decision`, and `request` dispatches include `actionUrl`/`actionLabel`, stage-specific subjects, and the new `NotificationActivities` values so inbox/email links stay actionable | Powers the inbox badge, quick links, and email template button |
| Bid review UX | `/approvals/review` renders stage chips, next action copy, “Assigned to you”, blocked reasons, and finalization CTA that lights up only when `readyToFinalize` | Provides a focused inbox with a clear path (Start → Approve → Finalize) |
| Opportunity approvals | Opportunity detail shows the current stage banner, stage gates, approval list sorted by stage, and role-specific CTAs; `Start Approval Process` only appears when no approvals exist | Aligns the in-context workflow with the inbox |
| Checklist sync | Finalization toggles `pricingApproved`, while compliance/clarifications remain hand-checked and the legacy portal credentials flag is hidden in the UI | Keeps submission readiness signals accurate without losing schema compatibility |
| Inbox & emails | Actionable email template renders a button with the `actionUrl` (fallback plaintext) and `/notifications` inbox pulls in these entries | Users can go from email/button to the relevant page immediately |

## Outstanding scope (future iterations)

- **Search + pagination**: Tables need manual page selection, cross-page keyword search, and case-insensitive substring matching (optionally vector-backed once the search index is wired).
- **Timeline & Kanban**: Swap to a dedicated Gantt library, add adjustable columns, enforce column viewport height defaults, auto-scroll when dragging, color bars by SLA thresholds, allow export, and ensure cards link to their detail page.
- **Collector & job queue**: Queue long-running processes (collectors, pricing recalcs, large exports) via BullMQ; surface job statuses/alarm logs when connectors fail; ensure systems like SLA tick run safely in the queue.
- **User management**: Allow multi-select delete/curate, handle cascading relations (opportunity owners/approvals), and keep personal notification preferences under `/account` while admin controls tenant-wide defaults.
- **Ops & docs**: Synchronize `docs/ops.md` with the `make down` change that preserves volumes and document the new queue/notification behaviors so future maintainers can run the stack reliably.
