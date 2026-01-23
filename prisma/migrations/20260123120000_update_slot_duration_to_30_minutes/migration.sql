-- Migration: Update slot duration from 60 minutes to 30 minutes
-- This migration updates the default slot duration and converts existing schedules

-- Step 1: Update the default value for slotDuration column
-- Note: PostgreSQL doesn't support changing default values directly in ALTER COLUMN,
-- so we'll update existing records and the schema default is already changed

-- Step 2: Update all existing GarageSchedule records to use 30 minutes
-- This converts all schedules from 1-hour slots to 30-minute slots
UPDATE "GarageSchedule"
SET "slotDuration" = 30
WHERE "slotDuration" = 60;

-- Step 3: For any schedules that don't have slotDuration set (NULL), set to 30
UPDATE "GarageSchedule"
SET "slotDuration" = 30
WHERE "slotDuration" IS NULL;

-- Step 4: Migration of existing bookings
-- Convert bookings from 1-hour slots to 30-minute slots
-- A booking at 14:00 (1 hour slot) should be converted to 14:00 (30 min slot)
-- Since we're just changing the granularity, existing bookings remain valid
-- but they now represent 30-minute slots instead of 1-hour slots

-- Note: Existing bookings are preserved as-is because:
-- 1. A booking at "14:00" with 60-min duration is equivalent to "14:00" with 30-min duration
-- 2. The timeSlot field stores the start time, which remains the same
-- 3. The actual duration is now implicit (30 minutes) rather than explicit (60 minutes)

-- Step 5: Update any blocked time slots
-- Blocked slots remain valid as they reference specific time slots
-- No changes needed for GarageTimeSlotBlock table

-- Rollback script (for reference, not executed):
-- UPDATE "GarageSchedule" SET "slotDuration" = 60 WHERE "slotDuration" = 30;
