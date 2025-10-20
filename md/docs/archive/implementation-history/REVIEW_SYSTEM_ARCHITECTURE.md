# Review System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Next.js)                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  /reviews Page   │  │  Dashboard       │                 │
│  │  - List Reviews  │  │  - Write Review  │                 │
│  │  - Pagination    │  │  - Button        │                 │
│  └──────────────────┘  └──────────────────┘                 │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ReviewSubmissionModal                               │   │
│  │  - Star Rating Input                                 │   │
│  │  - Comment Textarea                                  │   │
│  │  - Submit Handler                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  BookingReviewsSection                               │   │
│  │  - Display Review for Booking                        │   │
│  │  - Show Rating, Comment, Reviewer Info              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js Routes)               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  POST /api/reviews                                           │
│  - Create new review                                         │
│  - Validate authorization                                    │
│  - Update average ratings                                    │
│                                                               │
│  GET /api/reviews/received                                   │
│  - Fetch reviews received by user/garage                     │
│  - Support pagination                                        │
│  - Filter by user type                                       │
│                                                               │
│  GET /api/reviews/booking/[bookingId]                        │
│  - Fetch review for specific booking                         │
│                                                               │
│  PATCH /api/reviews/[id]                                     │
│  - Update existing review                                    │
│  - Recalculate ratings                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer (Prisma)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  Review Table    │  │  User Table      │                 │
│  │  - id            │  │  - id            │                 │
│  │  - rating        │  │  - averageRating │                 │
│  │  - comment       │  │  - totalReviews  │                 │
│  │  - reviewerType  │  └──────────────────┘                 │
│  │  - createdAt     │                                        │
│  │  - bookingId     │  ┌──────────────────┐                 │
│  │  - customerId    │  │  Garage Table    │                 │
│  │  - garageId      │  │  - id            │                 │
│  └──────────────────┘  │  - averageRating │                 │
│                        │  - totalReviews  │                 │
│                        └──────────────────┘                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Creating a Review

```
1. User clicks "Write Review" button
   ↓
2. ReviewSubmissionModal opens
   ↓
3. User selects rating and comment
   ↓
4. User clicks "Submit Review"
   ↓
5. POST /api/reviews with:
   {
     bookingId: string,
     rating: number (1-5),
     comment: string (optional),
     reviewerType: "CUSTOMER" | "GARAGE"
   }
   ↓
6. Backend validates:
   - User is authenticated
   - User is booking participant
   - No existing review for booking
   ↓
7. Create Review record in database
   ↓
8. Calculate new average rating:
   - Get all reviews for reviewed entity
   - Sum ratings / count
   - Update User/Garage averageRating
   ↓
9. Return success response
   ↓
10. Frontend closes modal and refreshes data
```

### Fetching Reviews

```
1. User navigates to /reviews page
   ↓
2. Component mounts and calls:
   GET /api/reviews/received?page=1&limit=10&userType=CUSTOMER
   ↓
3. Backend:
   - Gets user ID from session
   - Determines user type (CUSTOMER or GARAGE)
   - Queries reviews where:
     - customerId = user.id AND reviewerType = GARAGE (for customers)
     - OR garageId in user.garages AND reviewerType = CUSTOMER (for garages)
   - Applies pagination
   - Includes related data (customer, garage, booking)
   ↓
4. Returns paginated reviews with metadata
   ↓
5. Frontend displays reviews with pagination controls
```

## Component Hierarchy

```
MainLayout
├── Sidebar
│   └── Reviews Menu Item → /reviews
│
Dashboard
├── Bookings Section
│   └── Booking Card
│       └── Write Review Button
│           └── ReviewSubmissionModal
│
/reviews Page
├── User Type Toggle (Customer/Garage)
├── Reviews List
│   └── Review Card (repeated)
│       ├── Reviewer Name
│       ├── Star Rating
│       ├── Comment
│       ├── Date
│       └── Booking Info
└── Pagination Controls

Booking Detail Page (Garage Admin)
├── Booking Info
├── Customer Info
├── Vehicle Info
└── BookingReviewsSection
    └── Review Display
        ├── Star Rating
        ├── Comment
        ├── Reviewer Info
        └── Date
```

## API Endpoints

### POST /api/reviews
**Create Review**
- **Auth**: Required
- **Body**: 
  ```json
  {
    "bookingId": "string",
    "rating": 1-5,
    "comment": "string (optional)",
    "reviewerType": "CUSTOMER" | "GARAGE"
  }
  ```
- **Response**: Review object with related data
- **Errors**: 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 400 (Duplicate)

### GET /api/reviews/received
**Get Received Reviews**
- **Auth**: Required
- **Query Params**:
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
  - `userType`: "CUSTOMER" | "GARAGE"
- **Response**: 
  ```json
  {
    "reviews": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
  ```

### GET /api/reviews/booking/[bookingId]
**Get Review for Booking**
- **Auth**: Not required
- **Response**: Review object or 404
- **Includes**: Customer, Garage, Booking details

### PATCH /api/reviews/[id]
**Update Review**
- **Auth**: Required
- **Body**: 
  ```json
  {
    "rating": 1-5 (optional),
    "comment": "string (optional)"
  }
  ```
- **Response**: Updated Review object
- **Constraints**: Only within 7 days of creation

## Database Schema

### Review Model
```prisma
model Review {
  id            String       @id @default(cuid())
  rating        Int          // 1-5 stars
  comment       String?      // Optional comment
  reviewerType  ReviewerType // CUSTOMER or GARAGE
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  // Relations
  customerId String
  customer   User    @relation(fields: [customerId], references: [id], onDelete: Cascade)
  garageId   String
  garage     Garage  @relation(fields: [garageId], references: [id], onDelete: Cascade)
  bookingId  String  @unique  // One review per booking
  booking    Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([customerId])
  @@index([garageId])
  @@index([bookingId])
}

enum ReviewerType {
  CUSTOMER
  GARAGE
}
```

## Performance Considerations

1. **Pagination**: Reviews page loads 10 at a time
2. **Caching**: Average ratings cached in User/Garage models
3. **Indexing**: Indexes on customerId, garageId, bookingId
4. **Unique Constraint**: Prevents duplicate reviews per booking
5. **Eager Loading**: Related data included in queries

## Security

1. **Authorization**: Only booking participants can review
2. **Validation**: Rating must be 1-5, comment max 1000 chars
3. **Unique Constraint**: One review per booking enforced at DB level
4. **Session Check**: All endpoints require authentication
5. **Role-Based**: Different views for customers vs garage owners

