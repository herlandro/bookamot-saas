-- DropForeignKey
ALTER TABLE "public"."Garage" DROP CONSTRAINT "Garage_approvedById_fkey";

-- AlterTable
ALTER TABLE "public"."Garage" ALTER COLUMN "isActive" SET DEFAULT false;

-- AlterTable
ALTER TABLE "public"."GarageSchedule" ALTER COLUMN "slotDuration" SET DEFAULT 30;
