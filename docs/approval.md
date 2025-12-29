# Approvals Lifecycle v2

This document captures the vision, workflow, instrumentation, and technical changes for the upgraded approvals experience. It is intended to guide both the product/consulting team and the engineers who execute the updates.

## Vision

Consultants need a single, obvious path from spotting a tender on Monaqasat through getting managerial buy-in, building the bid pack, and finally releasing a validated submission. Each role should know their “next action,” see why a stage is blocked, capture comments, and be reminded when the tender bond purchase or other checklist items are due. Approvals must be traceable, auditable, and gated by versioned artifacts so every decision can be revisited.

## 1. Audit + instrumentation

### Consultant roles today

| Role | Current entry point | Current CTA | What they struggle to see |
|------|---------------------|-------------|--------------------------|
| Sales/Manager | `/tenders/available`, `/tenders/available/:id` | None; they inspect the card and rely on manual notes | No Go/No-Go status chip, no place to leave a rational comment that Bid Owner sees |
| Bid Owner | Opportunity Overview → `/opportunity/:id/approvals` | “Start Approval Process” if empty; otherwise approve individual nodes | No blocked reason, no manager comment surfaced, no reminder about bond purchase |
| Pricing | `/opportunity/:id/pricing` then Approvals page | Approve pricing chain once found | No structured margin fields, no enforced link to pricing pack (attachments optional) |
| Executive/PM | `/approvals/:packId` (from Overview links) | Approve final signoff | No bond reminder or checklist, no change control visibility |

### Missing signals
- Go/No-Go status chip on the tender/opportunity card (Sales wants to know if a manager has greenlit work).  
- A persistent manager comment field visible to Bid Owner when a stage is pending (why is it waiting?).  
- “Blocked because…” badge next to disabled buttons (e.g., Pricing button grayed out with: “Awaiting Working Approval from Manager”).  
- Delivery reminder inside last week (“Purchase the tender bond now”) with a toggle that marks it completed.

### Next Action Map

| Role | Signal | Next action (primary CTA) | Where it lives | Why |
|------|--------|-------------------------|---------------|-----|
| Sales/Manager | Tender card status chip shows `Awaiting Go/No-Go` | Click `Request Work Approval` → modal with comment/attachments | `/tenders/available` | Kickstarts Go/No-Go and records rationale accessible to award team |
| Manager | Approval list shows `GO_NO_GO` in “In Review” | Approve/decline with comment | `/approvals/:packId` and new inbox | Greenlights or rejects the opportunity; note blockers for Bid Owner |
| Bid Owner | Working stage card says `Awaiting Manager approval` | Upload pricing pack + hit “Submit for Pricing Approval” | `/opportunity/:id/pricing` + Approvals page | Locks pricing artifacts and triggers next stage |
| Pricing/Finance | Pricing card ready → stage `PRICING` | Review margin metadata + approve with optional attachments | Approvals screen | Ensures pricing safeguards before final release |
| Executive/PM | Final stage `FINAL_SUBMISSION` shows checklist | Confirm bond/form checklist, approve final signoff | Approvals review page, opportunity Overview | Releases the submission to production, ensures bond purchased |

### Instrumentation plan

* Database additions: add `stage`, `approvalRequestedAt`, `approvalDecidedAt`, `reworkCount`, and `lateDecision` flags to the `Approval` model so we can report on every stage’s flow.  
* Metrics: capture `decisionLatency` (difference between requested and decided timestamps), tally rework cycles (counts of “Changes Requested”), and mark late approvals when decision occurs inside configurable window (e.g., ≤7 calendar days from submission).  
* Reporting: expose these metrics via a new optional endpoint `/analytics/approvals/summary` or aggregate them in logs to track high-impact improvements (time-to-decision, rework counts, late decisions).  
* UX instrumentation: surface the “Next action” CTAs and blocked reasons in the new UI (tons-of-calls to `toast` and status chips) so we can correlate exposures with faster approvals.

### Technical tasks
1. Map current flows:
   * Sales/Manager: Available Tenders list → click `Request Work Approval`? → see status chip.
   * Bid Owner: Once opportunity exists, Pricing/Approvals tabs show the existing chain.
   * Pricing/PM: Approvals page, toast reminders, submission actions.
