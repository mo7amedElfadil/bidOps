-- CreateTable
CREATE TABLE "OpportunityBidOwner" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityBidOwner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpportunityBidOwner_userId_idx" ON "OpportunityBidOwner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityBidOwner_opportunityId_userId_key" ON "OpportunityBidOwner"("opportunityId", "userId");

-- AddForeignKey
ALTER TABLE "OpportunityBidOwner" ADD CONSTRAINT "OpportunityBidOwner_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityBidOwner" ADD CONSTRAINT "OpportunityBidOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
