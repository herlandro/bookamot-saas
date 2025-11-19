# Review System Testing Guide

## Prerequisites
- Dev server running on `http://localhost:3001`
- Database populated with test data
- At least one completed booking available

## Test Scenario 1: Customer Review Flow

### Step 1: Access Dashboard
1. Navigate to `http://localhost:3001/`
2. Login as a customer (if not already logged in)
3. You should see the dashboard with bookings

### Step 2: Find Completed Booking
1. Look for a booking with status "COMPLETED"
2. If no completed booking exists, use the script:
   ```bash
   node scripts/update-booking-to-completed.js
   ```
3. Refresh the page to see the updated booking

### Step 3: Write Review
1. Find the completed booking card
2. Click the "⭐ Write Review" button
3. A modal should open with:
   - Title: "Review [Garage Name]"
   - 5 interactive stars
   - Textarea for comment (max 500 characters)
   - Submit button

### Step 4: Submit Review
1. Click on stars to select rating (1-5)
2. (Optional) Type a comment
3. Click "Submit Review"
4. Modal should close and show success message
5. Button should change to "⭐ Review Submitted" (outline style)

### Step 5: Verify Review in Reviews Page
1. Click "Reviews" in sidebar
2. Ensure "Customer Reviews" tab is selected
3. Your review should appear with:
   - Garage name
   - Star rating
   - Comment (if provided)
   - Date of review
   - Booking reference

## Test Scenario 2: Garage Review Flow

### Step 1: Access Garage Admin
1. Navigate to `http://localhost:3001/garage-admin`
2. Login as a garage owner (if not already logged in)
3. Go to "Bookings" section

### Step 2: Find Booking to Complete
1. Find a booking with status "CONFIRMED"
2. Click on the booking to open details

### Step 3: Mark as Completed
1. On the booking detail page, find the status button
2. Click "Mark as Completed" or similar button
3. ReviewSubmissionModal should automatically open
4. Modal should show:
   - Title: "Review [Customer Name]"
   - 5 interactive stars
   - Textarea for comment
   - Submit button

### Step 4: Submit Review
1. Click on stars to select rating (1-5)
2. (Optional) Type a comment
3. Click "Submit Review"
4. Modal should close
5. Review should be saved

### Step 5: Verify Review in Garage Reviews Page
1. Click "Reviews" in sidebar
2. Click "Garage Reviews" tab
3. Your review should appear with:
   - Customer name
   - Star rating
   - Comment (if provided)
   - Date of review
   - Booking reference

## Test Scenario 3: Review Display in Booking Details

### Step 1: Customer Booking Detail
1. Go to `/bookings` page
2. Find a completed booking
3. Click on it to open details
4. Scroll to "Reviews" section
5. Should show review from garage (if exists)

### Step 2: Garage Admin Booking Detail
1. Go to `/garage-admin/bookings`
2. Find a completed booking
3. Click on it to open details
4. Scroll to "Reviews" section
5. Should show review from customer (if exists)

## Test Scenario 4: Pagination

### Step 1: Create Multiple Reviews
1. Create at least 11 reviews (to test pagination)
2. Use multiple bookings and accounts if needed

### Step 2: Test Pagination
1. Go to `/reviews` page
2. Should show first 10 reviews
3. Click "Next" button at bottom
4. Should show next page of reviews
5. Click "Previous" button
6. Should return to first page

## Test Scenario 5: Authorization

### Step 1: Verify Authorization
1. Login as Customer A
2. Try to access a booking from Customer B
3. Should not be able to write review for that booking

### Step 2: Verify One Review Per Booking
1. Write a review for a booking
2. Try to write another review for the same booking
3. Should get error: "Review already exists for this booking"

## Expected Results

✅ **All Tests Pass When:**
- Reviews are created successfully
- Reviews appear in `/reviews` page
- Reviews appear in booking detail pages
- Button states change correctly
- Pagination works
- Authorization is enforced
- Average ratings are updated
- No duplicate reviews allowed

## Troubleshooting

### Issue: "Write Review" button not appearing
- **Solution**: Ensure booking status is "COMPLETED"
- **Solution**: Refresh the page

### Issue: Modal not opening
- **Solution**: Check browser console for errors
- **Solution**: Ensure ReviewSubmissionModal component is imported

### Issue: Review not appearing in list
- **Solution**: Refresh the `/reviews` page
- **Solution**: Check that review was actually submitted (check console)

### Issue: Authorization error
- **Solution**: Ensure you're logged in as the correct user
- **Solution**: Verify booking belongs to your account

## Database Queries for Testing

### Check Reviews in Database
```sql
SELECT * FROM "Review" ORDER BY "createdAt" DESC;
```

### Check User Average Ratings
```sql
SELECT id, name, "averageRating", "totalReviews" FROM "User";
```

### Check Garage Average Ratings
```sql
SELECT id, name, "averageRating", "totalReviews" FROM "Garage";
```

## Performance Notes

- Reviews page loads 10 reviews per page
- Pagination is implemented for scalability
- Average ratings are cached in User/Garage models
- No N+1 queries (reviews include related data)

