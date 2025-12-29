-- CreateEnum
CREATE TYPE "ChangeRequestStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ApprovalStatus" ADD VALUE 'IN_REVIEW';
ALTER TYPE "ApprovalStatus" ADD VALUE 'CHANGES_REQUESTED';
ALTER TYPE "ApprovalStatus" ADD VALUE 'RESUBMITTED';
ALTER TYPE "ApprovalStatus" ADD VALUE 'APPROVED_WITH_CONDITIONS';

-- AlterTable
ALTER TABLE "Approval" ADD COLUMN     "changesRequestedDueDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "bondReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "portalRehearsalReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "reviewFreezeReminderSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ChangeRequest" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "requestedById" TEXT,
    "status" "ChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "changes" TEXT NOT NULL,
    "impact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityChecklist" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "bondPurchased" BOOLEAN NOT NULL DEFAULT false,
    "bondPurchasedAt" TIMESTAMP(3),
    "bondPurchasedById" TEXT,
    "bondPurchaseAttachmentId" TEXT,
    "formsCompleted" BOOLEAN NOT NULL DEFAULT false,
    "formsCompletedAt" TIMESTAMP(3),
    "formsCompletedById" TEXT,
    "formsAttachmentId" TEXT,
    "finalPdfReady" BOOLEAN NOT NULL DEFAULT false,
    "finalPdfReadyAt" TIMESTAMP(3),
    "finalPdfReadyById" TEXT,
    "finalPdfAttachmentId" TEXT,
    "portalCredentialsVerified" BOOLEAN NOT NULL DEFAULT false,
    "portalCredentialsVerifiedAt" TIMESTAMP(3),
    "portalCredentialsVerifiedById" TEXT,
    "portalCredentialsAttachmentId" TEXT,
    "notes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChangeRequest_opportunityId_idx" ON "ChangeRequest"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityChecklist_opportunityId_key" ON "OpportunityChecklist"("opportunityId");

-- AddForeignKey
ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityChecklist" ADD CONSTRAINT "OpportunityChecklist_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
