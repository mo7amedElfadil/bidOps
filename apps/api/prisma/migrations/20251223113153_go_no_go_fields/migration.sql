-- AlterTable
ALTER TABLE "Approval" ADD COLUMN     "sourceTenderId" TEXT;

-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "goNoGoStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "goNoGoUpdatedAt" TIMESTAMP(3);
