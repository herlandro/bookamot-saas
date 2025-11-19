# Vehicle Registration - Testing Guide

## Quick Test: Duplicate Registrations Across Users

This guide will help you verify that the duplicate registration feature works correctly.

---

## Prerequisites

- ✅ Database migration applied: `20251017163505_allow_duplicate_registrations_across_users`
- ✅ Development server running: `npm run dev`
- ✅ Two different user accounts (or ability to create them)

---

## Test Scenario 1: Different Users, Same Registration ✅

### Goal
Verify that two different users can register vehicles with the same registration number.

### Steps

#### 1. Create/Login as User A
```
1. Go to http://localhost:3000/signup
2. Create account:
   - Name: Test User A
   - Email: usera@test.com
   - Password: password123
3. Login with these credentials
```

#### 2. Register Vehicle as User A
```
1. Navigate to /onboarding (should auto-redirect if new user)
2. Click "Let's Get Started"
3. Enter registration: AB12CDE
4. Wait for auto-lookup (should fill in Ford Focus details)
5. Click "Continue"
6. Complete location step
7. Complete search step
```

**Expected Result:** ✅ Vehicle `AB12CDE` registered successfully for User A

#### 3. Verify Vehicle in Dashboard
```
1. Go to /dashboard or /vehicles
2. Verify AB12CDE is listed
```

#### 4. Logout User A
```
1. Click profile menu
2. Click "Sign Out"
```

#### 5. Create/Login as User B
```
1. Go to http://localhost:3000/signup
2. Create account:
   - Name: Test User B
   - Email: userb@test.com
   - Password: password123
3. Login with these credentials
```

#### 6. Register Same Vehicle as User B
```
1. Navigate to /onboarding
2. Click "Let's Get Started"
3. Enter registration: AB12CDE (same as User A!)
4. Wait for auto-lookup
5. Click "Continue"
6. Complete location step
7. Complete search step
```

**Expected Result:** ✅ Vehicle `AB12CDE` registered successfully for User B

**This should NOT show an error!**

#### 7. Verify Both Users Have the Vehicle
```
User A Dashboard: Shows AB12CDE
User B Dashboard: Shows AB12CDE
```

**Result:** ✅ **PASS** - Different users can register same vehicle

---

## Test Scenario 2: Same User, Duplicate Registration ❌

### Goal
Verify that a single user CANNOT register the same vehicle twice.

### Steps

#### 1. Login as User A (from previous test)
```
Email: usera@test.com
Password: password123
```

#### 2. Try to Add Same Vehicle Again
```
1. Go to /vehicles/add
2. Enter registration: AB12CDE (already registered by this user)
3. Fill in details:
   - Make: Ford
   - Model: Focus
   - Year: 2020
   - Fuel Type: Petrol
4. Click "Add Vehicle"
```

**Expected Result:** ❌ Error message displayed

**Error Message:**
```
You have already registered this vehicle. 
Please use a different registration number or manage your existing vehicles in the dashboard.
```

**Status Code:** 409 Conflict

**Result:** ✅ **PASS** - Same user cannot register duplicate vehicle

---

## Test Scenario 3: Database Constraint Verification

### Goal
Verify the database constraint is working at the database level.

### Steps

#### 1. Open Database Client
```bash
# Using psql
psql -U postgres -d bookamot

# Or use a GUI tool like pgAdmin, TablePlus, etc.
```

#### 2. Check Current Vehicles
```sql
SELECT id, registration, "ownerId", make, model 
FROM "Vehicle" 
WHERE registration = 'AB12CDE';
```

**Expected Result:**
```
id          | registration | ownerId  | make | model
------------|--------------|----------|------|-------
cm...user1  | AB12CDE      | user1id  | Ford | Focus
cm...user2  | AB12CDE      | user2id  | Ford | Focus
```

Two rows with same registration but different ownerIds ✅

#### 3. Try to Insert Duplicate for Same User
```sql
INSERT INTO "Vehicle" (
  id, 
  registration, 
  make, 
  model, 
  year, 
  "fuelType", 
  "ownerId",
  "createdAt",
  "updatedAt"
) VALUES (
  'test_duplicate',
  'AB12CDE',
  'Ford',
  'Focus',
  2020,
  'PETROL',
  'user1id',  -- Same owner as first AB12CDE
  NOW(),
  NOW()
);
```

**Expected Result:** ❌ Error
```
ERROR: duplicate key value violates unique constraint "Vehicle_registration_ownerId_key"
DETAIL: Key (registration, ownerId)=(AB12CDE, user1id) already exists.
```

**Result:** ✅ **PASS** - Database constraint prevents duplicates

---

## Test Scenario 4: API Direct Testing

### Goal
Test the API endpoints directly using curl or Postman.

### Steps

#### 1. Get Authentication Token
```bash
# Login and get session cookie
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usera@test.com",
    "password": "password123"
  }' \
  -c cookies.txt
```

