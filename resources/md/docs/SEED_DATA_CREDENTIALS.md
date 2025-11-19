# Seed Data Credentials

This document contains all login credentials for the seeded test data in the BookaMOT database.

---

## 🔑 Quick Test Accounts

For quick testing, use these recommended accounts:

### Customer Account (Multiple Vehicles)
- **Email:** `james.smith@example.com`
- **Password:** `password123`
- **Vehicles:** 1-3 vehicles registered
- **Bookings:** Has past and future bookings

### Garage Owner - Stevenage
- **Email:** `smithsmotorservices@garage.com`
- **Password:** `garage123`
- **Garage:** Smith's Motor Services
- **Location:** Stevenage, SG1 1AA

### Garage Owner - Hitchin
- **Email:** `hitchinmotcentre@garage.com`
- **Password:** `garage123`
- **Garage:** Hitchin MOT Centre
- **Location:** Hitchin, SG4 9AA

---

## 👥 Customer Users (30 Total)

All customer accounts use the password: **`password123`**

| # | Name | Email | Vehicles |
|---|------|-------|----------|
| 1 | James Smith | james.smith@example.com | 1-3 |
| 2 | Oliver Johnson | oliver.johnson@example.com | 1-3 |
| 3 | George Williams | george.williams@example.com | 1-3 |
| 4 | Harry Brown | harry.brown@example.com | 1-3 |
| 5 | Jack Jones | jack.jones@example.com | 1-3 |
| 6 | Jacob Miller | jacob.miller@example.com | 1-3 |
| 7 | Charlie Davis | charlie.davis@example.com | 1-3 |
| 8 | Thomas Wilson | thomas.wilson@example.com | 1-3 |
| 9 | Oscar Moore | oscar.moore@example.com | 1-3 |
| 10 | William Taylor | william.taylor@example.com | 1-3 |
| 11 | Emily Anderson | emily.anderson@example.com | 1-3 |
| 12 | Olivia Thomas | olivia.thomas@example.com | 1-3 |
| 13 | Amelia Jackson | amelia.jackson@example.com | 1-3 |
| 14 | Isla White | isla.white@example.com | 1-3 |
| 15 | Ava Harris | ava.harris@example.com | 1-3 |
| 16 | Jessica Martin | jessica.martin@example.com | 1-3 |
| 17 | Poppy Thompson | poppy.thompson@example.com | 1-3 |
| 18 | Sophie Garcia | sophie.garcia@example.com | 1-3 |
| 19 | Isabella Martinez | isabella.martinez@example.com | 1-3 |
| 20 | Mia Robinson | mia.robinson@example.com | 1-3 |
| 21 | Noah Clark | noah.clark@example.com | 1-3 |
| 22 | Alfie Rodriguez | alfie.rodriguez@example.com | 1-3 |
| 23 | Leo Lewis | leo.lewis@example.com | 1-3 |
| 24 | Freddie Lee | freddie.lee@example.com | 1-3 |
| 25 | Arthur Walker | arthur.walker@example.com | 1-3 |
| 26 | Archie Hall | archie.hall@example.com | 1-3 |
| 27 | Henry Allen | henry.allen@example.com | 1-3 |
| 28 | Theodore Young | theodore.young@example.com | 1-3 |
| 29 | Lucas Hernandez | lucas.hernandez@example.com | 1-3 |
| 30 | Alexander King | alexander.king@example.com | 1-3 |

---

## 🏢 Garage Owner Users (10 Total)

All garage owner accounts use the password: **`garage123`**

### Stevenage Garages (5)

| # | Garage Name | Owner Name | Email | Postcode | Address |
|---|-------------|------------|-------|----------|---------|
| 1 | Smith's Motor Services | Smith's Owner | smithsmotorservices@garage.com | SG1 1AA | 45 High Street, Stevenage |
| 2 | Stevenage Auto Centre | Stevenage Owner | stevenageautocentre@garage.com | SG1 2BB | 12 London Road, Stevenage |
| 3 | Quick Fit MOT & Service | Quick Owner | quickfitmotservice@garage.com | SG2 7HG | 78 Fairlands Way, Stevenage |
| 4 | Town Centre Garage | Town Owner | towncentregarage@garage.com | SG1 3XY | 23 Queensway, Stevenage |
| 5 | Broadwater Motors | Broadwater Owner | broadwatermotors@garage.com | SG2 8UT | 156 Broadwater Crescent, Stevenage |

### Hitchin Garages (5)

| # | Garage Name | Owner Name | Email | Postcode | Address |
|---|-------------|------------|-------|----------|---------|
| 6 | Hitchin MOT Centre | Hitchin Owner | hitchinmotcentre@garage.com | SG4 9AA | 34 Bancroft, Hitchin |
| 7 | High Street Auto Repairs | High Owner | highstreetautorepairs@garage.com | SG5 1AT | 89 High Street, Hitchin |
| 8 | Walsworth Road Garage | Walsworth Owner | walsworthroadgarage@garage.com | SG4 9SP | 67 Walsworth Road, Hitchin |
| 9 | Hitchin Vehicle Services | Hitchin Owner | hitchinvehicleservices@garage.com | SG5 2DA | 145 Cambridge Road, Hitchin |
| 10 | The MOT Workshop | The Owner | themotworkshop@garage.com | SG4 0TW | 22 Bedford Road, Hitchin |

---

## 🚗 Vehicle Data

