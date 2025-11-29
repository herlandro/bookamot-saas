-- AlterTable: Remove unique constraint on bookingId to allow bidirectional reviews
-- Drop the existing unique constraint on bookingId
DROP INDEX IF EXISTS "Review_bookingId_key";

-- Add new composite unique constraint to allow one review per booking per reviewer type
-- This enables both CUSTOMER and GARAGE to review the same booking
CREATE UNIQUE INDEX "Review_bookingId_reviewerType_key" ON "Review"("bookingId", "reviewerType");

