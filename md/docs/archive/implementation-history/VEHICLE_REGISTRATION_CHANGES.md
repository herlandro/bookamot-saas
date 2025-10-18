# Vehicle Registration System - Duplicate Registration Support

## Overview

The vehicle registration system has been modified to allow the same vehicle registration number to be registered by multiple different users, while still preventing a single user from registering the same vehicle twice.

## Business Case

### Real-World Scenario
1. **User A** owns a car with registration `AB12CDE` and registers it in BookaMOT
2. **User A** sells the car to **User B** but forgets to remove it from their account
3. **User B** (new owner) tries to register `AB12CDE` in their account
4. **Result:** Both users can now have the same registration in their accounts

This accommodates vehicle ownership transfers and prevents blocking legitimate new owners from using the system.

---

## Changes Made

### 1. Database Schema Changes

**File:** `prisma/schema.prisma`

#### Before:
```prisma
model Vehicle {
  id           String   @id @default(cuid())
  registration String   @unique  // ❌ Prevented duplicate registrations globally
  make         String
  model        String
  // ... other fields
  
  ownerId  String
  owner    User @relation(fields: [ownerId], references: [id])
}
```

#### After:
```prisma
model Vehicle {
  id           String   @id @default(cuid())
  registration String   // ✅ No longer globally unique
  make         String
  model        String
  // ... other fields
  
  ownerId  String
  owner    User @relation(fields: [ownerId], references: [id])
  
  // ✅ Composite unique constraint
  @@unique([registration, ownerId], name: "unique_vehicle_per_user")
}
```

**Key Changes:**
- ✅ Removed `@unique` from `registration` field
- ✅ Added composite unique constraint on `[registration, ownerId]`
- ✅ Same user cannot register same vehicle twice
- ✅ Different users CAN register vehicles with same registration

---

### 2. Database Migration

**Migration:** `20251017163505_allow_duplicate_registrations_across_users`

**SQL Changes:**
```sql
-- Drop old unique constraint on registration alone
DROP INDEX "public"."Vehicle_registration_key";

-- Create new composite unique constraint
CREATE UNIQUE INDEX "Vehicle_registration_ownerId_key" 
ON "public"."Vehicle"("registration", "ownerId");
```

**Migration Applied:** ✅ Successfully applied to database

---

### 3. API Changes

**File:** `src/app/api/vehicles/route.ts`

#### Before:
```typescript
// Check if vehicle already exists for this user
const existingVehicle = await prisma.vehicle.findFirst({
  where: {
    registration: registration.toUpperCase(),
    ownerId: session.user.id
  }
})

if (existingVehicle) {
  return NextResponse.json(
    { error: 'Vehicle with this registration already exists' }, // ❌ Confusing message
    { status: 409 }
  )
}
```

#### After:
```typescript
// Check if this user has already registered this specific vehicle
// Note: Different users CAN register vehicles with the same registration number
const existingVehicle = await prisma.vehicle.findFirst({
  where: {
    registration: registration.toUpperCase(),
    ownerId: session.user.id
  }
})

if (existingVehicle) {
  return NextResponse.json(
    { error: 'You have already registered this vehicle' }, // ✅ Clear, user-specific message
    { status: 409 }
  )
}
```

**Key Changes:**
- ✅ Updated comment to clarify behavior
- ✅ Changed error message to be user-specific
- ✅ Logic already checked both `registration` AND `ownerId` (no change needed)

---

### 4. UI Error Message Updates

**File:** `src/components/onboarding/vehicle-step.tsx`

#### Before:
```typescript
if (response.status === 409) {
  setErrors({
    registration: 'This vehicle is already registered to your account. Please use a different registration number.'
  })
}
```

#### After:
```typescript
if (response.status === 409) {
  setErrors({
    registration: 'You have already registered this vehicle. Please use a different registration number or manage your existing vehicles in the dashboard.'
  })
}
```

**Key Changes:**
- ✅ More user-friendly language
- ✅ Provides actionable guidance (check dashboard)
- ✅ Clarifies it's about the user's own duplicate, not a global conflict

---

## Behavior Matrix

| Scenario | User A | User B | Registration | Result | Status Code |
|----------|--------|--------|--------------|--------|-------------|
| **1** | Registers `AB12CDE` | - | `AB12CDE` | ✅ Success | 201 |
| **2** | Has `AB12CDE` | Registers `AB12CDE` | `AB12CDE` | ✅ Success | 201 |
| **3** | Tries to register `AB12CDE` again | - | `AB12CDE` | ❌ Error: "You have already registered this vehicle" | 409 |
| **4** | Has `AB12CDE` | Has `AB12CDE` | `AB12CDE` | ✅ Both can have it | - |
| **5** | Registers `XY99ZZZ` | Registers `XY99ZZZ` | `XY99ZZZ` | ✅ Both succeed | 201 |

---

## Database Constraints

### Composite Unique Constraint

**Constraint Name:** `unique_vehicle_per_user`

**Columns:** `[registration, ownerId]`

