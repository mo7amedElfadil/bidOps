# Task 5: Monitoring, Testing, and Documentation Closure

## Context
`docs/ops.md`, `docs/e2e-test-guide.md`, and `docs/checklist.md` call for consistent testing/monitoring procedures that mirror the evolving stack (Makefile targets, TypeScript builds, collector jobs, etc.).

## Goals
1. Confirm `make up`, `make logs`, `make db-migrate`, and related `make` targets work with the shared helper, `dist` folders, and the new collector scheduling so they can be documented reliably.
2. Expand `docs/ops.md` to describe the `shared` helper, monitoring toggles, log targets, and how the collectors/jobs interact with the queue.
3. Update `docs/e2e-test-guide.md` with steps for approvals, attachments, notifications, and reminders now captured in the checklist; mention the timeline for automated Playwright once available.
4. Keep `docs/checklist.md` and the memory bank entries updated as each test/monitoring milestone is verified.

## Steps
1. Run `make up`, `make logs`, `make db-migrate`, `pnpm --filter @itsq-bidops/api build`, and worker builds to ensure everything works; note any fragility so the docs can warn operators.
2. Document the log/monitoring targets and the shared helper’s role in `docs/ops.md`. Add a section referencing the new email/notification templates plus the plan to keep `docs/checklist.md` up to date.
3. Iterate `docs/e2e-test-guide.md` with the approvals/notification checks from `docs/checklist.md`, and mention how to rerun after modifications (Playwright once ready).
4. After each doc update, update `docs/checklist.md` row statuses so stakeholders can see progress without re-reading every file.
