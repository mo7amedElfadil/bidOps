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
