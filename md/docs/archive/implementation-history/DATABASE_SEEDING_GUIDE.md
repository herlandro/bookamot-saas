# Database Seeding Guide

Complete guide for seeding and managing test data in the BookaMOT database.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Available Scripts](#available-scripts)
4. [Quick Start](#quick-start)
5. [Detailed Usage](#detailed-usage)
6. [Seed Data Structure](#seed-data-structure)
7. [Customization](#customization)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Overview

The BookaMOT seeding system provides:

- ✅ **30 customer users** with realistic British names
- ✅ **30-90 vehicles** (1-3 per customer) with valid UK registrations
- ✅ **10 garages** (5 in Stevenage, 5 in Hitchin) with DVLA approval
- ✅ **10 garage owner accounts**
- ✅ **30-60 bookings** distributed across past and future dates
- ✅ **Realistic UK data** (postcodes, phone numbers, addresses)
- ✅ **Various booking statuses** (PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)

---

## Prerequisites

Before running the seeding scripts, ensure you have:

1. **Node.js** installed (v18 or higher)
2. **PostgreSQL** database running
3. **Environment variables** configured (`.env` file with `DATABASE_URL`)
4. **Dependencies installed:**
   ```bash
   npm install
   ```

5. **Prisma migrations applied:**
   ```bash
   npx prisma migrate deploy
   ```

---

## Available Scripts

### 1. Seed Database
```bash
npm run db:seed
```
**What it does:**
- Clears existing data
- Creates 30 customer users
- Creates 10 garage owners and garages
- Creates 30-90 vehicles
- Creates 30-60 bookings
- Logs progress and summary

**When to use:**
- First time setup
- After database migrations
- When you need fresh test data

**Output:**
```
🌱 Starting database seeding...
🗑️  Cleaning existing data...
✅ Existing data cleaned
👥 Creating 30 customer users...
✅ Created 30 customers with 65 vehicles
🏢 Creating 10 garages with owners...
✅ Created 10 garages
📅 Creating bookings...
✅ Created 45 bookings
✨ Database seeding completed successfully!
```

---

### 2. Clean Database
```bash
npm run db:clean
```
**What it does:**
- Prompts for confirmation
- Deletes ALL data from database
- Preserves database schema (tables remain)
- Shows deletion summary

**When to use:**
- Before manual data entry
- To start completely fresh
- To remove all test data

**⚠️ Warning:** This action cannot be undone!

**Output:**
```
⚠️  WARNING: This will delete ALL data from the database!
Are you sure you want to continue? (yes/no): yes

🗑️  Starting database cleanup...
   Deleting reviews...
   ✅ Deleted 0 reviews
   Deleting bookings...
   ✅ Deleted 45 bookings
   ...
✨ Database cleaned successfully!
```

---

### 3. Reset Database
```bash
npm run db:reset
```
**What it does:**
- Prompts for confirmation
- Cleans all existing data
- Runs the seed script
- Provides fresh, complete dataset

**When to use:**
- Quick reset during development
- After breaking changes
- To restore known good state

**⚠️ Warning:** This action cannot be undone!

**Output:**
```
⚠️  WARNING: This will delete ALL data and reseed the database!
Are you sure you want to continue? (yes/no): yes

🔄 Starting database reset...
📍 Step 1/2: Cleaning database...
✅ Database cleaned successfully!
📍 Step 2/2: Seeding database...
[Seed script output...]
✨ Database reset completed successfully!
```

---

## Quick Start

### First Time Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Apply database migrations:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Seed the database:**
   ```bash
   npm run db:seed
   ```

4. **Login and test:**
   - Customer: `james.smith@example.com` / `password123`
   - Garage: `smithsmotorservices@garage.com` / `garage123`

### Daily Development

**Reset database with fresh data:**
```bash
npm run db:reset
```

**Just clean without reseeding:**
```bash
npm run db:clean
```

**Add more data to existing:**
```bash
npm run db:seed
```
(Note: This will duplicate data if run multiple times)

---

## Detailed Usage

### Seed Script (`prisma/seed.ts`)

**Location:** `prisma/seed.ts`

**Features:**
- Idempotent (cleans before seeding)
- Progress logging
- Error handling
- Realistic data generation
- Referential integrity

**Data Generated:**

1. **Customer Users (30)**
   - British names
   - Email: `firstname.lastname@example.com`
   - Password: `password123` (hashed with bcrypt)
   - Phone: UK mobile format (07xxx)
   - Role: `CUSTOMER`

2. **Vehicles (30-90)**
   - 1-3 vehicles per customer
   - UK registration formats (AB12 CDE, A123 BCD)
   - Popular UK makes: Ford, Vauxhall, VW, BMW, etc.
   - Years: 2010-2024
   - Fuel types: Petrol, Diesel, Electric, Hybrid
   - Realistic mileage: 10,000-110,000

3. **Garage Owners (10)**
   - Email: `garagename@garage.com`
   - Password: `garage123` (hashed with bcrypt)
   - Phone: UK landline format (01438xxx)
   - Role: `GARAGE_OWNER`

4. **Garages (10)**
   - 5 in Stevenage (SG1, SG2 postcodes)
   - 5 in Hitchin (SG4, SG5 postcodes)
   - DVLA approved: `true`
   - Active: `true`
   - MOT price: £54.85
   - Retest price: £27.43
   - Opening hours: Mon-Fri 09:00-17:30, Sat 09:00-13:00
   - Realistic addresses and coordinates

5. **Bookings (30-60)**
   - 1-2 bookings per customer
   - 60% past bookings (6 months ago to yesterday)
   - 40% future bookings (tomorrow to 3 months ahead)
   - Various statuses: PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
   - Time slots: 09:00-17:30 in 30-minute intervals
   - Linked to valid customer, vehicle, and garage

---

### Clean Script (`scripts/db-clean.ts`)

**Location:** `scripts/db-clean.ts`

**Features:**
- Confirmation prompt
- Ordered deletion (respects foreign keys)
- Detailed logging
- Summary statistics

**Deletion Order:**
1. Reviews
2. MOT Results
3. Bookings
4. Garage Time Slot Blocks
5. Garage Schedule Exceptions
6. Garage Schedules
7. MOT History
8. Vehicles
9. Garages
10. Accounts
11. Sessions
12. Verification Tokens
13. Users

**Safety:**
- Requires explicit "yes" confirmation
- Can be cancelled with any other input
- Shows count of deleted records

---

### Reset Script (`scripts/db-reset.ts`)

**Location:** `scripts/db-reset.ts`

**Features:**
- Combines clean + seed
- Single confirmation prompt
- Progress indicators
- Complete automation

**Process:**
1. Prompt for confirmation
2. Clean database (delete all data)
3. Run seed script
4. Show completion message

---

## Seed Data Structure

### Customer Users

```typescript
{
  name: "James Smith",
  email: "james.smith@example.com",
  password: "password123", // bcrypt hashed
  role: "CUSTOMER",
  phone: "07123456789"
}
```

### Vehicles

```typescript
{
  registration: "AB12 CDE",
  make: "Ford",
  model: "Fiesta",
  year: 2020,
  color: "Blue",
  fuelType: "PETROL",
  engineSize: "1.2L",
  mileage: 45000,
  ownerId: "user_id"
}
```

### Garages

```typescript
{
  name: "Smith's Motor Services",
  email: "smithsmotorservices@garage.com",
  phone: "01438123456",
  address: "45 High Street, Stevenage",
  city: "Stevenage",
  postcode: "SG1 1AA",
  latitude: 51.9012,
  longitude: -0.1987,
  motLicenseNumber: "MOT-000001",
  dvlaApproved: true,
  isActive: true,
  motPrice: 54.85,
  retestPrice: 27.43,
  ownerId: "owner_id",
  openingHours: { /* ... */ }
}
```

### Bookings

```typescript
{
  date: "2024-10-20T00:00:00.000Z",
  timeSlot: "10:00",
  status: "CONFIRMED",
  totalPrice: 54.85,
  customerId: "customer_id",
  garageId: "garage_id",
  vehicleId: "vehicle_id",
  paymentStatus: "PENDING"
}
```

---

## Customization

### Change Number of Customers

Edit `prisma/seed.ts`:

```typescript
// Change from 30 to desired number
const CUSTOMER_NAMES = [
  // Add more names here
]
```

### Change Passwords

Edit `prisma/seed.ts`:

```typescript
// Line ~115
const customerPassword = await hashPassword('your_password')

// Line ~165
const garagePassword = await hashPassword('your_password')
```

### Add More Garages

Edit `prisma/seed.ts`:

```typescript
const GARAGE_DATA = [
  // Add more garage entries
  { 
    name: "New Garage", 
    city: 'Stevenage', 
    postcode: 'SG1 4XX', 
    address: '100 New Street, Stevenage' 
  }
]
```

### Adjust Booking Distribution

Edit `prisma/seed.ts`:

```typescript
// Line ~200: Change bookings per customer
const numBookings = Math.floor(Math.random() * 3) + 1 // 1-3 bookings

// Line ~202: Change past/future ratio
const isPast = Math.random() > 0.5 // 50/50 split
```

### Add More Vehicle Makes

Edit `prisma/seed.ts`:

```typescript
const VEHICLE_DATA = [
  // Add more vehicle templates
  { make: 'Jaguar', model: 'XE', fuelType: FuelType.DIESEL }
]
```

---

## Troubleshooting

### Error: "Cannot find module 'tsx'"

**Solution:**
```bash
npm install tsx --save-dev
```

### Error: "Database connection failed"

**Solution:**
1. Check `.env` file has correct `DATABASE_URL`
2. Ensure PostgreSQL is running
3. Test connection: `npx prisma db pull`

### Error: "Foreign key constraint violation"

**Solution:**
- Run `npm run db:clean` first
- Then run `npm run db:seed`
- Or use `npm run db:reset` (does both)

### Error: "Unique constraint violation"

**Solution:**
- Database already has data
- Run `npm run db:clean` to remove existing data
- Or run `npm run db:reset` to clean and reseed

### Seed script hangs or times out

**Solution:**
1. Check database connection
2. Ensure no other processes are locking the database
3. Increase timeout in Prisma client
4. Check database logs for errors

---

## Best Practices

### Development

1. **Use `db:reset` frequently** during active development
2. **Don't modify seed data manually** - update the seed script instead
3. **Keep credentials simple** for test data (password123, garage123)
4. **Document any custom changes** to seed scripts

### Testing

1. **Reset before each test suite** for consistent state
2. **Use known test accounts** from credentials doc
3. **Don't rely on specific IDs** - they change on each seed
4. **Test with various user types** (customer, garage owner)

### Production

1. **Never run seed scripts in production**
2. **Use migrations for schema changes**
3. **Create separate production data scripts** if needed
4. **Keep seed scripts in version control**

---

## Summary

**Quick Commands:**

```bash
# First time setup
npm install
npx prisma migrate deploy
npm run db:seed

# Daily development
npm run db:reset

# Clean only
npm run db:clean

# Seed only
npm run db:seed
```

**Test Credentials:**
- Customer: `james.smith@example.com` / `password123`
- Garage: `smithsmotorservices@garage.com` / `garage123`

**Full credentials:** See `md/docs/SEED_DATA_CREDENTIALS.md`

---

**Happy Seeding! 🌱**

