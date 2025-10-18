# Geocoding Service

## Overview

The geocoding service converts addresses and postcodes into geographic coordinates (latitude/longitude) dynamically, without relying on hardcoded values. This enables distance-based garage search and automatic coordinate assignment during garage registration.

---

## Architecture

### Core Components

1. **Geocoding Service** (`src/lib/geocoding.ts`)
   - Main function: `geocodeAddress(address: string)`
   - Multiple geocoding strategies
   - Database caching

2. **Search API** (`src/app/api/garages/search/route.ts`)
   - Uses geocoding service
   - Calculates distances between coordinates
   - Sorts results by proximity

3. **Garage Registration** (`src/app/api/auth/register/route.ts`)
   - Automatically geocodes addresses during registration
   - Extracts city and postcode from address
   - Saves coordinates to database

---

## Geocoding Strategies

The system uses **3 strategies** in priority order:

### 1️⃣ **Exact Database Match**

```typescript
// Search for garage with exact postcode
const garage = await prisma.garage.findFirst({
  where: {
    postcode: { equals: postcode, mode: 'insensitive' },
    latitude: { not: null },
    longitude: { not: null }
  }
})
```

**Advantages:**
- ✅ Fastest (no external calls)
- ✅ Most accurate (real coordinates from registered garages)
- ✅ No rate limits

**Example:**
- Search: "SG2 7HG"
- Finds: Quick Fit MOT & Service (51.905, -0.199)

---

### 2️⃣ **Area Database Match**

```typescript
// If exact match fails, search by area (first 3 characters)
const postcodeArea = cleanPostcode.substring(0, 3) // "SG2"
const areaGarage = await prisma.garage.findFirst({
  where: {
    postcode: { startsWith: postcodeArea, mode: 'insensitive' },
    latitude: { not: null },
    longitude: { not: null }
  }
})
```

**Advantages:**
- ✅ Works for partial postcodes
- ✅ Uses coordinates from nearby garages
- ✅ No external calls

**Example:**
- Search: "SG2 XXX" (unregistered postcode)
- Finds: Any garage with "SG2*" → Uses its coordinates

---

### 3️⃣ **External API (Nominatim/OpenStreetMap)**

```typescript
const url = `https://nominatim.openstreetmap.org/search?q=${address}, UK&format=json&limit=1&countrycodes=gb`
const response = await fetch(url, {
  headers: { 'User-Agent': 'BookAMOT-SaaS/1.0' }
})
```

**Advantages:**
- ✅ Free (no API key required)
- ✅ Works for any UK address
- ✅ Robust fallback

**Limitations:**
- ⚠️ Rate limit: 1 request/second
- ⚠️ Requires internet connection

**Example:**
- Search: "10 Downing Street, London"
- API returns: (51.5034, -0.1276)

---

## Garage Search Flow

```
User enters postcode/address
         ↓
[Geocoding]
    ├─ 1. Exact DB match → Found? → Use coordinates
    ├─ 2. Area DB match → Found? → Use coordinates
    └─ 3. Nominatim API → Found? → Use coordinates
         ↓
[Distance Calculation]
    - Haversine formula
    - Distance in miles
         ↓
[Sorting]
    - By distance (ascending)
    - Nearest garages first
         ↓
[Return]
    - Sorted list of garages
    - With calculated distances
