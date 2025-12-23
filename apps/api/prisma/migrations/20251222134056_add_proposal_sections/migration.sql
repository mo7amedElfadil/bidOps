-- CreateTable
CREATE TABLE "ProposalSection" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "sectionNo" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourcePrompt" TEXT,
    "sourceAttachments" TEXT[],
    "provider" TEXT,
    "model" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProposalSection_opportunityId_idx" ON "ProposalSection"("opportunityId");

-- AddForeignKey
ALTER TABLE "ProposalSection" ADD CONSTRAINT "ProposalSection_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
