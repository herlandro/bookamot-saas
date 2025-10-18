# Booking Flow Testing Guide

## Test Environment Setup

Before running tests, ensure:
1. Development server is running: `npm run dev`
2. Database is seeded with test data
3. NextAuth is properly configured
4. Session storage is available (browser dev tools)

## Manual Testing Scenarios

### Scenario 1: Unauthenticated User Booking Flow

**Steps:**
1. Open browser in incognito/private mode (no session)
2. Navigate to search results page with parameters:
   - URL: `/search-results?postcode=SW1A1AA&date=2025-01-15&time=09:00`
3. Click "Book Now" button on any garage card
4. **Expected Result:**
   - Redirected to `/signin?callbackUrl=/search-results?postcode=SW1A1AA&date=2025-01-15&time=09:00`
   - Session storage contains `bookingSearchContext`
5. Sign in with test credentials
6. **Expected Result:**
   - Redirected back to search results page
   - Search parameters are preserved
7. Click "Book Now" again
8. **Expected Result:**
   - If no vehicles: Redirected to `/vehicles/add` with info message
   - If vehicles exist: Redirected to `/booking/[garageId]`

### Scenario 2: Authenticated User Without Vehicles

**Steps:**
1. Create new test account (no vehicles registered)
2. Sign in
3. Navigate to search results: `/search-results?postcode=SW1A1AA`
4. Click "Book Now" button
5. **Expected Result:**
   - Button shows "Checking..." state
   - Redirected to `/vehicles/add`
   - Info message displays: "Booking in progress: After adding your vehicle..."
6. Fill in vehicle form and submit
7. **Expected Result:**
   - Vehicle is created
   - Redirected to `/booking/[garageId]` (not dashboard)
   - Session storage `bookingSearchContext` is cleared

### Scenario 3: Authenticated User With Vehicles

**Steps:**
1. Sign in with account that has vehicles
2. Navigate to search results: `/search-results?postcode=SW1A1AA`
3. Click "Book Now" button
4. **Expected Result:**
   - Button shows "Checking..." state briefly
   - Redirected directly to `/booking/[garageId]`
   - No vehicle registration page shown

### Scenario 4: Time Slot Selection

**Steps:**
1. Navigate to search results with available time slots
2. Click on specific time slot button (e.g., "09:00")
3. **Expected Result:**
   - If authenticated with vehicles: Redirected to booking page with time slot in URL
   - If not authenticated: Redirected to signin, then back to search results
   - Time slot is preserved in booking context

### Scenario 5: Search Parameters Preservation

**Steps:**
1. Navigate to search results with multiple parameters:
   - `/search-results?postcode=SW1A1AA&lat=51.5&lng=-0.1&date=2025-01-15&time=09:00&quick=true`
2. Click "Book Now" as unauthenticated user
3. Sign in
4. **Expected Result:**
   - All search parameters are preserved in return URL
   - Search results page shows same results as before

### Scenario 6: Session Storage Verification

**Steps:**
1. Open browser DevTools (F12)
2. Go to Application → Session Storage
3. Navigate to search results and click "Book Now"
4. **Expected Result:**
   - `bookingSearchContext` key appears in session storage
   - Contains all search parameters and garage selection
5. Complete vehicle registration (if needed)
6. **Expected Result:**
   - `bookingSearchContext` is removed from session storage

## Automated Testing (Jest/Vitest)

### Test Case 1: handleBookNow - Unauthenticated User

```typescript
test('handleBookNow redirects unauthenticated user to signin', async () => {
  // Mock useSession to return unauthenticated status
  // Mock router.push
  // Call handleBookNow
  // Assert router.push called with signin URL
  // Assert sessionStorage contains bookingSearchContext
})
```

### Test Case 2: handleBookNow - No Vehicles

```typescript
test('handleBookNow redirects to vehicle add when no vehicles', async () => {
  // Mock useSession to return authenticated status
  // Mock fetch to return empty vehicles array
  // Call handleBookNow
  // Assert router.push called with /vehicles/add
  // Assert sessionStorage contains bookingSearchContext
})
```

### Test Case 3: handleBookNow - With Vehicles

```typescript
test('handleBookNow redirects to booking page when vehicles exist', async () => {
  // Mock useSession to return authenticated status
  // Mock fetch to return vehicles array
  // Call handleBookNow
  // Assert router.push called with /booking/[garageId]
})
```

### Test Case 4: Vehicle Add - Booking Context Redirect

```typescript
test('handleSubmit redirects to booking page when context exists', async () => {
  // Set bookingSearchContext in sessionStorage
  // Mock fetch to return successful vehicle creation
  // Call handleSubmit
  // Assert router.push called with /booking/[garageId]
  // Assert sessionStorage.bookingSearchContext is cleared
})
```

## Browser DevTools Inspection

### Check Session Storage
```javascript
// In browser console
sessionStorage.getItem('bookingSearchContext')
// Should return JSON string with booking context
```

### Monitor Network Requests
1. Open DevTools → Network tab
2. Click "Book Now"
3. Observe requests:
   - `/api/vehicles` (GET) - vehicle check
   - Navigation to `/signin` or `/booking/[garageId]`

### Check Console Logs
1. Open DevTools → Console tab
2. Look for debug messages:
   - "Checking vehicles..."
   - "Vehicle check complete"
   - Any error messages

## Common Issues and Troubleshooting

### Issue: Redirect Loop
**Cause:** Session not properly established after login
**Solution:** Clear browser cookies and session storage, try again

### Issue: Session Storage Not Persisting
**Cause:** Browser privacy settings or incognito mode
**Solution:** Test in normal browsing mode

### Issue: Vehicle Check Fails
**Cause:** API endpoint not responding
**Solution:** Check `/api/vehicles` endpoint is working

### Issue: Booking Context Not Cleared
**Cause:** Vehicle registration didn't complete successfully
**Solution:** Check vehicle creation API response

## Performance Considerations

- Vehicle check adds ~200-500ms latency (API call)
- Session storage operations are instant
- Consider adding loading skeleton during vehicle check
- Monitor API response times for `/api/vehicles`

## Security Considerations

- Session storage is cleared after vehicle registration
- Booking context contains no sensitive data
- All redirects use proper URL encoding
- Authentication status verified before vehicle check

