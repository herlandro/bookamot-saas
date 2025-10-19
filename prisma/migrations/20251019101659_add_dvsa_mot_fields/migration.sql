/*
  Warnings:

  - A unique constraint covering the columns `[testNumber]` on the table `MotHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."MotHistory" ADD COLUMN     "dataSource" TEXT,
ADD COLUMN     "odometerResultType" TEXT,
ADD COLUMN     "odometerUnit" TEXT,
ADD COLUMN     "prsDefects" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "registrationAtTimeOfTest" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "MotHistory_testNumber_key" ON "public"."MotHistory"("testNumber");
