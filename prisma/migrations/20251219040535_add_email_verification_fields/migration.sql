-- AlterTable: Add email verification fields to User table
-- These fields are used for garage owner email verification
ALTER TABLE "public"."User" 
ADD COLUMN IF NOT EXISTS "emailVerificationCode" TEXT,
ADD COLUMN IF NOT EXISTS "emailVerificationExpiry" TIMESTAMP(3);
