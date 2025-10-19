-- AlterTable
ALTER TABLE "public"."MotHistory" ADD COLUMN     "advisoryDefects" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dangerousDefects" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "defectDetails" TEXT,
ADD COLUMN     "majorDefects" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "minorDefects" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testNumber" TEXT;
