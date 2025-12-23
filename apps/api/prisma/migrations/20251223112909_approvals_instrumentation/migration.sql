-- CreateEnum
CREATE TYPE "ApprovalStage" AS ENUM ('GO_NO_GO', 'WORKING', 'PRICING', 'FINAL_SUBMISSION', 'CLARIFICATIONS');

-- AlterTable
ALTER TABLE "Approval" ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "decidedAt" TIMESTAMP(3),
ADD COLUMN     "lateDecision" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requestedAt" TIMESTAMP(3),
ADD COLUMN     "reworkCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stage" "ApprovalStage" NOT NULL DEFAULT 'GO_NO_GO';
