# Garage Registration - Invalid User Role Fix

## Issue Reported

When trying to register a garage account, users received the error:
```
Invalid user role
```

---

## Root Cause

### The Problem

In the signup form (`src/app/signup/page.tsx`), when a user selected "Garage" as their account type, the code was sending:

```typescript
role: formData.userType.toUpperCase()
```

Where `formData.userType` was `"garage"`, so it became:
```typescript
role: "GARAGE"  // ❌ Invalid!
```

### The Expected Value

The Prisma schema defines the `UserRole` enum as:

```prisma
enum UserRole {
  CUSTOMER
  GARAGE_OWNER  // ✅ Correct value
  ADMIN
}
```

The API validation in `/api/auth/register` checks:

```typescript
// Validate role
if (!Object.values(UserRole).includes(role)) {
  return NextResponse.json(
    { error: 'Invalid user role' },
    { status: 400 }
  )
}
```

**Valid values:**
- ✅ `CUSTOMER`
- ✅ `GARAGE_OWNER`
- ✅ `ADMIN`

**Invalid values:**
- ❌ `GARAGE` (what was being sent)
- ❌ `garage`
- ❌ Any other string

---

## The Fix

### File Modified
`src/app/signup/page.tsx`

### Before (Incorrect)

```typescript
body: JSON.stringify({
  name: formData.name,
  email: formData.email,
  password: formData.password,
  role: formData.userType.toUpperCase(),  // ❌ "GARAGE" is invalid
  garageName: formData.userType === 'garage' ? formData.garageName : undefined,
  address: formData.userType === 'garage' ? formData.address : undefined,
  phone: formData.userType === 'garage' ? formData.phone : undefined,
})
```

**Problem:**
- `formData.userType` is `"customer"` or `"garage"`
- `.toUpperCase()` converts to `"CUSTOMER"` or `"GARAGE"`
- `"GARAGE"` is **not** a valid `UserRole` enum value

### After (Correct)

```typescript
body: JSON.stringify({
  name: formData.name,
  email: formData.email,
  password: formData.password,
  role: formData.userType === 'garage' ? 'GARAGE_OWNER' : 'CUSTOMER',  // ✅ Correct mapping
  garageName: formData.userType === 'garage' ? formData.garageName : undefined,
  address: formData.userType === 'garage' ? formData.address : undefined,
  phone: formData.userType === 'garage' ? formData.phone : undefined,
})
```

**Solution:**
- Explicitly map `userType` to the correct `UserRole` enum value
- `"garage"` → `"GARAGE_OWNER"`
- `"customer"` → `"CUSTOMER"`

---

## How It Works Now

### User Flow

1. **User selects account type:**
   - Clicks "Customer" button → `userType = "customer"`
   - Clicks "Garage" button → `userType = "garage"`

2. **Form submission:**
   - If `userType === "garage"` → sends `role: "GARAGE_OWNER"`
   - If `userType === "customer"` → sends `role: "CUSTOMER"`

3. **API validation:**
   - Checks if role is in `UserRole` enum
   - ✅ `"GARAGE_OWNER"` is valid
   - ✅ `"CUSTOMER"` is valid
   - Creates user with correct role

4. **Garage creation (if GARAGE_OWNER):**
   - API checks: `if (role === UserRole.GARAGE_OWNER)`
   - Creates garage record with provided details
   - Links garage to user via `ownerId`

---

## Testing

### Test Case 1: Register as Customer ✅

**Steps:**
1. Go to `/signup`
2. Select "Customer" account type
3. Fill in:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
4. Click "Create Account"

**Expected Result:**
- ✅ User created with `role: "CUSTOMER"`
- ✅ Redirected to `/signin` with success message
- ✅ No garage record created

### Test Case 2: Register as Garage ✅

**Steps:**
1. Go to `/signup`
2. Select "Garage" account type
3. Fill in:
   - Contact Name: "Jane Smith"
   - Garage Name: "Smith's Auto Service"
   - Address: "123 Main St, London"
   - Phone: "020 1234 5678"
   - Email: "jane@smithauto.com"
   - Password: "password123"
   - Confirm Password: "password123"
4. Click "Create Account"

**Expected Result:**
- ✅ User created with `role: "GARAGE_OWNER"`
- ✅ Garage record created and linked to user
- ✅ Redirected to `/signin` with success message
- ✅ No "Invalid user role" error

### Test Case 3: Garage Missing Required Fields ❌

**Steps:**
1. Go to `/signup`
2. Select "Garage" account type
3. Fill in only:
   - Contact Name: "Jane Smith"
   - Email: "jane@smithauto.com"
   - Password: "password123"
4. Leave garage fields empty
5. Click "Create Account"

**Expected Result:**
- ❌ HTML5 validation prevents submission (required fields)
- OR
- ❌ API returns error: "Garage name, address, and phone are required for garage accounts"

---

## Code Flow Diagram

