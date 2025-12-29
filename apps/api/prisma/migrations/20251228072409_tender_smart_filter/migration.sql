-- CreateEnum
CREATE TYPE "TenderScope" AS ENUM ('ITSQ', 'IOT_SHABAKA', 'OTHER');

-- CreateEnum
CREATE TYPE "TenderClassificationRunType" AS ENUM ('COLLECTOR', 'REPROCESS');

-- CreateTable
CREATE TABLE "TenderActivity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "TenderScope" NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "negativeKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weight" DOUBLE PRECISION,
    "isHighPriority" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenderActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderClassification" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "classificationVersion" INTEGER NOT NULL DEFAULT 1,
    "score" INTEGER NOT NULL,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "matchedActivityIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "matchedScopes" "TenderScope"[] DEFAULT ARRAY[]::"TenderScope"[],
    "matchedKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenderClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderClassificationRun" (
    "id" TEXT NOT NULL,
    "runType" "TenderClassificationRunType" NOT NULL,
    "classificationVersion" INTEGER NOT NULL,
    "rangeFrom" TIMESTAMP(3),
    "rangeTo" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "stats" JSONB,
    "triggeredBy" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'default',

    CONSTRAINT "TenderClassificationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenderActivity_tenantId_idx" ON "TenderActivity"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenderActivity_tenantId_name_key" ON "TenderActivity"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TenderClassification_tenderId_key" ON "TenderClassification"("tenderId");

-- CreateIndex
CREATE INDEX "TenderClassification_tenantId_idx" ON "TenderClassification"("tenantId");

-- CreateIndex
CREATE INDEX "TenderClassificationRun_tenantId_idx" ON "TenderClassificationRun"("tenantId");

-- CreateIndex
CREATE INDEX "ChangeRequest_status_idx" ON "ChangeRequest"("status");

-- CreateIndex
CREATE INDEX "OpportunityChecklist_opportunityId_idx" ON "OpportunityChecklist"("opportunityId");

-- AddForeignKey
ALTER TABLE "TenderClassification" ADD CONSTRAINT "TenderClassification_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "MinistryTender"("id") ON DELETE CASCADE ON UPDATE CASCADE;
