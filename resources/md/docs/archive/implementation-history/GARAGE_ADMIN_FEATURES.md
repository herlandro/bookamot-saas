# Garage Admin - Customers & Vehicles Features

## 📋 Overview

Two new features have been added to the Garage Admin panel to help garage owners manage their customers and vehicles:

1. **Customers Management** - View all customers who have made bookings at the garage
2. **Vehicles Management** - View all vehicles that have had bookings at the garage

---

## 🎯 Features Implemented

### 1. Customers Management

**Location**: `/garage-admin/customers`

**Menu Item**: "Clientes" (Customers) with Users icon

**Features**:
- ✅ List all unique customers who have made bookings (excluding cancelled)
- ✅ Display customer information:
  - Name
  - Email
  - Phone number
  - Total number of bookings
  - Last booking date
  - Customer status (active/inactive)
  - Join date
- ✅ Search functionality (by name, email, or phone)
- ✅ Pagination (10 customers per page)
- ✅ Sorting capabilities
- ✅ Filter and export buttons (UI ready)

**API Endpoint**: `GET /api/garage-admin/customers`

**Query Parameters**:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search term (optional)
- `sortBy` - Sort field (default: name)
- `sortOrder` - Sort order: asc or desc (default: asc)

**Response Example**:
```json
{
  "customers": [
    {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "07700123456",
      "totalBookings": 5,
      "lastBookingDate": "2025-10-15",
      "status": "active",
      "joinedDate": "2025-01-10"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### 2. Vehicles Management

**Location**: `/garage-admin/vehicles`

**Menu Item**: "Veículos" (Vehicles) with Car icon

**Features**:
- ✅ List all unique vehicles that have had bookings (excluding cancelled)
- ✅ Display vehicle information:
  - Registration/Plate number
  - Make and model
  - Year
  - Owner name
  - Total number of bookings at this garage
  - Last booking date
  - MOT status (valid, expiring_soon, expired, failed, unknown)
  - Last MOT date
- ✅ Search functionality (by registration, make, model, or owner name)
- ✅ Pagination (10 vehicles per page)
- ✅ Sorting capabilities
- ✅ MOT status badges with color coding:
  - 🟢 Green: MOT Valid
  - 🟡 Yellow: Expiring Soon (within 30 days)
  - 🔴 Red: MOT Expired or Failed
  - ⚪ Gray: Unknown
- ✅ Filter and export buttons (UI ready)

**API Endpoint**: `GET /api/garage-admin/vehicles`

**Query Parameters**:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search term (optional)
- `sortBy` - Sort field (default: registration)
- `sortOrder` - Sort order: asc or desc (default: asc)

**Response Example**:
```json
{
  "vehicles": [
    {
      "id": "vehicle_id",
      "registration": "WJ11USE",
      "make": "Toyota",
      "model": "Prius",
      "year": 2011,
      "ownerName": "John Doe",
      "totalBookings": 3,
      "lastBookingDate": "2025-10-15",
      "motStatus": "valid",
      "lastMotDate": "2025-09-20"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

---

## 🔧 Technical Details

### Files Created

1. **API Endpoints**:
   - `src/app/api/garage-admin/customers/route.ts` - Customers API
   - `src/app/api/garage-admin/vehicles/route.ts` - Vehicles API

2. **Page Components**:
   - `src/app/garage-admin/customers/page.tsx` - Customers page
   - `src/app/garage-admin/vehicles/page.tsx` - Vehicles page

3. **UI Updates**:
   - `src/components/ui/garage-sidebar.tsx` - Added menu items

### Database Queries

**Customers Query**:
- Fetches all unique users who have bookings at the garage
- Excludes cancelled bookings
- Includes booking statistics
- Supports search and pagination

**Vehicles Query**:
- Fetches all unique vehicles that have bookings at the garage
- Excludes cancelled bookings
- Includes MOT history (latest test)
- Calculates MOT status based on expiry date
- Supports search and pagination

### Authentication & Authorization

- ✅ All endpoints require authentication
- ✅ Only GARAGE_OWNER role can access
- ✅ Data is filtered by garage ownership
- ✅ Users can only see their own garage's data

---

## 🧪 Testing

### Manual Testing Steps

1. **Login as Garage Owner**
   - Navigate to `/garage-admin`
   - Verify you see the new menu items in the sidebar

2. **Test Customers Page**
   - Click "Clientes" in the sidebar
   - Verify customers list loads
   - Test search functionality
   - Test pagination
   - Verify customer information is displayed correctly

3. **Test Vehicles Page**
   - Click "Veículos" in the sidebar
   - Verify vehicles list loads
   - Test search functionality
   - Test pagination
   - Verify vehicle information and MOT status badges

4. **Test API Endpoints**
   ```bash
   # Get customers
   curl http://localhost:3002/api/garage-admin/customers \
     -H "Authorization: Bearer YOUR_TOKEN"

   # Get vehicles
   curl http://localhost:3002/api/garage-admin/vehicles \
     -H "Authorization: Bearer YOUR_TOKEN"

   # Search customers
   curl "http://localhost:3002/api/garage-admin/customers?search=john" \
     -H "Authorization: Bearer YOUR_TOKEN"

   # Get second page of vehicles
   curl "http://localhost:3002/api/garage-admin/vehicles?page=2" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

## 📊 Data Filtering

### Customers
- Only shows customers with non-cancelled bookings
- Counts total bookings (excluding cancelled)
- Shows last booking date from non-cancelled bookings
- Status is "active" if has bookings, "inactive" otherwise

### Vehicles
- Only shows vehicles with non-cancelled bookings
- Counts total bookings at this garage (excluding cancelled)
- Shows last booking date from non-cancelled bookings
- MOT status calculated from latest MOT test:
  - **Valid**: PASS result with expiry date > today + 30 days
  - **Expiring Soon**: PASS result with expiry date within 30 days
  - **Expired**: PASS result with expiry date < today
  - **Failed**: FAIL result
  - **Unknown**: No MOT history

---

## 🎨 UI Components Used

- **Card** - Main container
- **Button** - Navigation and actions
- **Input** - Search field
- **Badge** - Status indicators
- **Icons** - Visual indicators (Users, Car, Mail, Phone, Calendar, etc.)
- **Pagination** - Previous/Next buttons

---

## 🔐 Security

- ✅ Authentication required
- ✅ Role-based access control (GARAGE_OWNER only)
- ✅ Data isolation by garage
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (Prisma ORM)

---

## 📈 Performance

- ✅ Pagination to limit data transfer
- ✅ Efficient database queries with proper indexing
- ✅ Lazy loading of related data
- ✅ Optimized search with case-insensitive matching

---

## 🚀 Future Enhancements

1. **Customers Page**:
   - Click customer to view detailed booking history
   - Export customer list to CSV
   - Filter by booking status
   - Sort by different fields
   - Add customer notes/comments

2. **Vehicles Page**:
   - Click vehicle to view detailed booking history
   - Export vehicle list to CSV
   - Filter by MOT status
   - Sort by different fields
   - View MOT history details
   - Schedule MOT reminders

3. **General**:
   - Advanced filtering options
   - Bulk actions (export, email, etc.)
   - Analytics and reporting
   - Customer/vehicle profiles

---

## ✅ Checklist

- [x] Sidebar menu items added
- [x] API endpoints created
- [x] Page components created
- [x] Authentication implemented
- [x] Search functionality working
- [x] Pagination implemented
- [x] MOT status calculation
- [x] Error handling
- [x] Loading states
- [x] Responsive design
- [x] TypeScript types
- [x] No linting errors

---

## 📞 Support

For issues or questions:
1. Check the API response format
2. Verify authentication token
3. Check browser console for errors
4. Review server logs

---

**Status**: ✅ COMPLETE & READY FOR USE

**Last Updated**: 2025-10-19
**Version**: 1.0.0

