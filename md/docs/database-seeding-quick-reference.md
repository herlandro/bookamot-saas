# Database Seeding - Quick Reference

## Quick Commands

```bash
# First time setup
npm install
npx prisma migrate deploy
npm run db:seed

# Daily development - reset everything
npm run db:reset

# Clean database only
npm run db:clean

# Seed database only
npm run db:seed
```

---

## Test Credentials

### Customer Account
```
Email: james.smith@example.com
Password: password123
```

### Garage Owner - Stevenage
```
Email: smithsmotorservices@garage.com
Password: garage123
Garage: Smith's Motor Services
Location: Stevenage, SG1 1AA
```

### Garage Owner - Hitchin
```
Email: hitchinmotcentre@garage.com
Password: garage123
Garage: Hitchin MOT Centre
Location: Hitchin, SG4 9AA
```

---

## What Gets Created

| Entity | Count | Details |
|--------|-------|---------|
| **Customers** | 30 | British names, realistic data |
| **Garage Owners** | 10 | 5 Stevenage + 5 Hitchin |
| **Vehicles** | 50-70 | 1-3 per customer, random |
| **Garages** | 10 | All DVLA approved, with coordinates |
| **Garage Schedules** | 70 | Mon-Sat, 09:00-17:00 |
| **Bookings** | 40-50 | Past and future, random |

---

## All Customer Passwords

**Password:** `password123`

**Emails:**
- james.smith@example.com
- oliver.johnson@example.com
- george.williams@example.com
- harry.brown@example.com
- jack.jones@example.com
- jacob.miller@example.com
- charlie.davis@example.com
- thomas.wilson@example.com
- oscar.moore@example.com
- william.taylor@example.com
- emily.anderson@example.com
- olivia.thomas@example.com
- amelia.jackson@example.com
- isla.white@example.com
- ava.harris@example.com
- jessica.martin@example.com
- poppy.thompson@example.com
- sophie.garcia@example.com
- isabella.martinez@example.com
- mia.robinson@example.com
- noah.clark@example.com
- alfie.rodriguez@example.com
- leo.lewis@example.com
- freddie.lee@example.com
- arthur.walker@example.com
- archie.hall@example.com
- henry.allen@example.com
- theodore.young@example.com
- lucas.hernandez@example.com
- alexander.king@example.com

---

## All Garage Passwords

**Password:** `garage123`

### Stevenage Garages (SG1-SG2 postcodes)
- smithsmotorservices@garage.com - Smith's Motor Services
- stevenageautocentre@garage.com - Stevenage Auto Centre
- quickfitmotservice@garage.com - Quick Fit MOT & Service
- towncentregarage@garage.com - Town Centre Garage
- broadwatermotors@garage.com - Broadwater Motors

### Hitchin Garages (SG4-SG5 postcodes)
- hitchinmotcentre@garage.com - Hitchin MOT Centre
- highstreetautorepairs@garage.com - High Street Auto Repairs
- walsworthroadgarage@garage.com - Walsworth Road Garage
- hitchinvehicleservices@garage.com - Hitchin Vehicle Services
- themotworkshop@garage.com - The MOT Workshop

---

## Garage Locations

All garages have **real coordinates** for distance-based search:

### Stevenage Area
| Garage | Postcode | Coordinates |
|--------|----------|-------------|
| Smith's Motor Services | SG1 1AA | 51.9025, -0.2021 |
| Stevenage Auto Centre | SG1 2BX | 51.9010, -0.2050 |
| Quick Fit MOT & Service | SG2 7HG | 51.9050, -0.1990 |
| Town Centre Garage | SG1 3EF | 51.9015, -0.2030 |
| Broadwater Motors | SG2 8UT | 51.9060, -0.2000 |

### Hitchin Area
| Garage | Postcode | Coordinates |
|--------|----------|-------------|
| Hitchin MOT Centre | SG4 9AA | 51.9490, -0.2830 |
| High Street Auto Repairs | SG5 1AT | 51.9450, -0.2800 |
| Walsworth Road Garage | SG4 9SP | 51.9500, -0.2850 |
| Hitchin Vehicle Services | SG5 2DA | 51.9470, -0.2810 |
| The MOT Workshop | SG4 0AL | 51.9495, -0.2835 |

