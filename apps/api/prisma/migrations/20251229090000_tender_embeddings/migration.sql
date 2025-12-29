CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "TenderActivity"
  ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

ALTER TABLE "MinistryTender"
  ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
