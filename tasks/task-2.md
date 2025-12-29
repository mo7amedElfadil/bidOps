# Task 2: Lock Down Opportunities & Pricing

## Context
`docs/checklist.md` and `docs/web.md` call out countdown rings, bilingual data entry, FX-aware pricing templates, and checklist/bond reminders, but the running UI/services need to be audited to confirm every capability is wired.

## Goals
1. Ensure opportunity CRUD supports bilingual fields, manual client entry, and collector-driven updates to the client/bid owner lists; include countdown timers + stage chips in both list and board views, and surface priority/rank filters with pagination on the backend.
2. Guarantee the pricing workspace supports templates (global or per-opportunity), Excel-style formulas (`=C2*D2`), live FX conversion back to QAR, margin guardrails, and vendor quotes; confirm submission pack builder respects status flags (bond purchased, compliance, etc.).
3. Tie the submission checklist (bond, uploads, compliance, clarifications, final PDF) to reminder banners/toasts in the UI when the deadline is within 7 calendar days; track mismatched tracker values as import issues and surface them in both the import wizard and the overview.
4. Update `docs/api.md`, `docs/web.md`, and the memory bank with any new endpoints/fields for checklist flags, countdowns, or FX rates; keep `docs/checklist.md` entries synchronized.

## Steps
1. Review `apps/api/src/modules/opportunities/opportunities.service.ts` to confirm fields for bilingual titles, countdown logic, and checklist updates already exist; add any missing DAO support (bid owner updates, countdown calculations, FX conversion).
2. On the UI side (`apps/web/src/pages/Opportunities/*`, pricing pages, overview tabs), verify countdown timers, milestone chips, and submission checklist visuals exist; add toasts/reminders nearly the same logic (color-coded ring) now defined in docs.
3. Check the tracker import (`apps/api/src/modules/import`) for issue logging; ensure clients/bid owners sync and that they resolve once fixed, as noted in `docs/checklist.md`.
4. Expand documentation (`docs/api.md`, `docs/web.md`) to list the checklist endpoints and FX/conversion notes. Confirm the memory bank (progress/activeContext) and `docs/checklist.md` mention this bundle of features.
5. Once the features align with the docs, mark the “Opportunities” row in `docs/checklist.md` as ✓ and note the updated docs that reflect the shipped behavior.
