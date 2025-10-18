/*
  Warnings:

  - You are about to drop the `GarageAvailability` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[registration,ownerId]` on the table `Vehicle` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."GarageAvailability" DROP CONSTRAINT "GarageAvailability_garageId_fkey";

-- DropIndex
DROP INDEX "public"."Vehicle_registration_key";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- DropTable
DROP TABLE "public"."GarageAvailability";

-- CreateTable
CREATE TABLE "public"."GarageSchedule" (
    "id" TEXT NOT NULL,
    "garageId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 60,
    "maxBookingsPerSlot" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GarageSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GarageScheduleException" (
    "id" TEXT NOT NULL,
    "garageId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT true,
    "openTime" TEXT,
    "closeTime" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GarageScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GarageTimeSlotBlock" (
    "id" TEXT NOT NULL,
    "garageId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GarageTimeSlotBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GarageSchedule_garageId_dayOfWeek_key" ON "public"."GarageSchedule"("garageId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "GarageScheduleException_garageId_date_key" ON "public"."GarageScheduleException"("garageId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "GarageTimeSlotBlock_garageId_date_timeSlot_key" ON "public"."GarageTimeSlotBlock"("garageId", "date", "timeSlot");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_registration_ownerId_key" ON "public"."Vehicle"("registration", "ownerId");

-- AddForeignKey
ALTER TABLE "public"."GarageSchedule" ADD CONSTRAINT "GarageSchedule_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "public"."Garage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GarageScheduleException" ADD CONSTRAINT "GarageScheduleException_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "public"."Garage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GarageTimeSlotBlock" ADD CONSTRAINT "GarageTimeSlotBlock_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "public"."Garage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
