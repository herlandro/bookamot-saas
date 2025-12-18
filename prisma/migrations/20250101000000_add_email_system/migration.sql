-- CreateEnum
CREATE TYPE "public"."EmailType" AS ENUM ('BOOKING_CONFIRMATION_CUSTOMER', 'BOOKING_NOTIFICATION_GARAGE', 'BOOKING_APPROVED', 'BOOKING_REJECTED', 'BOOKING_REMINDER_1_MONTH', 'BOOKING_REMINDER_1_WEEK', 'BOOKING_REMINDER_1_DAY', 'BOOKING_COMPLETED_FOLLOWUP');

-- CreateEnum
CREATE TYPE "public"."EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "public"."ScheduledEmailType" AS ENUM ('REMINDER_1_MONTH', 'REMINDER_1_WEEK', 'REMINDER_1_DAY');

-- CreateEnum
CREATE TYPE "public"."ScheduledStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."EmailLog" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "emailType" "public"."EmailType" NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "public"."EmailStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScheduledEmail" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "emailType" "public"."ScheduledEmailType" NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" "public"."ScheduledStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailLog_bookingId_idx" ON "public"."EmailLog"("bookingId");

-- CreateIndex
CREATE INDEX "EmailLog_recipientEmail_idx" ON "public"."EmailLog"("recipientEmail");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "public"."EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailLog_emailType_idx" ON "public"."EmailLog"("emailType");

-- CreateIndex
CREATE INDEX "EmailLog_createdAt_idx" ON "public"."EmailLog"("createdAt");

-- CreateIndex
CREATE INDEX "ScheduledEmail_bookingId_idx" ON "public"."ScheduledEmail"("bookingId");

-- CreateIndex
CREATE INDEX "ScheduledEmail_scheduledFor_idx" ON "public"."ScheduledEmail"("scheduledFor");

-- CreateIndex
CREATE INDEX "ScheduledEmail_status_idx" ON "public"."ScheduledEmail"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledEmail_bookingId_emailType_key" ON "public"."ScheduledEmail"("bookingId", "emailType");

-- AddForeignKey
ALTER TABLE "public"."EmailLog" ADD CONSTRAINT "EmailLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduledEmail" ADD CONSTRAINT "ScheduledEmail_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

