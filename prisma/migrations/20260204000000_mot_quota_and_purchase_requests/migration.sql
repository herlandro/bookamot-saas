-- AlterEnum: add SUPER_ADMIN to UserRole
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- AlterTable: add motQuota to Garage
ALTER TABLE "Garage" ADD COLUMN "motQuota" INTEGER NOT NULL DEFAULT 0;

-- CreateEnum: PurchaseRequestStatus
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum: AdminNotificationType
CREATE TYPE "AdminNotificationType" AS ENUM ('GARAGE_PENDING', 'GARAGE_VALIDATION', 'MOT_PURCHASE_REQUEST');

-- CreateTable: PurchaseRequest
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "garageId" TEXT NOT NULL,
    "bankReference" TEXT NOT NULL,
    "amountPence" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 10,
    "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "approvedById" TEXT,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PurchaseRequestAuditLog
CREATE TABLE "PurchaseRequestAuditLog" (
    "id" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,

    CONSTRAINT "PurchaseRequestAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AdminNotification
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "type" "AdminNotificationType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- AlterEnum: add new EmailType values
ALTER TYPE "EmailType" ADD VALUE 'PURCHASE_REQUEST_NOTIFICATION';
ALTER TYPE "EmailType" ADD VALUE 'GARAGE_VALIDATION_REQUEST';
ALTER TYPE "EmailType" ADD VALUE 'PURCHASE_APPROVED';
ALTER TYPE "EmailType" ADD VALUE 'PURCHASE_REJECTED';

-- CreateIndex
CREATE INDEX "PurchaseRequest_garageId_idx" ON "PurchaseRequest"("garageId");
CREATE INDEX "PurchaseRequest_status_idx" ON "PurchaseRequest"("status");
CREATE INDEX "PurchaseRequest_requestedAt_idx" ON "PurchaseRequest"("requestedAt");

CREATE INDEX "PurchaseRequestAuditLog_purchaseRequestId_idx" ON "PurchaseRequestAuditLog"("purchaseRequestId");
CREATE INDEX "PurchaseRequestAuditLog_performedAt_idx" ON "PurchaseRequestAuditLog"("performedAt");

CREATE INDEX "AdminNotification_type_idx" ON "AdminNotification"("type");
CREATE INDEX "AdminNotification_readAt_idx" ON "AdminNotification"("readAt");
CREATE INDEX "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PurchaseRequestAuditLog" ADD CONSTRAINT "PurchaseRequestAuditLog_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