2. Create a “Next Action Map” table that ties each role to the exact CTA, page, and reason. Publish this map in the new document and in the UI (tooltips, help text).
3. Instrument the backend:
   * Add `approvalRequestedAt`, `approvalDecidedAt`, `approvalStage`, `approvalChangeCount`.
   * Track `decisionLatency` (`DecidedAt - RequestedAt`), `reworks` per stage (number of “Changes Requested” cycles), `lateApprovals` (decision within configurable window before submission).
   * Surface these metrics via new analytics endpoint `/analytics/approvals/summary` or simply via database queries and logging for now.

## 2. Tender → Opportunity Go/No-Go Approval

### Data model additions
- `Approval.stage` enum: `GO_NO_GO`, `WORKING`, `PRICING`, `FINAL_SUBMISSION`, `CLARIFICATIONS`.
- `Approval.comment`, `Approval.attachments` (string[] or JSON), `Approval.requestedAt`, `Approval.decidedAt`, `Approval.reworkCount`, `Approval.lateDecision`.
- `Approval.sourceTenderId` (nullable FK to `MinistryTender`).
- `Opportunity.awaitingGoNoGo` (bool), `Opportunity.goNoGoStatus` (`PENDING|APPROVED|REJECTED`).

### Frontend tasks
1. Available Tenders list/card shows a primary CTA `Request Work Approval`.
2. Clicking it opens a modal collecting:
   * Optional rationale (text area, suggested text)
   * Optional attachments/notes (reuse UploadButton)
   * Submit button that creates the approval request.
3. Add a status chip (`Awaiting Go/No-Go`, `Go/No-Go Approved`, `Go/No-Go Rejected`) on the tender card and opportunity header.

### Backend tasks
1. Extend approval creation DTOs to accept:
   * `stage` enum: `GO_NO_GO`, `WORKING`, `PRICING`, `FINAL_SUBMISSION`, `CLARIFICATIONS`.
   * `sourceTenderId` (nullable, links to `MinistryTender`).
   * `comment`, `attachments[]` (optional metadata for audit).
2. Endpoint changes:
   * `POST /approvals/request` – raise Go/No-Go request from a tender; payload includes tender ID, optional comment/attachments, optional `assignBidOwnerIds`.
   * `POST /approvals/:packId/bootstrap` – accept staged approvals (GO_NO_GO first, then WORKING/PRICING/FINAL).
   * `POST /tenders/:id/promote` – now used only after Go/No-Go approval unless user has override permission.
3. Opportunity gating:
   * The opportunity is created with a flag `awaitingGoNoGo = true`.
   * Board filters hide opportunities until `Go/No-Go` approved (or show a dedicated lane).
   * Prevent bid work (boq/pricing/attachments) until `Go/No-Go` status flips.
4. SLA/escalation:
   * Scheduler reminder when `GO_NO_GO` remains pending >48h: enqueue notification to Manager and escalate to Director.
5. Audit:
   * Record `requestedAt`, `decidedAt`, `comment`, `attachments` on the approval.
   * Log `actorId`, `action`, and previous status in `AuditLog`.

### API payloads
```
POST /approvals/request
{
  "sourceTenderId": "uuid",
  "comment": "optional rationale",
  "attachments": ["attachmentId1", "attachmentId2"],
  "assignBidOwnerIds": ["userId1", "userId2"]
}
```

## 3. Multi-stage Approval Sequence

### Stage definitions
1. **WORKING** – Manager greenlight; includes resourcing, clarifications. Approve card shows comment/attachment and optional due-date for rework.
2. **PRICING** – Triggered after WORKING approved; pricing pack or attachment must exist. Stage collects structured metadata (target margin, final margin, discount notes, risk notes).
3. **FINAL_SUBMISSION** – Executive/PM signoff; confirms compliance, bond status, final PDF ready.

Each stage follows: `Draft → In Review → Changes Requested → Resubmitted → Approved / Approved w/ Conditions → Rejected → Superseded`.

### Backend enforcement
* Approvals table stores `stage`, `status`, `comment`, `changesRequestedDueDate`, `attachments`, `requestedAt`, `decidedAt`.
* Transition guard:
  - Cannot set PRICING to `In Review` until WORKING `Approved`.
  - Cannot set FINAL to `In Review` until PRICING `Approved`.
* Decision endpoint `/approvals/decision/:id` records comment, attachments, status, and optional `dueDate` when “Changes Requested”.
* On approval, record `artifactVersion` for pricing pack and lock associated artifacts.

