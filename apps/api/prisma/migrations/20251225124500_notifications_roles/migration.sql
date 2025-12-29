-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationDigestMode" AS ENUM ('INSTANT', 'DAILY', 'WEEKLY', 'OFF');

-- CreateTable
CREATE TABLE "BusinessRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBusinessRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessRoleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBusinessRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "digestMode" "NotificationDigestMode" NOT NULL DEFAULT 'INSTANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRoutingDefault" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "activity" TEXT NOT NULL,
    "stage" TEXT,
    "userIds" TEXT[] NOT NULL,
    "businessRoleIds" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRoutingDefault_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "slaLastNotifiedLevel" TEXT,
ADD COLUMN     "slaLastNotifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Approval" ADD COLUMN     "approverIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "channel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "activity" TEXT,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "payload" JSONB,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "opportunityId" TEXT,
ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'default';

-- AlterTable (allow nullable for in-app notifications)
ALTER TABLE "Notification" ALTER COLUMN "to" DROP NOT NULL;
ALTER TABLE "Notification" ALTER COLUMN "subject" DROP NOT NULL;
ALTER TABLE "Notification" ALTER COLUMN "body" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "BusinessRole_tenantId_name_key" ON "BusinessRole"("tenantId", "name");

-- CreateIndex
CREATE INDEX "BusinessRole_tenantId_idx" ON "BusinessRole"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBusinessRole_userId_businessRoleId_key" ON "UserBusinessRole"("userId", "businessRoleId");

-- CreateIndex
CREATE INDEX "UserBusinessRole_businessRoleId_idx" ON "UserBusinessRole"("businessRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_activity_channel_key" ON "NotificationPreference"("userId", "activity", "channel");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRoutingDefault_tenantId_activity_stage_key" ON "NotificationRoutingDefault"("tenantId", "activity", "stage");

-- CreateIndex
CREATE INDEX "NotificationRoutingDefault_tenantId_idx" ON "NotificationRoutingDefault"("tenantId");

-- AddForeignKey
ALTER TABLE "UserBusinessRole" ADD CONSTRAINT "UserBusinessRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBusinessRole" ADD CONSTRAINT "UserBusinessRole_businessRoleId_fkey" FOREIGN KEY ("businessRoleId") REFERENCES "BusinessRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
