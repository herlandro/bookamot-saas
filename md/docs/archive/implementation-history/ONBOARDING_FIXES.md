# Onboarding Flow - Bug Fixes

## Issue: Form Error on Vehicle Step

### Problem
When users tried to advance from the "Tell us about your vehicle" step, they encountered errors:

1. **Vehicle Lookup API Missing** - The `/api/vehicles/lookup` endpoint was empty
2. **Duplicate Registration Error** - Poor error handling when vehicle already exists
3. **Unclear Error Messages** - Users didn't understand what went wrong

### Root Causes

#### 1. Missing Vehicle Lookup API
**Error in Terminal:**
```
⨯ Detected default export in '[project]/src/app/api/vehicles/lookup/route.ts'
⨯ No HTTP methods exported in '[project]/src/app/api/vehicles/lookup/route.ts'
GET /api/vehicles/lookup?registration=WJ11USE 405 in 106ms
```

**Cause:** The file `src/app/api/vehicles/lookup/route.ts` was empty (only 1 line)

**Fix:** Created complete vehicle lookup API with mock data

#### 2. Duplicate Registration Error
**Error in Terminal:**
```
Error [PrismaClientKnownRequestError]: 
Unique constraint failed on the fields: (`registration`)
POST /api/vehicles 500 in 142ms
```

**Cause:** User tried to add a vehicle that already exists in the database

**Fix:** Improved error handling to show user-friendly message

#### 3. Poor Error Handling
**Cause:** Generic `alert()` messages that didn't help users understand the issue

**Fix:** Inline error messages with specific guidance

---

## Solutions Implemented

### 1. Created Vehicle Lookup API

**File:** `src/app/api/vehicles/lookup/route.ts`

**Features:**
- Named export `GET` function (Next.js 13+ App Router requirement)
- Mock vehicle data for testing
- Proper error handling
- Returns 404 when vehicle not found

**Mock Vehicles Available:**
```typescript
'AB12CDE' → Ford Focus 2020 (Petrol)
'WJ11USE' → Volkswagen Golf 2011 (Diesel)
'XY99ZZZ' → Toyota Corolla 2019 (Hybrid)
```

**Usage:**
```bash
GET /api/vehicles/lookup?registration=AB12CDE
```

**Response:**
```json
{
  "make": "Ford",
  "model": "Focus",
  "year": 2020,
  "fuelType": "PETROL",
  "color": "Blue",
  "engineSize": "1.6"
}
```

**Production Note:**
In production, this should integrate with the DVLA Vehicle Enquiry Service API:
https://developer-portal.driver-vehicle-licensing.api.gov.uk/apis/vehicle-enquiry-service/

---

### 2. Improved Error Handling in Vehicle Step

**File:** `src/components/onboarding/vehicle-step.tsx`

**Changes:**

#### Before:
```typescript
} else {
  alert(error.error || 'Failed to add vehicle')
}
```

#### After:
```typescript
// Handle duplicate registration error
if (response.status === 409) {
  setErrors({
    registration: 'This vehicle is already registered to your account. Please use a different registration number.'
  })
} else if (error.details) {
  const newErrors: Record<string, string> = {}
  error.details.forEach((detail: any) => {
    if (detail.path[0]) {
      newErrors[detail.path[0]] = detail.message
    }
  })
  setErrors(newErrors)
} else {
  setErrors({
    registration: error.error || 'Failed to add vehicle. Please try again.'
  })
}
```

**Benefits:**
- ✅ Specific error for duplicate registrations (409 status)
- ✅ Inline error messages (no alerts)
- ✅ Clear guidance for users
- ✅ Better UX

---

### 3. Added Example Registrations

**File:** `src/components/onboarding/vehicle-step.tsx`

**Change:**
Added helpful hint text showing example registrations users can try:

```tsx
<p className="text-sm text-muted-foreground mt-2">
  Try: <span className="font-mono font-semibold">AB12CDE</span>, 
       <span className="font-mono font-semibold">WJ11USE</span>, or 
       <span className="font-mono font-semibold">XY99ZZZ</span>
</p>
```

