# Analytics

KPIs and model:

- Pipeline, hit rate (win%), velocity, pricing (margin waterfall), compliance, competitors
- Star schema with curated fact/dim tables:
  - Facts: `FactOpportunity`, `FactPricing`, `FactClarification`, `FactSubmission`, `FactOutcome`
  - Dimensions: `DimClient`, `DimDate`, `DimSector`, `DimUser`, `DimCompetitor`, `DimOEM`
- Power BI semantic model and scheduled refresh

Artifacts:
- Data dictionary
- Dashboard mockups and SLOs

Current exports
- GET `/analytics/export/awards.csv`
- GET `/analytics/export/opportunities.csv`
- `make pbi-export` downloads both into `./exports`


