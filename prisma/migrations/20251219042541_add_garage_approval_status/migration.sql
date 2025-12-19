-- CreateEnum: GarageApprovalStatus (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GarageApprovalStatus') THEN
    CREATE TYPE "public"."GarageApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'INFO_REQUESTED');
  END IF;
END $$;

-- AlterTable: Add approval status fields to Garage table
ALTER TABLE "public"."Garage" 
ADD COLUMN IF NOT EXISTS "approvalStatus" "public"."GarageApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "approvedById" TEXT,
ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- AddForeignKey: Link approvedById to User table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Garage_approvedById_fkey' 
    AND table_schema = 'public' 
    AND table_name = 'Garage'
  ) THEN
    ALTER TABLE "public"."Garage" 
    ADD CONSTRAINT "Garage_approvedById_fkey" 
    FOREIGN KEY ("approvedById") 
    REFERENCES "public"."User"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