```

---

## Garage Registration Process

### Automatic Geocoding

When a garage is registered via `/api/auth/register`:

1. **Receives full address**
   ```
   Example: "78 Fairlands Way, Stevenage, SG2 7HG"
   ```

2. **Extracts city and postcode**
   ```typescript
   // UK postcode regex
   const postcodeRegex = /\b[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}\b/i
   const postcodeMatch = address.match(postcodeRegex)
   
   // Extract city (part before postcode)
   const addressParts = address.split(',')
   const city = addressParts[addressParts.length - 2]
   ```

3. **Geocodes the address**
   ```typescript
   const coords = await geocodeAddress(address)
   // Returns: { lat: 51.905, lng: -0.199 }
   ```

4. **Saves to database**
   ```typescript
   await prisma.garage.create({
     data: {
       name: garageName,
       address,
       city,           // Extracted
       postcode,       // Extracted
       latitude: coords?.lat,   // Geocoded
       longitude: coords?.lng,  // Geocoded
       // ... other fields
     }
   })
   ```

---

## Robustness Guarantees

### 1. **Optional Schema Fields**

```prisma
model Garage {
  latitude  Float?  // Optional
  longitude Float?  // Optional
  city      String  // Required (but can be "Unknown")
  postcode  String  // Required (but can be "N/A")
}
```

### 2. **Fallbacks at All Levels**

**Geocoding:**
- ✅ Exact DB → Area DB → External API → `null`
- ✅ Never crashes, always returns something or `null`

**City/Postcode Extraction:**
- ✅ Regex fails → Use default values
- ✅ `city = "Unknown"`, `postcode = "N/A"`

**Garage Search:**
- ✅ No coordinates → Text search (name, city, postcode)
- ✅ With coordinates → Sort by distance

### 3. **No Registration Errors**

**Scenario 1: Complete valid address**
```
Input: "78 Fairlands Way, Stevenage, SG2 7HG"
✅ city = "Stevenage"
✅ postcode = "SG2 7HG"
✅ coords = (51.905, -0.199)
```

**Scenario 2: Address without postcode**
```
Input: "Main Street, London"
✅ city = "London"
⚠️ postcode = "N/A"
✅ coords = (51.5074, -0.1278) via API
```

**Scenario 3: Invalid address**
```
Input: "asdfghjkl"
⚠️ city = "Unknown"
⚠️ postcode = "N/A"
⚠️ coords = null
✅ Garage is created anyway!
```

---

## Garage Search Behavior

### With Coordinates

```typescript
// User searches: "SG2 7HG"
// System geocodes → (51.905, -0.199)
// Calculates distances:
[
  { name: "Quick Fit MOT", distance: 0.00 },
  { name: "Broadwater Motors", distance: 0.13 },
  { name: "Smith's Motor Services", distance: 0.35 }
]
```

### Without Coordinates (Text Search)

```typescript
// User searches: "Smith"
// System cannot geocode
// Text search:
WHERE name LIKE '%Smith%' 
   OR city LIKE '%Smith%'
   OR postcode LIKE '%Smith%'
   OR address LIKE '%Smith%'
```

---

## Logging and Debug

The system provides detailed logs for troubleshooting:

```
🔍 Geocoding: "SG2 7HG"
🗄️ Database geocoding: SG2 7HG → SG2 7HG (51.905, -0.199)
📍 Geocoded location: SG2 7HG → { lat: 51.905, lng: -0.199 }
🏢 Found 10 garages in database
📍 Quick Fit MOT & Service: 0.00 miles from search location
📍 Broadwater Motors: 0.13 miles from search location
📏 Filtering by distance (radius: 25 miles)
✅ 10 garages within radius
📤 Returning 10 garages
```

---

## Benefits

1. **✅ No Hardcoding**
   - Coordinates come from database
   - New garages automatically add new postcodes

2. **✅ Scalable**
   - More garages = better coverage
   - Database acts as cache

3. **✅ Robust**
   - Multiple fallbacks
   - Never crashes, always returns something

4. **✅ Accurate**
   - Uses real coordinates from registered garages
   - External API for unknown addresses

5. **✅ Performance**
   - Database lookup is very fast
   - External API only when necessary

---

## Maintenance

### Add New Postcode
**Not necessary!** The system is automatic:
1. Register a garage with the new postcode
2. System geocodes automatically
3. Future searches will use these coordinates

### Update Coordinates
```sql
UPDATE "Garage" 
SET latitude = 51.9050, longitude = -0.1990 
WHERE postcode = 'SG2 7HG';
```

### Check Garages Without Coordinates
```sql
SELECT name, address, postcode 
FROM "Garage" 
WHERE latitude IS NULL OR longitude IS NULL;
```

---

## Implementation Files

1. **`src/lib/geocoding.ts`** - Geocoding service
2. **`src/app/api/garages/search/route.ts`** - Search API
3. **`src/app/api/auth/register/route.ts`** - Garage registration

---

## API Reference

### geocodeAddress()

```typescript
async function geocodeAddress(address: string): Promise<Coordinates | null>
```

**Parameters:**
- `address` - Full address or postcode (e.g., "SG2 7HG" or "10 Downing Street, London")

**Returns:**
- `{ lat: number, lng: number }` - Coordinates if found
- `null` - If geocoding fails

**Example:**
```typescript
const coords = await geocodeAddress("SG2 7HG")
// Returns: { lat: 51.905, lng: -0.199 }
```

---

## Related Documentation

- `app-flows/garage-registration-flow.md` - Garage registration process
- `app-flows/onboarding-flow.md` - Location step uses geocoding
- `database-schema.md` - Garage model schema

