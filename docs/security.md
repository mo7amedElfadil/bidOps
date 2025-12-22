# Security

Auth & RBAC
- Toggle provider via `AUTH_PROVIDER=local|aad`
  - local: email/password with argon2; JWT bearer on API; roles: ADMIN, MANAGER, CONTRIBUTOR, VIEWER
  - aad: OIDC login → API callback issues JWT; web handles `/auth/callback`
- Tenant scoping enforced on list/create/update (derived from JWT)
- Conditional Access and MFA enforced via AAD policy.

Transport & headers
- CORS allowed origin via `WEB_ORIGIN`
- helmet enabled for common security headers
- TLS terminated at gateway (prod)

Rate limiting
- Throttler configured; env: `RATE_LIMIT_TTL`, `RATE_LIMIT_LIMIT`

Secrets & config
- Dev: `.env`
- Prod: compose overrides and/or Azure Key Vault
- Keys and secrets rotated per runbook; no secrets stored in repo.

Audit
- Immutable audit on mutating endpoints; export/retention documented in `docs/ops.md`
- Storage immutability policies (write-once) can be enabled for retention needs.

Data residency & privacy
- All data hosted in Azure Qatar Central; at-rest and in-transit encryption.
- Row-level security (RLS) for sensitive commercial data.
- Follow portal ToS and robots.txt for collectors; throttling and scheduling applied.
- Data retention default: 5 years with external backups; policy configurable by admin.
- Bilingual content support: English and Arabic data entry.

