# User Management & Auth Plan

## Goals
- Make onboarding simple, predictable, and auditable for every user type.
- Support both local auth (dev/early prod) and AAD OIDC (future prod).
- Provide admin-grade user lifecycle management (invite, activate, disable, reset password).
- Enforce password policy + first-login change for the default admin.
- Separate access control roles from business roles (routing + approvals).

## Current State (Audit Summary)
- Local auth endpoints exist: `/auth/register`, `/auth/login`, `/auth/dev-login`.
- AAD OIDC strategy scaffolded but not actively used.
- Admin user management UI exists (`/admin/users`), but no self-service password change or reset.
- Business roles exist for routing approvals/notifications; access roles still RBAC-based.
- Prisma seed creates `admin@example.com` (no password).

## Target User Types (Business Roles)
- Bid Manager, Team Member, Project Manager, Sales Manager, Executive.
- Business roles drive approvals + notifications.
- Access roles (`ADMIN | MANAGER | CONTRIBUTOR | VIEWER`) remain for permissions.

## Onboarding Flows

### 1) Admin-initiated invite (default path)
1. Admin creates user (name, email, role, business roles).
2. System sends invite email with a single-use token.
3. User sets password, updates profile, chooses notification preferences.
4. First login complete → lands on dashboard + “next actions”.

### 2) Self-service signup (optional, admin approval)
1. User signs up via `/auth/register` with email + password.
2. Account set to `pending` until admin approves.
3. Admin assigns role + business roles → activation email sent.

### 3) Default admin bootstrap
- Default admin: `elfadil@it-serve.qa`
- Default password: `P@ssword1`
- Must change on first login (forced).
- Admin can change this password from the app.

## User Lifecycle & Interaction
- **Active**: normal access.
- **Disabled**: can’t login.
- **Pending Invite**: invite issued, password not set.
- **Pending Approval** (if self-signup enabled): no access until approved.

User interactions in the platform:
- Notifications: by activity + role defaults.
- Approvals: visible in “My queue.”
- Opportunity actions: owners + bid owners get alerts on create/review.

## Backend/API Changes (Planned)
- Add `UserStatus` enum: `ACTIVE | DISABLED | INVITED | PENDING`.
- Add `passwordChangedAt`, `lastLoginAt`, `mustChangePassword`.
- Add `InviteToken` model (hash, expiresAt, usedAt).
- Add `PasswordResetToken` model (hash, expiresAt, usedAt).
- Add `AuditLog` entries for user lifecycle actions.

### Auth endpoints (new/updated)
- `POST /auth/invite` (admin) → create invite + send email.
- `POST /auth/accept-invite` → set password + activate.
- `POST /auth/forgot-password` → send reset link.
- `POST /auth/reset-password` → set new password.
- `POST /auth/change-password` → self-service change (current + new).
- `PATCH /users/:id/status` → admin toggle (active/disabled).

### Default admin bootstrap
On API startup:
- If no admin exists for `default` tenant, create `elfadil@it-serve.qa`
  with password `P@ssword1` and `mustChangePassword = true`.
- Make these configurable via env (defaults remain as required).

## Frontend Changes (Planned)
- Add login + signup pages (non-dev):
  - `/auth/login`
  - `/auth/signup` (if enabled)
  - `/auth/accept-invite/:token`
  - `/auth/forgot-password`
  - `/auth/reset-password/:token`
- Add “Change Password” in user profile settings.
- Admin user management:
  - Resend invite, reset password, disable/enable user.
  - Assign business roles + access role.
  - View last login + status badges.

## Password & Security Policies
- Minimum length 8 with numbers + symbols.
- Force reset on first login for default admin.
- Rate limit login + invite + reset endpoints.
- Invalidate tokens after use; expire after 24 hours.

## Email / Notification Integration
- Invite + reset emails via Mailhog in dev; SMTP in prod.
- Users choose email/in-app for auth-related notifications.

## Testing & Validation
- Unit test auth token flows and password reset.
- E2E happy path: invite → accept → login → change password.
- Ensure disabled users cannot login.
- Verify default admin is created only once.

## Rollout
1. Add schema changes + migrations.
2. Implement backend endpoints + seed/default admin bootstrap.
3. Build frontend auth + admin management flows.
4. Update docs + memory bank; run UAT checklist.