```
User selects account type
         ↓
┌────────────────────────┐
│ userType = "customer"  │  or  │ userType = "garage"  │
└────────────────────────┘      └──────────────────────┘
         ↓                                ↓
┌────────────────────────┐      ┌──────────────────────┐
│ role = "CUSTOMER"      │      │ role = "GARAGE_OWNER"│
└────────────────────────┘      └──────────────────────┘
         ↓                                ↓
┌────────────────────────┐      ┌──────────────────────┐
│ POST /api/auth/register│      │ POST /api/auth/register│
└────────────────────────┘      └──────────────────────┘
         ↓                                ↓
┌────────────────────────┐      ┌──────────────────────┐
│ Validate role          │      │ Validate role        │
│ ✅ CUSTOMER is valid   │      │ ✅ GARAGE_OWNER valid│
└────────────────────────┘      └──────────────────────┘
         ↓                                ↓
┌────────────────────────┐      ┌──────────────────────┐
│ Create User            │      │ Create User          │
│ role: CUSTOMER         │      │ role: GARAGE_OWNER   │
└────────────────────────┘      └──────────────────────┘
         ↓                                ↓
┌────────────────────────┐      ┌──────────────────────┐
│ Success!               │      │ Create Garage        │
│ Redirect to /signin    │      │ Link to User         │
└────────────────────────┘      └──────────────────────┘
                                         ↓
                                ┌──────────────────────┐
                                │ Success!             │
                                │ Redirect to /signin  │
                                └──────────────────────┘
```

---

## Database Schema

### User Model

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      UserRole @default(CUSTOMER)
  // ... other fields
}
```

### Garage Model

```prisma
model Garage {
  id                String   @id @default(cuid())
  name              String
  address           String
  phone             String
  email             String
  ownerId           String
  owner             User     @relation(fields: [ownerId], references: [id])
  motLicenseNumber  String
  dvlaApproved      Boolean  @default(false)
  // ... other fields
}
```

### UserRole Enum

```prisma
enum UserRole {
  CUSTOMER
  GARAGE_OWNER
  ADMIN
}
```

---

## API Validation Logic

### `/api/auth/register` Route

```typescript
// 1. Validate role
if (!Object.values(UserRole).includes(role)) {
  return NextResponse.json(
    { error: 'Invalid user role' },
    { status: 400 }
  )
}

// 2. Create user
const user = await prisma.user.create({
  data: {
    name,
    email,
    password: hashedPassword,
    role,  // Must be valid UserRole enum value
  }
})

// 3. If garage owner, create garage
if (role === UserRole.GARAGE_OWNER) {
  if (!garageName || !address || !phone) {
    await prisma.user.delete({ where: { id: user.id } })
    return NextResponse.json(
      { error: 'Garage name, address, and phone are required for garage accounts' },
      { status: 400 }
    )
  }

  await prisma.garage.create({
    data: {
      name: garageName,
      address,
      phone,
      email,
      ownerId: user.id,
      motLicenseNumber: `MOT-${Date.now()}`,
      dvlaApproved: false,
    }
  })
}
```

---

## Error Messages

### Before Fix

**Error:** `Invalid user role`

**Cause:** Sending `role: "GARAGE"` instead of `role: "GARAGE_OWNER"`

### After Fix

**Success:** User and garage created successfully

**Possible errors (if validation fails):**
- `Missing required fields` - If name, email, password, or role is missing
- `Invalid email format` - If email is not valid
- `Password must be at least 6 characters long` - If password is too short
- `User with this email already exists` - If email is already registered
- `Garage name, address, and phone are required for garage accounts` - If garage fields are missing

---

## Summary

### Problem
- ❌ Sending `role: "GARAGE"` (invalid)
- ❌ API rejected with "Invalid user role" error

### Solution
- ✅ Map `userType` to correct enum value
- ✅ `"garage"` → `"GARAGE_OWNER"`
- ✅ `"customer"` → `"CUSTOMER"`

### Files Changed
- ✅ `src/app/signup/page.tsx` - Fixed role mapping

### Status
✅ **FIXED** - Garage registration now works correctly

---

## Prevention for Future

### When Working with Enums

1. **Always check the Prisma schema** for exact enum values:
   ```bash
   cat prisma/schema.prisma | grep -A 5 "enum UserRole"
   ```

2. **Don't use `.toUpperCase()` blindly** - Map values explicitly:
   ```typescript
   // ❌ Bad
   role: formData.userType.toUpperCase()
   
   // ✅ Good
   role: formData.userType === 'garage' ? 'GARAGE_OWNER' : 'CUSTOMER'
   ```

3. **Use TypeScript enums** for type safety:
   ```typescript
   import { UserRole } from '@prisma/client'
   
   const role = formData.userType === 'garage' 
     ? UserRole.GARAGE_OWNER 
     : UserRole.CUSTOMER
   ```

---

**Test the fix by registering a new garage account!** ✅

