# UAT Checklist

Use this list to validate the UAT build end-to-end. Run after `make rebuild-nc SERVICES="api web"` and `make up`.

## Setup
- [ ] `make db-reset && make db-seed` (admin@example.com seeded)
- [ ] `make up` and services healthy (api 4000, web 8080, grafana 3000, mailhog 8025)
- [ ] Web built with correct `WEB_API_URL` / `VITE_API_URL`

## Auth & Roles
- [ ] Dev login `/auth/dev` returns token; protected routes load
- [ ] Role-gated pages (upload/pricing/approvals) accessible only when role allows

## Opportunities & SLA
- [ ] Create/update opportunity; `daysLeft` recalculates
- [ ] Timeline view `/timeline` orders by submission date; SLA badges present
- [ ] SLA settings from `/settings/sla` reflected on timeline
- [ ] Opportunity overview shows client/stage/status and tab links

## Documents & Compliance
- [ ] Attachments upload/list; hash stored; search index not failing
- [ ] Attachment search `/search` returns uploaded files and links to owner
- [ ] Compliance: import sample PDF, edit clause, export CSV; verbatim text preserved
- [ ] Clarifications: add/edit, statuses change, export CSV

## Pricing & Approvals
- [ ] BoQ CRUD, vendor quotes added
- [ ] Margin guardrail enforced (below min blocked client+server)
- [ ] Recalculate pack creates new version
- [ ] Approvals chain bootstrap; approve/reject with remarks; signedOn set

## Submission Pack
- [ ] Build pack; checksum displayed; download link works
- [ ] Manifest/checksum aligns with included attachments

## Outcomes
- [ ] Set Won/Lost/Withdrawn/Cancelled with reason codes; persists

## Awards Collector & Curation
- [ ] `make collectors-run` completes (Qatar adapter enabled if configured)
- [ ] Staging view shows new rows with codes/source; curate to events
- [ ] Events view lists curated awards

## Analytics & Exports
- [ ] `/analytics/export/awards.csv` and `/analytics/export/opportunities.csv` download

## Observability
- [ ] Grafana dashboard loads (BidOps Overview); key panels populated
- [ ] Prometheus scrape targets healthy

## Regression/Smoke
- [ ] API health `/health` returns 200
- [ ] Web navigation: list → board → timeline → opportunity tabs (attachments/compliance/clarifications/pricing/approvals/submission/outcome)
- [ ] SLA settings editable; warn/alert/urgent thresholds persist

