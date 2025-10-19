-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('EXPIRING_SOON', 'EXPIRED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."MotNotification" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "daysUntilExpiry" INTEGER,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MotNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MotNotification_userId_isRead_idx" ON "public"."MotNotification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "MotNotification_vehicleId_idx" ON "public"."MotNotification"("vehicleId");

-- AddForeignKey
ALTER TABLE "public"."MotNotification" ADD CONSTRAINT "MotNotification_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MotNotification" ADD CONSTRAINT "MotNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