**Behavior:**
```sql
-- ✅ ALLOWED: Different users, same registration
INSERT INTO Vehicle (registration, ownerId) VALUES ('AB12CDE', 'user1');
INSERT INTO Vehicle (registration, ownerId) VALUES ('AB12CDE', 'user2');

-- ❌ BLOCKED: Same user, same registration
INSERT INTO Vehicle (registration, ownerId) VALUES ('AB12CDE', 'user1');
INSERT INTO Vehicle (registration, ownerId) VALUES ('AB12CDE', 'user1'); -- ERROR!
```

---

## Testing

### Test Case 1: Different Users, Same Registration ✅

**Steps:**
1. User A logs in
2. User A registers vehicle `AB12CDE`
3. User A logs out
4. User B logs in
5. User B registers vehicle `AB12CDE`

**Expected Result:** ✅ Both registrations succeed

**Actual Result:** ✅ Works as expected

---

### Test Case 2: Same User, Duplicate Registration ❌

**Steps:**
1. User A logs in
2. User A registers vehicle `AB12CDE`
3. User A tries to register `AB12CDE` again

**Expected Result:** ❌ 409 error: "You have already registered this vehicle"

**Actual Result:** ✅ Shows error as expected

---

### Test Case 3: Database Constraint Enforcement

**Direct Database Test:**
```sql
-- Insert first vehicle for user1
INSERT INTO "Vehicle" (id, registration, make, model, year, "fuelType", "ownerId")
VALUES ('test1', 'AB12CDE', 'Ford', 'Focus', 2020, 'PETROL', 'user1');
-- ✅ Success

-- Insert same registration for user2
INSERT INTO "Vehicle" (id, registration, make, model, year, "fuelType", "ownerId")
VALUES ('test2', 'AB12CDE', 'Ford', 'Focus', 2020, 'PETROL', 'user2');
-- ✅ Success

-- Try to insert duplicate for user1
INSERT INTO "Vehicle" (id, registration, make, model, year, "fuelType", "ownerId")
VALUES ('test3', 'AB12CDE', 'Ford', 'Focus', 2020, 'PETROL', 'user1');
-- ❌ ERROR: duplicate key value violates unique constraint "Vehicle_registration_ownerId_key"
```

---

## API Response Examples

### Success: New Vehicle Registration

**Request:**
```http
POST /api/vehicles
Content-Type: application/json
Authorization: Bearer {token}

{
  "registration": "AB12CDE",
  "make": "Ford",
  "model": "Focus",
  "year": 2020,
  "fuelType": "PETROL"
}
```

**Response:**
```json
{
  "vehicle": {
    "id": "cm...",
    "registration": "AB12CDE",
    "make": "Ford",
    "model": "Focus",
    "year": 2020,
    "fuelType": "PETROL"
  },
  "message": "Vehicle added successfully"
}
```
**Status:** `201 Created`

---

### Error: Duplicate Registration (Same User)

**Request:**
```http
POST /api/vehicles
Content-Type: application/json
Authorization: Bearer {token}

{
  "registration": "AB12CDE",  // User already has this
  "make": "Ford",
  "model": "Focus",
  "year": 2020,
  "fuelType": "PETROL"
}
```

**Response:**
```json
{
  "error": "You have already registered this vehicle"
}
```
**Status:** `409 Conflict`

---

## Migration Rollback (If Needed)

If you need to rollback this change:

```bash
# Rollback the migration
npx prisma migrate resolve --rolled-back 20251017163505_allow_duplicate_registrations_across_users

# Revert schema changes
# In prisma/schema.prisma, change back to:
# registration String @unique

# Create new migration
npx prisma migrate dev --name revert_to_unique_registration
```

---

## Impact Analysis

### ✅ Benefits

1. **Real-World Compatibility**
   - Handles vehicle ownership transfers
   - Doesn't block legitimate new owners
   - Reduces support tickets

2. **Better User Experience**
   - Clear error messages
   - Actionable guidance
   - No false conflicts

3. **Data Integrity**
   - Still prevents user duplicates
   - Maintains referential integrity
   - No orphaned records

### ⚠️ Considerations

1. **Historical Data**
   - Old vehicles may remain in previous owner's account
   - Consider adding "transfer ownership" feature in future

2. **MOT History**
   - Multiple users may have MOT history for same registration
   - Each user sees only their own history

3. **Reporting**
   - Vehicle counts may include duplicates across users
   - Analytics should account for this

---

## Future Enhancements

### Phase 1: Vehicle Transfer
- Add "Transfer Vehicle" feature
- Allow users to remove vehicles from their account
- Notify new owner when vehicle is transferred

### Phase 2: Ownership Verification
- Integrate with DVLA to verify current ownership
- Flag vehicles that may have been sold
- Suggest removal of old vehicles

### Phase 3: Smart Deduplication
- Detect when same vehicle is registered by multiple users
- Suggest ownership verification
- Auto-archive vehicles after certain period

---

## Summary

✅ **Database schema updated** - Composite unique constraint on `(registration, ownerId)`
✅ **Migration applied** - Successfully migrated database
✅ **API updated** - Better error messages and comments
✅ **UI updated** - User-friendly error messages
✅ **Tested** - All scenarios working as expected

**Result:** The system now allows different users to register vehicles with the same registration number, while preventing individual users from registering the same vehicle twice.