### API payloads
```
POST /approvals/decision/:id
{
  "status": "APPROVED|REJECTED|CHANGES_REQUESTED|RESUBMITTED",
  "comment": "optional",
  "attachments": ["attachmentId1"],
  "changesRequestedDueDate": "YYYY-MM-DD"
}
```

### Frontend
* Approval card shows stage, type label, status, comment, attachments, and “Next action” CTA.
* “Changes Requested” renders required actions and due date; next approver can mark “Resubmitted.”
* Stage guard banners show “Blocked by <stage>” with responsible approver and last comment.
* Role-based CTA text:
  - Manager: “Approve Working Stage”
  - Finance: “Approve Pricing Stage”
  - Executive/PM: “Approve Final Submission”

## 4. Reminders & Submission Checklist

### Checklist
Add a checklist component on the Opportunity page and approvals review view listing:
1. Tender bond submitted (toggle + upload receipt)
2. Mandatory forms completed
3. Final combined PDF generated
4. Compliance created
5. Clarifications sent (or N/A)
6. Pricing approved (auto-checks once pricing approvals finish)

Each item stores `doneBy`, `doneAt`, `notes`, `attachment`.

### Reminders
* When submission < 7 days (configurable) and bond not marked done, show banner/toast on opportunity/approvals review.
* Track `bondReminderSentAt` to avoid duplicates.
* Additional reminders: “Internal review freeze” at T-3 and “Portal upload rehearsal” at T-2.

### API payloads
```
PATCH /opportunities/:id/checklist
{
  "bondPurchased": { "done": true, "attachmentId": "uuid", "notes": "optional" },
  "formsCompleted": { "done": false },
  "finalPdfReady": { "done": true },
  "complianceCreated": { "done": true },
  "clarificationsSent": { "done": false },
  "pricingApproved": { "done": true }
}
```

## 5. Locking/Change Control

Technical tasks:
* When PRICING/FINAL approval occurs, mark linked artifacts (pricing pack, attachments) as `versioned` and set `isLocked = true`.
* Introduce `ChangeRequest` model storing: `opportunityId`, `changes`, `impact`, `requestedBy`, `status`, `approverStage`.
* API `POST /change-requests` allows edits post-approval. Changes must go back to each stage (WORKING → PRICING → FINAL). On approval, mark previous baseline `Superseded`.
* UI shows change request status and link to new approval baseline.

### API payloads
```
POST /change-requests
{
  "opportunityId": "uuid",
  "changes": "text or diff summary",
  "impact": "cost/schedule/compliance notes",
  "requestedBy": "userId"
}
```

## 6. Role-based Workflow Clarity

### Inbox + cues
* Add an “Approvals Inbox” panel (e.g., `/approvals/review`) filtering by role/stage.
* Each tender/opportunity card has a status chip (Awaiting Go/No-Go, Working Approved, Pricing Pending, Ready to Submit).
* Blocked actions display “Blocked by [stage name] – awaiting [role] comment”.
* Single CTA per screen: Manager sees “Approve Working Stage”, Pricing sees “Submit Pricing Approval”, Executive sees “Finalize Submission”.

### Role mapping (front end + docs)
* Sales: collector → `Request Work Approval` → check Go/No-Go chip and comment.
* Manager: dedicated “Approvals awaiting me” list, comment box next to decision, option to assign bid owner and capture rationale.
* Bid Owner/Pricing: once Working approved, upload pricing pack, fill structured fields, and click submit for pricing approval.
* Executive/PM: final review, ensure checklist items like bond are complete before final approval.

## 7. Documentation & Memory Bank

Tasks:
1. Update `docs/api.md` with new endpoints (`/approvals/request`, enriched decision calls, checklist flags, change requests).
2. Expand `docs/web.md` with the “Next action map” and status chips.
3. Create or update `docs/ops.md` (or add `docs/workflows.md`) with the workflow playbook per role (“If you are X, click Y”).  
4. Add reminder logic and change request overview to `docs/memory-bank/activeContext.md`, `progress.md`, and `approval.md`.
5. Include screenshots or mockups showing the new home page cues, status chips, and checklist reminders.

## Implementation phases

1. Audit/instrumentation and doc updates (high value, low code).  
2. Backend schema/APIs plus enforcement (Go/No-Go, stages, checklist, change requests).  
3. Frontend UI (status chips, buttons, checklist, change request flows).  
4. Role-based messaging and reminders.  
5. Ops/test run and documentation finalization.  
