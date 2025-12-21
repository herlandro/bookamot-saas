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

-- CreateTable: GarageApprovalLog (if not exists)
CREATE TABLE IF NOT EXISTS "public"."GarageApprovalLog" (
    "id" TEXT NOT NULL,
    "garageId" TEXT NOT NULL,
    "action" "public"."GarageApprovalStatus" NOT NULL,
    "reason" TEXT,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GarageApprovalLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Index on garageId (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'GarageApprovalLog_garageId_idx' 
    AND schemaname = 'public'
  ) THEN
    CREATE INDEX "GarageApprovalLog_garageId_idx" ON "public"."GarageApprovalLog"("garageId");
  END IF;
END $$;

-- AddForeignKey: Link garageId to Garage table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'GarageApprovalLog_garageId_fkey' 
    AND table_schema = 'public' 
    AND table_name = 'GarageApprovalLog'
  ) THEN
    ALTER TABLE "public"."GarageApprovalLog" 
    ADD CONSTRAINT "GarageApprovalLog_garageId_fkey" 
    FOREIGN KEY ("garageId") 
    REFERENCES "public"."Garage"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: Link adminId to User table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'GarageApprovalLog_adminId_fkey' 
    AND table_schema = 'public' 
    AND table_name = 'GarageApprovalLog'
  ) THEN
    ALTER TABLE "public"."GarageApprovalLog" 
    ADD CONSTRAINT "GarageApprovalLog_adminId_fkey" 
    FOREIGN KEY ("adminId") 
    REFERENCES "public"."User"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