Each customer has **1-3 vehicles** registered with:
- Valid UK registration numbers (various formats)
- Popular UK car makes: Ford, Vauxhall, Volkswagen, BMW, Mercedes-Benz, Audi, Toyota, Honda, Nissan, Peugeot, Renault, Mini, Tesla, Hyundai, Kia, Mazda, Skoda
- Years: 2010-2024
- Fuel types: Petrol, Diesel, Electric, Hybrid, LPG
- Various colors: Black, White, Silver, Blue, Red, Grey, Green, Yellow, Orange, Brown
- Realistic mileage: 10,000 - 110,000 miles

**Total vehicles:** Approximately 30-90 vehicles (1-3 per customer)

---

## 📅 Booking Data

### Booking Distribution

**Total bookings:** Approximately 30-60 bookings (1-2 per customer)

**Date ranges:**
- **Past bookings:** 6 months ago to yesterday (60% of bookings)
- **Future bookings:** Tomorrow to 3 months ahead (40% of bookings)

**Time slots:**
- Morning: 09:00 - 12:00
- Afternoon: 12:00 - 15:00
- Late afternoon: 15:00 - 18:00

**Booking statuses:**
- **PENDING** - Awaiting confirmation
- **CONFIRMED** - Confirmed and scheduled
- **COMPLETED** - MOT test completed
- **CANCELLED** - Booking cancelled
- **NO_SHOW** - Customer didn't show up

**Payment statuses:**
- **PAID** - For completed bookings
- **PENDING** - For upcoming/pending bookings

---

## 🏪 Garage Details

All garages have:
- **DVLA Approved:** Yes (`dvlaApproved: true`)
- **Active:** Yes (`isActive: true`)
- **MOT Price:** £54.85 (UK maximum)
- **Retest Price:** £27.43
- **MOT License Number:** MOT-000001 to MOT-000010

### Opening Hours (All Garages)

| Day | Hours |
|-----|-------|
| Monday | 09:00 - 17:30 |
| Tuesday | 09:00 - 17:30 |
| Wednesday | 09:00 - 17:30 |
| Thursday | 09:00 - 17:30 |
| Friday | 09:00 - 17:30 |
| Saturday | 09:00 - 13:00 |
| Sunday | Closed |

---

## 📊 Database Statistics

After running the seed script, you should have:

| Entity | Count |
|--------|-------|
| **Total Users** | 40 (30 customers + 10 garage owners) |
| **Customer Users** | 30 |
| **Garage Owner Users** | 10 |
| **Vehicles** | 30-90 (1-3 per customer) |
| **Garages** | 10 (5 in Stevenage, 5 in Hitchin) |
| **Bookings** | 30-60 (1-2 per customer) |
| **Reviews** | 0 (can be added manually) |
| **MOT Results** | 0 (can be added manually) |

### Booking Status Breakdown (Approximate)

For past bookings (60% of total):
- **COMPLETED:** ~40%
- **CANCELLED:** ~10%
- **NO_SHOW:** ~5%
- **CONFIRMED:** ~5%

For future bookings (40% of total):
- **CONFIRMED:** ~20%
- **PENDING:** ~20%

---

## 🧪 Testing Scenarios

### Scenario 1: Customer Login and Booking
1. Login as: `james.smith@example.com` / `password123`
2. View your vehicles
3. View your bookings (past and future)
4. Create a new booking

### Scenario 2: Garage Owner Dashboard
1. Login as: `smithsmotorservices@garage.com` / `garage123`
2. View garage dashboard
3. See bookings for your garage
4. Manage garage settings

### Scenario 3: Search for Garages
1. Login as any customer
2. Go to onboarding or search
3. Enter postcode: `SG1 1AA` (Stevenage) or `SG4 9AA` (Hitchin)
4. See list of nearby garages
5. Book an MOT

### Scenario 4: Multiple Vehicles
1. Login as any customer (they all have 1-3 vehicles)
2. View vehicles list
3. Select different vehicles for bookings

---

## 🔄 Resetting the Database

To reset the database with fresh seed data:

```bash
npm run db:reset
```

This will:
1. Delete all existing data
2. Reseed with fresh data
3. Recreate all 30 customers, 10 garages, vehicles, and bookings

---

## 🛠️ Manual Data Manipulation

### Add More Customers
Edit `prisma/seed.ts` and add names to the `CUSTOMER_NAMES` array.

### Add More Garages
Edit `prisma/seed.ts` and add entries to the `GARAGE_DATA` array.

### Change Passwords
Edit `prisma/seed.ts` and modify:
- `customerPassword` (line ~115)
- `garagePassword` (line ~165)

### Adjust Booking Distribution
Edit `prisma/seed.ts` and modify:
- `numBookings` calculation (line ~200)
- Date ranges (lines ~195-197)
- Status distribution (lines ~203-206)

---

## 📝 Notes

- All emails are in the format: `firstname.lastname@example.com` for customers
- All garage emails are in the format: `garagename@garage.com` (no spaces)
- Phone numbers are realistic UK format (07xxx for mobile, 01438 for Stevenage/Hitchin)
- Postcodes are valid for Stevenage (SG1, SG2) and Hitchin (SG4, SG5)
- All data is randomly generated but realistic
- Vehicle registrations follow UK DVLA formats
- Booking times are in 30-minute slots from 09:00 to 17:30

---

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the seed script:**
   ```bash
   npm run db:seed
   ```

3. **Login and test:**
   - Customer: `james.smith@example.com` / `password123`
   - Garage: `smithsmotorservices@garage.com` / `garage123`

4. **Reset if needed:**
   ```bash
   npm run db:reset
   ```

---

**Happy Testing! 🎉**

