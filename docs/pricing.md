# Pricing

BoQ and approvals:

- BoQ items with unit cost, markup, unit price
- Custom columns and formulas (Excel-style references like `=C2*D2`)
- Pricing pack worksheet rows with editable columns
- Global pricing templates and opportunity-specific templates
- FX rates table (base currency QAR) with live conversion for totals
- Vendor quotes with validity and lead time
- Margin guardrails and escalation (minimum margin enforced by `PRICING_MIN_MARGIN`)
- Approval chain: Legal → Finance → Executive
- Simple signer approval captured from assigned PM/Executive
- Freeze and pack versioning
PricingPack structure (versioned):
- `version`, `base_cost`, `overheads`, `contingency`, `fx_rate`, `margins`, `total_price`, `approvals[]`
- Scenario pricing (what-if margins/FX) may be added in V2.

Endpoints
- BoQ: GET `/pricing/:opportunityId/boq`, POST `/pricing/:opportunityId/boq`, PATCH `/pricing/boq/:id`, DELETE `/pricing/boq/:id`
- Pack rows: GET `/pricing/:opportunityId/pack-rows`, POST `/pricing/:opportunityId/pack-rows`, PATCH `/pricing/pack-rows/:id`, DELETE `/pricing/pack-rows/:id`
- Quotes: GET `/pricing/:opportunityId/quotes`, POST `/pricing/:opportunityId/quotes`, PATCH `/pricing/quotes/:id`
- Pack recalc: POST `/pricing/:opportunityId/pack/recalculate` (fails if margin < `PRICING_MIN_MARGIN`)
- Approvals: GET `/approvals/:packId`, POST `/approvals/:packId/bootstrap`, POST `/approvals/decision/:id`
- Templates: GET `/pricing/templates` (workspace, opportunityId), POST `/pricing/templates`, PATCH `/pricing/templates/:id`, DELETE `/pricing/templates/:id`
- FX rates: GET `/settings/fx-rates`, POST `/settings/fx-rates`

Notes
- All endpoints tenant-scoped by JWT
- Audit entries recorded on mutations
