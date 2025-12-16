# Pricing

BoQ and approvals:

- BoQ items with unit cost, markup, unit price
- Vendor quotes with validity and lead time
- Margin guardrails and escalation (minimum margin enforced by `PRICING_MIN_MARGIN`)
- Approval chain: Legal → Finance → Executive
- Freeze and pack versioning
-
PricingPack structure (versioned):
- `version`, `base_cost`, `overheads`, `contingency`, `fx_rate`, `margins`, `total_price`, `approvals[]`
- Scenario pricing (what-if margins/FX) may be added in V2.

Endpoints
- BoQ: GET `/pricing/:opportunityId/boq`, POST `/pricing/:opportunityId/boq`, PATCH `/pricing/boq/:id`, DELETE `/pricing/boq/:id`
- Quotes: GET `/pricing/:opportunityId/quotes`, POST `/pricing/:opportunityId/quotes`, PATCH `/pricing/quotes/:id`
- Pack recalc: POST `/pricing/:opportunityId/pack/recalculate` (fails if margin < `PRICING_MIN_MARGIN`)
- Approvals: GET `/approvals/:packId`, POST `/approvals/:packId/bootstrap`, POST `/approvals/decision/:id`

Notes
- All endpoints tenant-scoped by JWT
- Audit entries recorded on mutations