#### 2. Test Adding New Vehicle (Different Registration)
```bash
curl -X POST http://localhost:3000/api/vehicles \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "registration": "XY99ZZZ",
    "make": "Toyota",
    "model": "Corolla",
    "year": 2019,
    "fuelType": "HYBRID"
  }'
```

**Expected Response:** 201 Created
```json
{
  "vehicle": {
    "id": "cm...",
    "registration": "XY99ZZZ",
    "make": "Toyota",
    "model": "Corolla",
    "year": 2019,
    "fuelType": "HYBRID"
  },
  "message": "Vehicle added successfully"
}
```

#### 3. Test Adding Duplicate Vehicle (Same User)
```bash
curl -X POST http://localhost:3000/api/vehicles \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "registration": "AB12CDE",
    "make": "Ford",
    "model": "Focus",
    "year": 2020,
    "fuelType": "PETROL"
  }'
```

**Expected Response:** 409 Conflict
```json
{
  "error": "You have already registered this vehicle"
}
```

**Result:** ✅ **PASS** - API correctly handles duplicates

---

## Test Scenario 5: Onboarding Flow End-to-End

### Goal
Test the complete onboarding flow with duplicate registration handling.

### Steps

#### 1. Create New User C
```
1. Sign up: userc@test.com / password123
2. Should auto-redirect to /onboarding
```

#### 2. Complete Onboarding with Existing Registration
```
1. Welcome Step: Click "Let's Get Started"
2. Vehicle Step: 
   - Enter: AB12CDE (already used by User A and B)
   - Auto-lookup fills details
   - Click "Continue"
3. Location Step:
   - Click "Use My Location" OR enter postcode
   - Click continue
4. Search Step:
   - Click "Search All Garages"
```

**Expected Result:** ✅ Completes successfully, redirects to search results

#### 3. Verify Vehicle in User C's Account
```
1. Go to /vehicles
2. Verify AB12CDE is listed for User C
```

**Result:** ✅ **PASS** - Onboarding works with duplicate registrations

---

## Verification Checklist

Use this checklist to verify all functionality:

### Database Level
- [ ] Composite unique constraint exists: `Vehicle_registration_ownerId_key`
- [ ] Old unique constraint removed: `Vehicle_registration_key` (should not exist)
- [ ] Can insert same registration with different ownerIds
- [ ] Cannot insert same registration with same ownerId

### API Level
- [ ] POST /api/vehicles returns 201 for new vehicle
- [ ] POST /api/vehicles returns 409 for duplicate (same user)
- [ ] Error message: "You have already registered this vehicle"
- [ ] Different users can register same vehicle (201 response)

### UI Level
- [ ] Onboarding flow completes successfully
- [ ] Duplicate error shows inline (not alert)
- [ ] Error message is user-friendly
- [ ] Vehicle lookup works correctly
- [ ] Dashboard shows user's vehicles only

### Edge Cases
- [ ] Case-insensitive registration matching (AB12CDE = ab12cde)
- [ ] Whitespace handling (AB12 CDE = AB12CDE)
- [ ] Multiple vehicles per user works
- [ ] Vehicle deletion works
- [ ] Booking with duplicate registration works

---

## Troubleshooting

### Issue: Migration Not Applied

**Symptom:** Still getting "Vehicle with this registration already exists" error

**Solution:**
```bash
# Check migration status
npx prisma migrate status

# If not applied, apply it
npx prisma migrate deploy

# Or reset and reapply all migrations
npx prisma migrate reset --force
```

### Issue: Old Constraint Still Exists

**Symptom:** Database error about `Vehicle_registration_key`

**Solution:**
```sql
-- Manually drop old constraint
DROP INDEX IF EXISTS "public"."Vehicle_registration_key";

-- Verify new constraint exists
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'Vehicle';
```

### Issue: Prisma Client Out of Sync

**Symptom:** TypeScript errors or runtime errors

**Solution:**
```bash
# Regenerate Prisma Client
npx prisma generate

# Restart dev server
npm run dev
```

---

## Success Criteria

All tests pass when:

✅ **Different users** can register vehicles with the **same registration number**
✅ **Same user** cannot register the **same vehicle twice**
✅ **Database constraint** enforces the rule at DB level
✅ **API** returns correct status codes and error messages
✅ **UI** shows user-friendly error messages
✅ **Onboarding flow** works end-to-end

---

## Rollback Plan

If issues arise, rollback using:

```bash
# 1. Revert schema changes
# Edit prisma/schema.prisma:
# Change: registration String
# To: registration String @unique
# Remove: @@unique([registration, ownerId])

# 2. Create rollback migration
npx prisma migrate dev --name rollback_duplicate_registrations

# 3. Update API error messages back to original
# 4. Update UI error messages back to original
```

---

## Summary

This testing guide covers:
- ✅ Different users registering same vehicle
- ✅ Same user attempting duplicate registration
- ✅ Database constraint verification
- ✅ API endpoint testing
- ✅ End-to-end onboarding flow
- ✅ Edge cases and troubleshooting

**All tests should pass for the feature to be considered complete.**

