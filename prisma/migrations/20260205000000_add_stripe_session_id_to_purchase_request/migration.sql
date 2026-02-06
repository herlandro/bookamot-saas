-- AlterTable
ALTER TABLE "PurchaseRequest" ADD COLUMN "stripeSessionId" TEXT;

-- CreateIndex
CREATE INDEX "PurchaseRequest_stripeSessionId_idx" ON "PurchaseRequest"("stripeSessionId");
