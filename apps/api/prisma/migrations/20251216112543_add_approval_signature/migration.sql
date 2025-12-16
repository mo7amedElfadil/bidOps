-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'CONTRIBUTOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('LEGAL', 'FINANCE', 'EXECUTIVE');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OutcomeStatus" AS ENUM ('WON', 'LOST', 'WITHDRAWN', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "team" TEXT,
    "passwordHash" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "sector" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "ownerId" TEXT,
    "tenderRef" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sourcePortal" TEXT,
    "discoveryDate" TIMESTAMP(3),
    "submissionDate" TIMESTAMP(3),
    "status" TEXT,
    "stage" TEXT,
    "priorityRank" INTEGER,
    "daysLeft" INTEGER,
    "modeOfSubmission" TEXT,
    "bondRequired" BOOLEAN DEFAULT false,
    "bondAmount" DOUBLE PRECISION,
    "validityDays" INTEGER,
    "dataOwner" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoQItem" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT,
    "oem" TEXT,
    "sku" TEXT,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "markup" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoQItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorQuote" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "quoteNo" TEXT,
    "validity" TIMESTAMP(3),
    "leadTimeDays" INTEGER,
    "currency" TEXT,
    "files" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingPack" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "baseCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overheads" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contingency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fxRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "margin" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "type" "ApprovalType" NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "signedOn" TIMESTAMP(3),
    "signature" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outcome" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "status" "OutcomeStatus" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "winner" TEXT,
    "awardValue" DOUBLE PRECISION,
    "notes" TEXT,
    "reasonCodes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Outcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AwardStaging" (
    "id" TEXT NOT NULL,
    "portal" TEXT NOT NULL,
    "tenderRef" TEXT,
    "buyer" TEXT,
    "title" TEXT,
    "closeDate" TIMESTAMP(3),
    "awardDate" TIMESTAMP(3),
    "winners" TEXT[],
    "awardValue" DOUBLE PRECISION,
    "codes" TEXT[],
    "notes" TEXT,
    "rawPath" TEXT,
    "sourceUrl" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AwardStaging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AwardEvent" (
    "id" TEXT NOT NULL,
    "portal" TEXT NOT NULL,
    "tenderRef" TEXT,
    "buyer" TEXT,
    "title" TEXT,
    "awardDate" TIMESTAMP(3),
    "winners" TEXT[],
    "awardValue" DOUBLE PRECISION,
    "codes" TEXT[],
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AwardEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "hash" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceClause" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "section" TEXT,
    "clauseNo" TEXT,
    "requirementText" TEXT NOT NULL,
    "mandatoryFlag" BOOLEAN NOT NULL DEFAULT false,
    "response" TEXT,
    "status" TEXT,
    "evidence" TEXT,
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceClause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clarification" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "questionNo" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT,
    "submittedOn" TIMESTAMP(3),
    "responseOn" TIMESTAMP(3),
    "responseText" TEXT,
    "file" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clarification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Client_name_idx" ON "Client"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Client_name_tenantId_key" ON "Client"("name", "tenantId");

-- CreateIndex
CREATE INDEX "BoQItem_opportunityId_idx" ON "BoQItem"("opportunityId");

-- CreateIndex
CREATE INDEX "VendorQuote_opportunityId_idx" ON "VendorQuote"("opportunityId");

-- CreateIndex
CREATE INDEX "PricingPack_opportunityId_idx" ON "PricingPack"("opportunityId");

-- CreateIndex
CREATE INDEX "Approval_packId_idx" ON "Approval"("packId");

-- CreateIndex
CREATE INDEX "Outcome_opportunityId_idx" ON "Outcome"("opportunityId");

-- CreateIndex
CREATE INDEX "ComplianceClause_opportunityId_idx" ON "ComplianceClause"("opportunityId");

-- CreateIndex
CREATE INDEX "Clarification_opportunityId_idx" ON "Clarification"("opportunityId");

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoQItem" ADD CONSTRAINT "BoQItem_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorQuote" ADD CONSTRAINT "VendorQuote_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingPack" ADD CONSTRAINT "PricingPack_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_packId_fkey" FOREIGN KEY ("packId") REFERENCES "PricingPack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceClause" ADD CONSTRAINT "ComplianceClause_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clarification" ADD CONSTRAINT "Clarification_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
