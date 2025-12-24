-- Adjust user foreign keys so deleting a user cascades clean-up
ALTER TABLE "Opportunity" DROP CONSTRAINT IF EXISTS "Opportunity_ownerId_fkey";
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpportunityBidOwner" DROP CONSTRAINT IF EXISTS "OpportunityBidOwner_userId_fkey";
ALTER TABLE "OpportunityBidOwner" ADD CONSTRAINT "OpportunityBidOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
