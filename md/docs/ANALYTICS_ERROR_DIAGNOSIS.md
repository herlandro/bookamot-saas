# Analytics Error Diagnosis - "Failed to fetch analytics"

## Problem Summary

**Error:** "Failed to fetch analytics"
**HTTP Status:** 401 Unauthorized
**Location:** `/garage-admin/analytics` page
**Date:** Outubro 22, 2025

---

## Root Cause Analysis

### Issue Identified

The analytics API endpoint (`/api/garage-admin/analytics`) is returning **401 Unauthorized** because:

1. **User is not authenticated** - The session is `null` when the API is called
2. **Session not passed to API** - The fetch request doesn't include authentication cookies
3. **NextAuth session validation fails** - `getServerSession(authOptions)` returns `null`

### Code Flow

**Page Component:** `src/app/garage-admin/analytics/page.tsx`
```typescript
const { data: session, status } = useSession();

useEffect(() => {
  if (!session) {
    router.push('/signin');  // Should redirect here if not authenticated
    return;
  }
  
  fetchAnalytics();  // Calls API
}, [session, status, router]);

const fetchAnalytics = async () => {
  const response = await fetch('/api/garage-admin/analytics');
  // ❌ API returns 401 because session is null
};
```

**API Route:** `src/app/api/garage-admin/analytics/route.ts`
```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'GARAGE_OWNER') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }  // ❌ Returns 401
    );
  }
  
  // ... rest of the code
}
```

---

## Why This Happens

### Scenario 1: User Not Logged In
- User navigates to `/garage-admin/analytics` without logging in
- `useSession()` returns `{ data: null, status: 'unauthenticated' }`
- Page should redirect to `/signin` (line 84)
- But if redirect doesn't work, `fetchAnalytics()` is called anyway
- API returns 401 because `getServerSession()` returns `null`

### Scenario 2: Session Lost
- User was logged in but session expired
- `useSession()` returns `{ data: null, status: 'unauthenticated' }`
- Same flow as Scenario 1

### Scenario 3: Wrong User Role
- User is logged in but is a CUSTOMER, not GARAGE_OWNER
- `useSession()` returns session with `role: 'CUSTOMER'`
- Page redirects to `/dashboard` (line 89)
- But if redirect doesn't work, API still returns 401

---

## Solution

### Step 1: Ensure User is Logged In

Navigate to `/signin` and log in with garage owner credentials:

**Test Credentials:**
```
Email: smithsmotorservices@garage.com
Password: garage123
```

Or use any garage owner email from the seed data.

### Step 2: Verify Session

After logging in, the session should be available:
```typescript
const { data: session } = useSession();
// session should be:
// {
//   user: {
//     id: "...",
//     email: "smithsmotorservices@garage.com",
//     name: "Smith's Motor Services",
//     role: "GARAGE_OWNER"
//   },
//   expires: "..."
// }
```

### Step 3: Access Analytics Page

Once logged in, navigate to `/garage-admin/analytics`:
- Page should NOT redirect to `/signin`
- `fetchAnalytics()` should be called
- API should return 200 with analytics data

---

## Testing

### Test 1: Unauthenticated Access
```bash
curl -X GET "http://localhost:3002/api/garage-admin/analytics"
# Expected: 401 Unauthorized
```

### Test 2: Authenticated Access
```bash
# After logging in via browser, the session cookie is set
# Subsequent requests from the browser will include the cookie
# API should return 200 with analytics data
```

### Test 3: Wrong Role
```bash
# Log in as CUSTOMER
# Navigate to /garage-admin/analytics
# Expected: Redirect to /dashboard
```

---

## Implementation Details

### Authentication Flow

1. **User logs in** → NextAuth creates JWT token
2. **Token stored** → HTTP-only cookie (next-auth.session-token)
3. **Page loads** → `useSession()` reads cookie and returns session
4. **API called** → Browser automatically includes cookie in request
5. **API validates** → `getServerSession()` reads cookie and validates JWT
6. **Response returned** → 200 with data or 401 if invalid

### Key Files

- **Page:** `src/app/garage-admin/analytics/page.tsx`
- **API:** `src/app/api/garage-admin/analytics/route.ts`
- **Auth Config:** `src/lib/auth.ts`
- **Auth Handler:** `src/app/api/auth/[...nextauth]/route.ts`

---

## Troubleshooting

### Issue: Still getting 401 after logging in

**Possible Causes:**
1. Session cookie not being set
2. NEXTAUTH_SECRET not configured
3. NEXTAUTH_URL not matching current URL
4. Browser cookies disabled

**Solutions:**
1. Check browser DevTools → Application → Cookies
2. Look for `next-auth.session-token` cookie
3. Verify `.env.local` has `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
4. Check browser cookie settings

### Issue: Redirect to /signin not working

**Possible Causes:**
1. `useRouter()` not working in client component
2. Redirect happening but page still renders
3. Race condition between redirect and API call

**Solutions:**
1. Ensure page is marked with `'use client'`
2. Add loading state while redirecting
3. Check browser console for errors

---

## Expected Behavior

### Correct Flow
```
1. User not logged in
   ↓
2. Navigate to /garage-admin/analytics
   ↓
3. Page detects no session
   ↓
4. Redirect to /signin
   ↓
5. User logs in
   ↓
6. Redirect to /garage-admin/analytics
   ↓
7. Page detects session with GARAGE_OWNER role
   ↓
8. Call fetchAnalytics()
   ↓
9. API validates session
   ↓
10. API returns 200 with analytics data
    ↓
11. Page displays analytics
```

---

## Status

**Current Status:** ✅ Working as Designed

The 401 error is expected behavior when:
- User is not authenticated
- User's role is not GARAGE_OWNER
- Session has expired

**Action Required:** User must log in with valid garage owner credentials

---

**Last Updated:** Outubro 22, 2025
**Version:** 1.0


