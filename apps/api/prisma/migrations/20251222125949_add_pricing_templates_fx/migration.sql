-- CreateEnum
CREATE TYPE "PricingWorkspace" AS ENUM ('BOQ', 'PACK');

-- CreateEnum
CREATE TYPE "PricingTemplateScope" AS ENUM ('GLOBAL', 'OPPORTUNITY');

-- AlterTable
ALTER TABLE "Approval" ADD COLUMN     "approverRole" TEXT,
ALTER COLUMN "approverId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "BoQItem" ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "unitCurrency" TEXT NOT NULL DEFAULT 'QAR';

-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "boqTemplateId" TEXT,
ADD COLUMN     "packTemplateId" TEXT;

-- CreateTable
CREATE TABLE "PricingPackRow" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitCurrency" TEXT NOT NULL DEFAULT 'QAR',
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPackRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workspace" "PricingWorkspace" NOT NULL,
    "scope" "PricingTemplateScope" NOT NULL DEFAULT 'GLOBAL',
    "columns" JSONB NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "opportunityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FxRate" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "rateToQar" DOUBLE PRECISION NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FxRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PricingPackRow_opportunityId_idx" ON "PricingPackRow"("opportunityId");

-- CreateIndex
CREATE INDEX "PricingTemplate_tenantId_idx" ON "PricingTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "FxRate_tenantId_idx" ON "FxRate"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "FxRate_currency_tenantId_key" ON "FxRate"("currency", "tenantId");

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_boqTemplateId_fkey" FOREIGN KEY ("boqTemplateId") REFERENCES "PricingTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_packTemplateId_fkey" FOREIGN KEY ("packTemplateId") REFERENCES "PricingTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingPackRow" ADD CONSTRAINT "PricingPackRow_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingTemplate" ADD CONSTRAINT "PricingTemplate_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
