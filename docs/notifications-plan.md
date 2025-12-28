# Notifications & Approvals Routing Plan

## Summary
Move notifications from a 60s SLA tick to an event-driven system with user-controlled channels (email/in-app), role-based routing, and admin-configurable defaults per activity and stage. Keep access control roles (`Role`) and introduce business roles for routing and approvals.

## Goals
- Reduce notification noise (no per-minute email spam).
- Deliver the right notification to the right people at the right time.
- Let users choose email vs in-app per activity.
- Let admins define defaults per activity/stage.
- Allow admins to create custom business roles.

## Business Roles (Routing Only)
Business roles are separate from access control roles.
- Bid Manager
- Team Member
- Project Manager
- Sales Manager
- Executive

Admins can add/edit/delete business roles.

## Routing Rules (Priority Order)
1. **Explicit users** (directly assigned in request/record).
2. **Explicit roles** (business roles assigned in request/record).
3. **Defaults** (admin-configured per activity/stage).

If no recipients are resolved, log the notification as `no_recipients` and skip sending.

## Activities & Triggers (v1)
Event-driven (no 60s spam). Examples:
- Opportunity created:
- Recipients: bid owners, business owner, and users with business roles: Executive + Sales Manager + Bid Manager.
- Review requested:
- Recipients: explicit user(s) or business roles on the approval request.
- Access request submitted:
- Recipients: admin users; email + in-app, honors notification preferences per admin role/tag.
- SLA thresholds:
  - Daily digest by default (configurable), not per-minute.
  - Immediate alerts only when entering a new SLA band (warn/alert/urgent).

## Preferences & Channels
Per-user preferences:
- Enabled channels: `email`, `in_app`.
- Per-activity opt-in/out.
- Digest mode for SLA alerts (daily/weekly/off).

## Data Model Changes (Prisma)
Add new tables:
- `BusinessRole` (admin-managed list)
- `UserBusinessRole` (many-to-many)
- `NotificationPreference`
- `Notification` (extend for in-app)
- `NotificationRecipient` (optional normalization, or embed `userId` + `channel`)
- `ActivityDefaultRouting` (admin-configured defaults per activity/stage)

Suggested fields (high level):
- `Notification`: id, type, channel, userId, status, subject, body, payload, createdAt, sentAt, readAt
- `NotificationPreference`: userId, channel, activity, enabled, digestMode
- `ActivityDefaultRouting`: activity, stage, defaultUserIds?, defaultRoleIds?

## Backend Tasks
1. Add Prisma models and migrations for business roles and notification system.
2. Implement notification routing resolver:
   - explicit users > roles > defaults.
3. Implement event emitters:
   - Opportunity create
   - Review request
   - Approval decisions (optional in v1)
4. Implement dispatch pipeline:
   - Create notification rows
   - Send emails via workers
   - Mark in-app notifications unread
5. Add admin APIs:
   - CRUD business roles
   - Assign roles to users
   - Set defaults per activity/stage
6. Add user APIs:
   - Get notifications
   - Mark read
   - Update preferences

## Frontend Tasks
1. Notifications UI:
   - Bell + unread count
   - Notifications inbox list
2. User preferences UI:
   - Channels per activity
   - Digest settings for SLA
3. Admin UI:
   - Manage business roles
   - Assign roles to users
   - Configure default routing per activity/stage

## Migration & Backfill
- Create default business roles listed above.
- Backfill: map existing users to business roles (admin-driven).
- Set default routing for opportunity creation and review request.

## Testing
- Routing precedence test (explicit user > role > default).
- Preference filtering (opt-out channel).
- SLA: only one notification per SLA band entry; daily digest.
- In-app unread count and mark-as-read.

## Rollout
1. Ship schema + APIs behind feature flag if needed.
2. Enable admin role config.
3. Enable notifications UI.
4. Switch SLA from per-minute to event/digest.
