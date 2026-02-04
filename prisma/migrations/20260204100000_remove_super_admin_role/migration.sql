-- Step 1: Migrate all SUPER_ADMIN users to ADMIN before removing the enum value
UPDATE "User" SET role = 'ADMIN' WHERE role = 'SUPER_ADMIN';

-- Step 2: Remove SUPER_ADMIN from UserRole enum (PostgreSQL requires recreating the type)
CREATE TYPE "UserRole_new" AS ENUM ('CUSTOMER', 'GARAGE_OWNER', 'ADMIN');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING (role::text::"UserRole_new");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';

DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
