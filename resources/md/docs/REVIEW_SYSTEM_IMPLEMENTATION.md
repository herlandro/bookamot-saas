# Review and Rating System Implementation

## Overview

A comprehensive review and rating system has been implemented for the BookaMOT SaaS application, similar to Airbnb's review flow. This system allows both customers and garages to review each other after an MOT service is completed.

## ✅ Completed Features

### 1. Database Schema Updates
- **File**: `prisma/schema.prisma`
- Added `averageRating` (Float, default 0) and `totalReviews` (Int, default 0) to User model
- Added `averageRating` (Float, default 0) and `totalReviews` (Int, default 0) to Garage model
- Added `reviewerType` (ReviewerType enum) and `updatedAt` (DateTime) to Review model
- Created `ReviewerType` enum with values: CUSTOMER, GARAGE
- Migration: `20251019125539_add_review_system_fields`

### 2. Star Rating Component
- **File**: `src/components/ui/star-rating.tsx`
- `StarRating` component with interactive and display modes
- `StarRatingDisplay` component for showing ratings with review counts
- Supports sizes: sm, md, lg
- Uses Lucide React Star icons with yellow fill for active stars

### 3. Review API Endpoints

#### POST /api/reviews
- Create new review with validation
- Authorization checks (customer can only review garage, garage owner can only review customer)
- Prevents duplicate reviews for same booking
- Automatically calculates and updates average ratings
- **File**: `src/app/api/reviews/route.ts`

#### GET /api/reviews/booking/[bookingId]
- Get review for specific booking
- **File**: `src/app/api/reviews/booking/[bookingId]/route.ts`

#### GET /api/reviews/garage/[garageId]
- Get all reviews for a garage with pagination
- Only returns customer reviews (reviewerType: 'CUSTOMER')
- Includes garage info with average rating and total reviews
- Orders reviews by creation date (newest first)
- **File**: `src/app/api/reviews/garage/[garageId]/route.ts`

#### GET /api/reviews/customer/[customerId]
- Get all reviews for a customer (reviews written by garages)
- Pagination support (page, limit query params)
- **File**: `src/app/api/reviews/customer/[customerId]/route.ts`

#### PATCH /api/reviews/[id]
- Allow users to edit their reviews within 7 days
- Validates that user is the original reviewer
- Recalculates average ratings after update
- **File**: `src/app/api/reviews/[id]/route.ts`

### 4. Review Submission Modal
- **File**: `src/components/reviews/review-submission-modal.tsx`
- Modal component for submitting reviews
- Includes StarRating component for interactive rating input
- Text area for optional comment (max 500 characters)
- Error handling and success feedback
- Triggered when booking status changes to COMPLETED

### 5. Review List Display Component
- **File**: `src/components/reviews/review-list.tsx`
- Displays individual reviews with customer/garage name, rating, comment, and date
- Pagination support
- Loading state
- Empty state message

### 6. Review Flow Integration
- **File**: `src/app/garage-admin/bookings/[id]/page.tsx`
- Review modal automatically triggered when booking status changes to COMPLETED
- Garage owner can review customer after marking booking as completed
- Modal shows customer name and prompts for rating and comment

### 7. Customer Detail Page Enhancements
- **File**: `src/app/garage-admin/customers/[id]/page.tsx`
- Added customer rating card showing average rating and total reviews
- Added reviews section displaying all reviews written by garages about the customer
- Pagination support for reviews
- Updated API endpoint to include rating fields

### 8. Customer API Endpoint Update
- **File**: `src/app/api/garage-admin/customers/[id]/route.ts`
- Updated to include `averageRating` and `totalReviews` fields
- Returns customer rating information for display

### 9. Dialog Component
- **File**: `src/components/ui/dialog.tsx`
- Created reusable Dialog component based on Radix UI
- Used by ReviewSubmissionModal for modal display

### 10. Rating Display on Search Results
- **File**: `src/app/search/page.tsx`
- Already displays garage ratings on search result cards
- Shows average rating and review count
- Uses Star icon with yellow fill

## 🔄 Review System Logic

### Two-Way Review System
- **Customers review Garages**: After booking completion, customer can review the garage and service experience
- **Garages review Customers**: After marking booking as completed, garage owner can review the customer

### Authorization
- Only booking participants can create reviews
- Customer can only review the garage they booked with
- Garage owner can only review the customer who made the booking
- Unique constraint on `bookingId` prevents duplicate reviews

### Rating Calculation
- Automatic calculation of average ratings when reviews are created or updated
- Average ratings stored in User and Garage models for performance
- Recalculated whenever a review is added or modified

### Edit Window
- Users can edit their reviews within 7 days of creation
- After 7 days, reviews become read-only
- Average ratings are recalculated after edits

## 📊 Data Flow

1. **Booking Completion**: Garage owner marks booking as COMPLETED
2. **Review Modal Trigger**: ReviewSubmissionModal appears for garage owner
3. **Review Submission**: Garage owner submits rating and optional comment
4. **Database Update**: Review created, average ratings calculated and stored
5. **Display**: Ratings visible on customer detail page and search results

## 🎯 Next Steps (Not Yet Implemented)

1. **Email Notifications**: Send email when reviews are received
2. **Customer Review Flow**: Create flow for customers to review garages (currently only garage can review customer)
3. **Review Moderation**: Admin tools to moderate or remove inappropriate reviews
4. **Review Analytics**: Dashboard showing review trends and insights
5. **Review Filtering**: Filter reviews by rating, date range, etc.

## 🧪 Testing Recommendations

1. Test review submission with valid and invalid data
2. Test authorization (ensure only booking participants can review)
3. Test duplicate review prevention
4. Test average rating calculation with multiple reviews
5. Test review editing within 7-day window
6. Test review display on customer detail page
7. Test pagination of reviews
8. Test responsive design on mobile devices

## 📝 Translation Status

All text is in English:
- "Rating", "Reviews", "Write a Review", "Average Rating", "No reviews yet"
- "Review submitted successfully!", "Submit Review", "Cancel"
- "Reviews from Garages", "Reviews written by garages about this customer"

## 🔐 Security Considerations

- Server-side authentication checks on all endpoints
- Authorization validation ensures users can only review/edit their own reviews
- Input validation with Zod schemas
- SQL injection prevention through Prisma ORM
- Rate limiting recommended for production

