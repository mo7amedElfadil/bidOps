-- Add original title storage for bilingual support
ALTER TABLE "AwardStaging" ADD COLUMN "titleOriginal" TEXT;
ALTER TABLE "AwardEvent" ADD COLUMN "titleOriginal" TEXT;
ALTER TABLE "MinistryTender" ADD COLUMN "titleOriginal" TEXT;