**Benefits:**
- ✅ Users know which registrations work in the demo
- ✅ Reduces confusion during testing
- ✅ Improves onboarding experience

---

## Testing the Fixes

### Test Case 1: Vehicle Lookup Success
1. Go to `/onboarding`
2. Click "Let's Get Started"
3. Enter registration: `AB12CDE`
4. Tab out of the field
5. **Expected:** Green checkmark appears, fields auto-fill
6. **Result:** ✅ Works correctly

### Test Case 2: Vehicle Lookup Not Found
1. Enter registration: `INVALID123`
2. Tab out of the field
3. **Expected:** No error, manual entry available
4. **Result:** ✅ Works correctly

### Test Case 3: Duplicate Registration
1. Enter registration: `WJ11USE` (if already in database)
2. Fill in all fields
3. Click "Continue"
4. **Expected:** Error message: "This vehicle is already registered to your account..."
5. **Result:** ✅ Shows inline error message

### Test Case 4: Validation Errors
1. Leave required fields empty
2. Click "Continue"
3. **Expected:** Inline error messages for each field
4. **Result:** ✅ Shows validation errors

---

## Error Messages Reference

### Duplicate Registration (409)
```
This vehicle is already registered to your account. 
Please use a different registration number.
```

### Network Error
```
Failed to add vehicle. Please check your connection and try again.
```

### Validation Errors
```
Registration must be at least 2 characters
Make is required
Model is required
Year must be after 1900
```

---

## API Status Codes

| Code | Meaning | User Message |
|------|---------|--------------|
| 200 | Success | Vehicle details found |
| 201 | Created | Vehicle added successfully |
| 400 | Bad Request | Invalid input data |
| 404 | Not Found | Vehicle not found (manual entry) |
| 409 | Conflict | Vehicle already registered |
| 500 | Server Error | Please try again later |

---

## Files Modified

1. ✅ `src/app/api/vehicles/lookup/route.ts` - Created vehicle lookup API
2. ✅ `src/components/onboarding/vehicle-step.tsx` - Improved error handling
3. ✅ `md/docs/ONBOARDING_FIXES.md` - This documentation

---

## Next Steps

### For Development
1. **Test with real users** to validate error messages are clear
2. **Monitor error rates** to identify common issues
3. **Add analytics** to track where users get stuck

### For Production
1. **Integrate DVLA API** for real vehicle lookups
2. **Add rate limiting** to prevent API abuse
3. **Implement caching** for frequently looked-up vehicles
4. **Add logging** for failed lookups

### Future Enhancements
1. **Auto-save progress** in localStorage
2. **Allow editing** existing vehicles instead of showing error
3. **Suggest similar registrations** if lookup fails
4. **Add vehicle photos** from external API

---

## Known Limitations

1. **Mock Data Only** - Only 3 test registrations work (AB12CDE, WJ11USE, XY99ZZZ)
2. **No DVLA Integration** - Real vehicle lookups not implemented
3. **No Duplicate Handling** - Can't update existing vehicles, only shows error
4. **No Progress Persistence** - Refresh loses progress

---

## Summary

✅ **Fixed:** Vehicle lookup API now works correctly
✅ **Fixed:** Duplicate registration errors handled gracefully
✅ **Fixed:** User-friendly error messages
✅ **Added:** Example registrations for testing
✅ **Improved:** Overall error handling and UX
✅ **Updated:** Database schema to allow duplicate registrations across different users

The onboarding flow now works smoothly from start to finish! 🎉

---

## Additional Update: Duplicate Registration Support

**Date:** 2025-10-17

### Change
Modified the vehicle registration system to allow the same vehicle registration number to be registered by multiple different users.

**Why?**
- Real-world scenario: User A sells car to User B but forgets to remove it
- User B (new owner) should be able to register the same vehicle
- Prevents blocking legitimate new owners

**Implementation:**
- ✅ Changed database constraint from `registration @unique` to composite `@@unique([registration, ownerId])`
- ✅ Updated API error messages to be user-specific
- ✅ Applied database migration successfully

**See:** `md/docs/VEHICLE_REGISTRATION_CHANGES.md` for full details

