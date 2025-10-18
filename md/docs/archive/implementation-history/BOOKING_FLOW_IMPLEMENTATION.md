# Authentication and Booking Flow Implementation

## Overview

This document describes the implementation of the authentication and vehicle verification flow for the MOT booking system. The flow ensures users are authenticated and have registered vehicles before proceeding to book an MOT test.

## Flow Diagram

```
User clicks "Book Now" on Search Results
    ↓
[Authentication Check]
    ├─ Not Authenticated → Redirect to /signin with return URL
    │   └─ After login → Return to search results
    │
    └─ Authenticated → [Vehicle Verification]
        ├─ No Vehicles → Redirect to /vehicles/add
        │   └─ After vehicle registration → Redirect to /booking/[garageId]
        │
        └─ Has Vehicles → Redirect to /booking/[garageId]
```

## Implementation Details

### 1. Search Results Page (`src/app/search-results/page.tsx`)

#### New Imports
- `useRouter` from `next/navigation` - for client-side navigation
- `useSession` from `next-auth/react` - for authentication status

#### New State
- `isCheckingVehicles` - tracks vehicle verification in progress

#### New Functions

**`storeBookingContext(garageId, timeSlot?)`**
- Stores search parameters and garage selection in session storage
- Stored data includes:
  - `postcode`, `lat`, `lng` - location data
  - `date`, `time` - booking date/time
  - `isQuick` - quick booking flag
  - `selectedGarageId` - selected garage
  - `selectedTimeSlot` - selected time slot (optional)
  - `timestamp` - when context was stored

**`checkUserVehicles()`**
- Async function that fetches user's vehicles from `/api/vehicles`
- Returns `true` if user has at least one vehicle, `false` otherwise
- Handles errors gracefully

**`handleBookNow(garageId, timeSlot?)`**
- Main handler for "Book Now" button clicks
- **Step 1: Authentication Check**
  - If `status === 'unauthenticated'`:
    - Stores booking context
    - Redirects to `/signin?callbackUrl=...` with return URL
    - Return URL includes all search parameters to restore search results
  
- **Step 2: Vehicle Verification** (if authenticated)
  - Calls `checkUserVehicles()`
  - If no vehicles:
    - Stores booking context
    - Redirects to `/vehicles/add`
  - If vehicles exist:
    - Stores booking context
    - Redirects to `/booking/[garageId]`

#### UI Updates
- All "Book Now" buttons now show loading state during vehicle check
- Buttons display "Checking..." text when `isCheckingVehicles` is true
- Buttons are disabled during vehicle verification

### 2. Vehicle Add Page (`src/app/vehicles/add/page.tsx`)

#### New Functions

**`getBookingContext()`**
- Retrieves booking context from session storage
- Returns parsed context object or null if not found
- Safely handles window object availability

#### Updated `handleSubmit()`
- After successful vehicle creation:
  - Checks for `bookingSearchContext` in session storage
  - If context exists:
    - Extracts `selectedGarageId` and booking parameters
    - Clears the booking context from session storage
    - Redirects to `/booking/[garageId]` with parameters
  - If no context:
    - Redirects to `/dashboard` (normal flow)

#### UI Updates
- Added informational message when user is in booking flow
- Message displays: "Booking in progress: After adding your vehicle, you'll be redirected to complete your MOT booking."
- Message only shows if `bookingContext` exists

### 3. Session Storage Keys

**`bookingSearchContext`**
```json
{
  "postcode": "string",
  "lat": "string",
  "lng": "string",
  "date": "string (ISO format)",
  "time": "string",
  "isQuick": "boolean",
  "selectedGarageId": "string",
  "selectedTimeSlot": "string | null",
  "timestamp": "string (ISO format)"
}
```

## User Flows

### Flow 1: Unauthenticated User
1. User clicks "Book Now" on search results
2. System detects user is not authenticated
3. Booking context is stored in session storage
4. User is redirected to `/signin?callbackUrl=/search-results?...`
5. After successful login, user returns to search results
6. User clicks "Book Now" again
7. System checks for vehicles
8. If no vehicles → redirect to `/vehicles/add`
9. If vehicles exist → redirect to `/booking/[garageId]`

### Flow 2: Authenticated User Without Vehicles
1. User clicks "Book Now" on search results
2. System detects user is authenticated
3. System checks for vehicles
4. No vehicles found
5. Booking context is stored
6. User is redirected to `/vehicles/add`
7. Informational message displays about booking in progress
8. User adds a vehicle
9. After successful vehicle creation, user is redirected to `/booking/[garageId]`
10. Booking context is cleared from session storage

### Flow 3: Authenticated User With Vehicles
1. User clicks "Book Now" on search results
2. System detects user is authenticated
3. System checks for vehicles
4. Vehicles found
5. User is redirected directly to `/booking/[garageId]`

## Error Handling

- **Vehicle Check Failure**: If vehicle check fails, `checkUserVehicles()` returns `false`, treating it as "no vehicles" and redirecting to vehicle registration
- **Booking Context Parse Error**: If stored context cannot be parsed, user is redirected to `/dashboard`
- **Network Errors**: Gracefully handled with console logging and fallback behavior

## Session Storage Cleanup

- Booking context is automatically cleared after successful vehicle registration
- Context persists across page navigations until cleared
- Context is NOT cleared on authentication redirect (intentional - allows return to search results)

## Benefits

1. **Seamless User Experience**: Users don't lose their search context when redirected
2. **Reduced Friction**: Minimal steps between search and booking
3. **Data Integrity**: All search parameters are preserved and can be restored
4. **Flexible Flow**: Supports multiple user scenarios (new users, existing users, etc.)
5. **Clear Communication**: Users are informed about booking progress

## Testing Recommendations

1. Test unauthenticated user flow with login redirect
2. Test authenticated user without vehicles
3. Test authenticated user with vehicles
4. Test return URL restoration after login
5. Test session storage cleanup after vehicle registration
6. Test error scenarios (network failures, API errors)
7. Test with different search parameters (postcode, location, date, time)

