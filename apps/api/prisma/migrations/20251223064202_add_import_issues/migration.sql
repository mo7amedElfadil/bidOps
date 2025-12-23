-- CreateTable
CREATE TABLE "ImportIssue" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "columnName" TEXT,
    "rowIndex" INTEGER NOT NULL,
    "rawValue" TEXT,
    "message" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportIssue_opportunityId_idx" ON "ImportIssue"("opportunityId");

-- CreateIndex
CREATE INDEX "ImportIssue_fieldName_idx" ON "ImportIssue"("fieldName");

-- AddForeignKey
ALTER TABLE "ImportIssue" ADD CONSTRAINT "ImportIssue_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
