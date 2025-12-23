-- CreateTable
CREATE TABLE "MinistryTender" (
    "id" TEXT NOT NULL,
    "portal" TEXT NOT NULL,
    "tenderRef" TEXT,
    "title" TEXT,
    "ministry" TEXT,
    "publishDate" TIMESTAMP(3),
    "closeDate" TIMESTAMP(3),
    "requestedSectorType" TEXT,
    "tenderBondValue" DOUBLE PRECISION,
    "documentsValue" DOUBLE PRECISION,
    "tenderType" TEXT,
    "purchaseUrl" TEXT,
    "sourceUrl" TEXT,
    "status" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MinistryTender_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MinistryTender_portal_idx" ON "MinistryTender"("portal");

-- CreateIndex
CREATE INDEX "MinistryTender_tenderRef_idx" ON "MinistryTender"("tenderRef");

-- CreateIndex
CREATE UNIQUE INDEX "MinistryTender_portal_tenderRef_key" ON "MinistryTender"("portal", "tenderRef");

-- CreateIndex
CREATE UNIQUE INDEX "MinistryTender_portal_sourceUrl_key" ON "MinistryTender"("portal", "sourceUrl");