---

## Quick Test Scenarios

### Test Customer Login
1. Go to `/signin`
2. Email: `james.smith@example.com`
3. Password: `password123`
4. View vehicles and bookings in dashboard

### Test Garage Owner Login
1. Go to `/signin`
2. Email: `smithsmotorservices@garage.com`
3. Password: `garage123`
4. View garage dashboard and bookings

### Test Garage Search by Distance
1. Login as customer
2. Go to `/search`
3. Enter postcode: `SG1 1AA` (Stevenage)
4. See garages sorted by distance
5. Nearest: Smith's Motor Services (0.00 miles)

### Test Onboarding Flow
1. Create new customer account
2. Login - should redirect to `/onboarding`
3. Complete all 4 steps
4. Should redirect to `/search` with auto-search

### Test Booking Flow
1. Login as customer (james.smith@example.com)
2. Search for garages
3. Click "Book Now" on any garage
4. Select vehicle and time slot
5. Confirm booking

---

## Database Reset Workflow

### Full Reset (Recommended for Clean Start)
```bash
npm run db:reset
```

**What it does:**
1. Drops all tables
2. Runs all migrations
3. Seeds database with test data

**Use when:**
- Starting fresh
- After schema changes
- Database is corrupted

---

### Clean + Seed (Faster)
```bash
npm run db:clean
npm run db:seed
```

**What it does:**
1. Deletes all data (keeps schema)
2. Seeds database with test data

**Use when:**
- Schema is correct
- Just need fresh data
- Faster than full reset

---

### Seed Only (Fastest)
```bash
npm run db:seed
```

**What it does:**
- Adds test data to existing database

**Use when:**
- Database is empty
- Want to add more test data

**Warning:** May cause unique constraint errors if data already exists

---

## Important Notes

### Security
- ⚠️ All passwords are **simple for testing** (password123, garage123)
- ⚠️ **Never** use these credentials in production
- ⚠️ Change all passwords before deploying

### Data Loss
- ⚠️ Running `db:reset` or `db:clean` **deletes ALL data**
- ⚠️ Always **confirm** before running clean/reset
- ⚠️ **Never** run these scripts in production

### Randomization
- Vehicle assignments are random (1-3 per customer)
- Booking dates are random (past and future)
- Booking times are random (09:00-17:00)
- Each seed run creates slightly different data

---

## Troubleshooting

### "Cannot find module 'tsx'"
```bash
npm install
```

### "Database connection failed"
Check `.env` file has correct `DATABASE_URL`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bookamot"
```

### "Unique constraint violation"
Database already has data. Clean first:
```bash
npm run db:clean
npm run db:seed
```

Or full reset:
```bash
npm run db:reset
```

### "Migration failed"
Reset migrations:
```bash
npx prisma migrate reset --force
npm run db:seed
```

### "Seed script hangs"
Check database connection and kill any hanging processes:
```bash
# Kill Node processes
pkill -f "tsx prisma/seed.ts"

# Try again
npm run db:seed
```

---

## Seed Script Output

Successful seed should show:
```
🌱 Starting database seeding...

🗑️  Cleaning existing data...
✅ Existing data cleaned

👥 Creating 30 customer users...
✅ Created 30 customers with 65 vehicles

🏢 Creating 10 garages with owners...
✅ Created 10 garages with schedules

📅 Creating bookings...
✅ Created 43 bookings

✨ Database seeding completed successfully!

📊 Summary:
   - 30 customer users
   - 10 garage owners
   - 65 vehicles
   - 10 garages
   - 43 bookings

🔑 Test Credentials:
   Customer: any email from SEED_DATA_CREDENTIALS.md / password: password123
   Garage: any garage email from SEED_DATA_CREDENTIALS.md / password: garage123
```

---

## Full Documentation

For more detailed information:

- **All Credentials:** `SEED_DATA_CREDENTIALS.md`
- **Detailed Guide:** `DATABASE_SEEDING_GUIDE.md`
- **Implementation Summary:** `SEEDING_SYSTEM_SUMMARY.md`

---

**Happy Testing! 🎉**

