# Task 4: Complete Onboarding & Notification Preferences

## Context
`docs/user-management-plan.md`, `docs/web.md`, and `docs/notifications-plan.md` describe business roles, invite/signup flows, notification defaults, and the distinction between Account vs. Admin settings. We need to verify the code matches the docs and plan the outstanding enhancements.

## Goals
1. Make sure admins can create business roles, set defaults per activity/stage, and share invite links (documented in `docs/user-management-plan.md`).  
2. Ensure the UI separates tenant-wide Admin logic (default routing, business roles) from personal User settings (Account page, notification preferences) as described in `docs/web.md`.
3. Confirm notification routing respects user preferences (email/digest/in-app) and business-role defaults while logging each notification for transparency.
4. Document the onboarding flow steps plus notification preferences in the memory bank (`activeContext.md`) so the execution plan is traceable.

## Steps
1. Review `apps/api/src/modules/notifications` and `apps/web/src/pages/Notifications` to confirm business role management and preference toggles already exist; note any missing doc references in `docs/checklist.md`.
2. Audit `apps/api/src/auth` for invite/signup flows and ensure they deliver templated emails + tokens as the docs describe. Highlight required doc updates where gaps appear.
3. Update `docs/user-management-plan.md`, `docs/web.md`, and `docs/notifications-plan.md` with any missing steps (invite link copy, user approval workflow, default vs. personal preferences).
4. Once the flows are aligned and documented, mark the notifications/onboarding row in `docs/checklist.md` as resolved.
