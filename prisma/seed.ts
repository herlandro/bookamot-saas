import { PrismaClient, UserRole, FuelType, BookingStatus, PaymentStatus, ReviewerType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Customer comments about garages (positive, 4-5 stars)
const CUSTOMER_COMMENTS = [
  'Great service, very professional team!',
  'Quick and efficient MOT test. Highly recommend!',
  'Friendly staff and fair pricing. Will return!',
  'Excellent experience from start to finish.',
  'Very thorough inspection, explained everything clearly.',
  'Best MOT centre in the area. Fast and reliable.',
  'Professional service at a reasonable price.',
  'Staff were helpful and the process was smooth.',
  'Clean facilities and friendly reception.',
  'Got my car in and out quickly. Great job!',
  'Very impressed with the quality of service.',
  'Honest and trustworthy garage. Recommended!',
  'Easy booking process and punctual service.',
  'No hidden fees, transparent pricing. Excellent!',
  'The mechanics really know their stuff.',
  'Fantastic customer service throughout.',
  'Will definitely use again. Top notch!',
  'Very professional and efficient team.',
  'Great value for money MOT service.',
  'Couldn\'t be happier with the service received.'
]

// Garage comments about customers (positive, 4-5 stars)
const GARAGE_COMMENTS = [
  'Punctual and polite customer. Pleasure to serve!',
  'Vehicle was clean and well-maintained.',
  'Easy to work with, clear communication.',
  'Arrived on time and very courteous.',
  'Great customer, car was in good condition.',
  'Pleasant customer, straightforward service.',
  'Professional and respectful. Welcome back anytime!',
  'On-time arrival, well-prepared with documents.',
  'Friendly customer, vehicle well cared for.',
  'Excellent communication throughout the booking.',
  'Polite and patient during the inspection.',
  'Car owner who clearly values vehicle maintenance.',
  'Prompt payment and very appreciative.',
  'A pleasure to work with. Very organised.',
  'Friendly and understanding customer.',
  'Great attitude, left positive impression.',
  'Responsible car owner, vehicle in good nick.',
  'Courteous and arrived exactly on schedule.',
  'Wonderful customer, hope to see again!',
  'Very respectful and easy-going. Five stars!'
]

// British names for customers
const CUSTOMER_NAMES = [
  'James Smith', 'Oliver Johnson', 'George Williams', 'Harry Brown', 'Jack Jones',
  'Jacob Miller', 'Charlie Davis', 'Thomas Wilson', 'Oscar Moore', 'William Taylor',
  'Emily Anderson', 'Olivia Thomas', 'Amelia Jackson', 'Isla White', 'Ava Harris',
  'Jessica Martin', 'Poppy Thompson', 'Sophie Garcia', 'Isabella Martinez', 'Mia Robinson',
  'Noah Clark', 'Alfie Rodriguez', 'Leo Lewis', 'Freddie Lee', 'Arthur Walker',
  'Archie Hall', 'Henry Allen', 'Theodore Young', 'Lucas Hernandez', 'Alexander King'
]

// British garage names with unique MOT prices
const GARAGE_DATA = [
  // Stevenage garages
  { name: "Smith's Motor Services", city: 'Stevenage', postcode: 'SG1 1AA', address: '45 High Street, Stevenage', motPrice: 45.00 },
  { name: "Stevenage Auto Centre", city: 'Stevenage', postcode: 'SG1 2BB', address: '12 London Road, Stevenage', motPrice: 39.99 },
  { name: "Quick Fit MOT & Service", city: 'Stevenage', postcode: 'SG2 7HG', address: '78 Fairlands Way, Stevenage', motPrice: 54.85 },
  { name: "Town Centre Garage", city: 'Stevenage', postcode: 'SG1 3XY', address: '23 Queensway, Stevenage', motPrice: 35.50 },
  { name: "Broadwater Motors", city: 'Stevenage', postcode: 'SG2 8UT', address: '156 Broadwater Crescent, Stevenage', motPrice: 42.00 },

  // Hitchin garages
  { name: "Hitchin MOT Centre", city: 'Hitchin', postcode: 'SG4 9AA', address: '34 Bancroft, Hitchin', motPrice: 29.99 },
  { name: "High Street Auto Repairs", city: 'Hitchin', postcode: 'SG5 1AT', address: '89 High Street, Hitchin', motPrice: 48.75 },
  { name: "Walsworth Road Garage", city: 'Hitchin', postcode: 'SG4 9SP', address: '67 Walsworth Road, Hitchin', motPrice: 25.00 },
  { name: "Hitchin Vehicle Services", city: 'Hitchin', postcode: 'SG5 2DA', address: '145 Cambridge Road, Hitchin', motPrice: 37.50 },
  { name: "The MOT Workshop", city: 'Hitchin', postcode: 'SG4 0TW', address: '22 Bedford Road, Hitchin', motPrice: 32.00 }
]

// UK vehicle makes and models
const VEHICLE_DATA = [
  { make: 'Ford', model: 'Fiesta', fuelType: FuelType.PETROL },
  { make: 'Ford', model: 'Focus', fuelType: FuelType.DIESEL },
  { make: 'Vauxhall', model: 'Corsa', fuelType: FuelType.PETROL },
  { make: 'Vauxhall', model: 'Astra', fuelType: FuelType.DIESEL },
  { make: 'Volkswagen', model: 'Golf', fuelType: FuelType.PETROL },
  { make: 'Volkswagen', model: 'Polo', fuelType: FuelType.PETROL },
  { make: 'BMW', model: '3 Series', fuelType: FuelType.DIESEL },
  { make: 'Mercedes-Benz', model: 'C-Class', fuelType: FuelType.DIESEL },
  { make: 'Audi', model: 'A3', fuelType: FuelType.PETROL },
  { make: 'Toyota', model: 'Corolla', fuelType: FuelType.HYBRID },
  { make: 'Honda', model: 'Civic', fuelType: FuelType.PETROL },
  { make: 'Nissan', model: 'Qashqai', fuelType: FuelType.DIESEL },
  { make: 'Peugeot', model: '208', fuelType: FuelType.PETROL },
  { make: 'Renault', model: 'Clio', fuelType: FuelType.PETROL },
  { make: 'Mini', model: 'Cooper', fuelType: FuelType.PETROL },
  { make: 'Tesla', model: 'Model 3', fuelType: FuelType.ELECTRIC },
  { make: 'Hyundai', model: 'i30', fuelType: FuelType.PETROL },
  { make: 'Kia', model: 'Sportage', fuelType: FuelType.DIESEL },
  { make: 'Mazda', model: 'CX-5', fuelType: FuelType.PETROL },
  { make: 'Skoda', model: 'Octavia', fuelType: FuelType.DIESEL }
]

const COLORS = ['Black', 'White', 'Silver', 'Blue', 'Red', 'Grey', 'Green', 'Yellow', 'Orange', 'Brown']

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

// December 2025 dates for bookings (excluding Sundays)
const DECEMBER_2025_DATES: Date[] = []
for (let day = 1; day <= 31; day++) {
  const date = new Date(2025, 11, day) // Month is 0-indexed, so 11 = December
  // Skip Sundays (day 0) - garages are closed
  if (date.getDay() !== 0) {
    DECEMBER_2025_DATES.push(date)
  }
}

// Track booked slots to prevent double bookings: Map<garageId-YYYY-MM-DD-timeSlot, true>
const bookedSlots = new Map<string, boolean>()

// Helper to format date as YYYY-MM-DD
function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Check if a slot is available and book it if so
function tryBookSlot(garageId: string, date: Date, timeSlot: string): boolean {
  const key = `${garageId}-${formatDateKey(date)}-${timeSlot}`
  if (bookedSlots.has(key)) {
    return false
  }
  bookedSlots.set(key, true)
  return true
}

// Get a random available slot for a garage
function getAvailableSlot(garageId: string, blockedDays: Set<string>): { date: Date, timeSlot: string } | null {
  // Try up to 100 times to find an available slot
  for (let attempt = 0; attempt < 100; attempt++) {
    const date = DECEMBER_2025_DATES[Math.floor(Math.random() * DECEMBER_2025_DATES.length)]
    const dateKey = formatDateKey(date)

    // Skip blocked days
    if (blockedDays.has(dateKey)) {
      continue
    }

    // Check Saturday - only slots until 13:00
    const isSaturday = date.getDay() === 6
    const availableSlots = isSaturday
      ? TIME_SLOTS.filter(slot => parseInt(slot.split(':')[0]) < 13)
      : TIME_SLOTS

    const timeSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)]

    if (tryBookSlot(garageId, date, timeSlot)) {
      return { date, timeSlot }
    }
  }
  return null
}

// Postcode to coordinates mapping (more precise)
const POSTCODE_COORDINATES: { [key: string]: { lat: number, lng: number } } = {
  'SG1 1AA': { lat: 51.9025, lng: -0.2021 },
  'SG1 2BB': { lat: 51.9015, lng: -0.2035 },
  'SG2 7HG': { lat: 51.9050, lng: -0.1990 },
  'SG1 3XY': { lat: 51.9010, lng: -0.2010 },
  'SG2 8UT': { lat: 51.9060, lng: -0.2000 },
  'SG4 9AA': { lat: 51.9489, lng: -0.2881 },
  'SG5 1AT': { lat: 51.9501, lng: -0.2795 },
  'SG4 9SP': { lat: 51.9475, lng: -0.2900 },
  'SG5 2DA': { lat: 51.9520, lng: -0.2780 },
  'SG4 0TW': { lat: 51.9460, lng: -0.2920 }
}

// Generate realistic UK registration number
function generateRegistration(): string {
  const formats = [
    () => {
      // Current format: AB12 CDE (2001-present)
      const letters1 = String.fromCharCode(65 + Math.floor(Math.random() * 26), 65 + Math.floor(Math.random() * 26))
      const numbers = String(Math.floor(Math.random() * 70) + 1).padStart(2, '0')
      const letters2 = String.fromCharCode(65 + Math.floor(Math.random() * 26), 65 + Math.floor(Math.random() * 26), 65 + Math.floor(Math.random() * 26))
      return `${letters1}${numbers} ${letters2}`
    },
    () => {
      // Prefix format: A123 BCD (1983-2001)
      const letter1 = String.fromCharCode(65 + Math.floor(Math.random() * 26))
      const numbers = String(Math.floor(Math.random() * 900) + 100)
      const letters2 = String.fromCharCode(65 + Math.floor(Math.random() * 26), 65 + Math.floor(Math.random() * 26), 65 + Math.floor(Math.random() * 26))
      return `${letter1}${numbers} ${letters2}`
    }
  ]
  
  return formats[Math.floor(Math.random() * formats.length)]()
}

// Hash password
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function main() {
  console.log('🌱 Starting database seeding...\n')

  // Clear existing data (in correct order to respect foreign keys)
  console.log('🗑️  Cleaning existing data...')
  await prisma.review.deleteMany()
  await prisma.motResult.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.garageTimeSlotBlock.deleteMany()
  await prisma.garageScheduleException.deleteMany()
  await prisma.garageSchedule.deleteMany()
  await prisma.motHistory.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.garage.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Existing data cleaned\n')

  // Create customer users with vehicles
  console.log('👥 Creating 30 customer users...')
  const customerPassword = await hashPassword('password123')
  const customers: any[] = []
  const allVehicles: any[] = []

  for (let i = 0; i < 30; i++) {
    const name = CUSTOMER_NAMES[i]
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: customerPassword,
        role: UserRole.CUSTOMER,
        phone: `07${Math.floor(Math.random() * 900000000 + 100000000)}`
      }
    })
    
    customers.push(user)
    
    // Create 1-3 vehicles per user
    const numVehicles = Math.floor(Math.random() * 3) + 1
    for (let v = 0; v < numVehicles; v++) {
      const vehicleTemplate = VEHICLE_DATA[Math.floor(Math.random() * VEHICLE_DATA.length)]
      const year = Math.floor(Math.random() * 15) + 2010 // 2010-2024
      
      const vehicle = await prisma.vehicle.create({
        data: {
          registration: generateRegistration(),
          make: vehicleTemplate.make,
          model: vehicleTemplate.model,
          year,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          fuelType: vehicleTemplate.fuelType,
          engineSize: vehicleTemplate.fuelType === FuelType.ELECTRIC ? null : `${Math.floor(Math.random() * 20 + 10) / 10}L`,
          mileage: Math.floor(Math.random() * 100000) + 10000,
          ownerId: user.id
        }
      })
      
      allVehicles.push({ ...vehicle, ownerId: user.id })
    }
  }
  console.log(`✅ Created ${customers.length} customers with ${allVehicles.length} vehicles\n`)

  // Create garage owners and garages
  console.log('🏢 Creating 10 garages with owners...')
  const garagePassword = await hashPassword('garage123')
  const garages: any[] = []

  for (let i = 0; i < GARAGE_DATA.length; i++) {
    const garageInfo = GARAGE_DATA[i]
    const ownerName = `${garageInfo.name.split(' ')[0]} Owner`
    const email = `${garageInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@garage.com`
    
    const owner = await prisma.user.create({
      data: {
        name: ownerName,
        email,
        password: garagePassword,
        role: UserRole.GARAGE_OWNER,
        phone: `01438${Math.floor(Math.random() * 900000 + 100000)}`
      }
    })

    // Get precise coordinates for this postcode
    const coordinates = POSTCODE_COORDINATES[garageInfo.postcode] || {
      lat: garageInfo.city === 'Stevenage' ? 51.9025 : 51.9489,
      lng: -0.2021
    }

    const garage = await prisma.garage.create({
      data: {
        name: garageInfo.name,
        email,
        phone: `01438${Math.floor(Math.random() * 900000 + 100000)}`,
        address: garageInfo.address,
        city: garageInfo.city,
        postcode: garageInfo.postcode,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        description: `Professional MOT testing and vehicle servicing in ${garageInfo.city}. DVLA approved test centre.`,
        motLicenseNumber: `MOT-${String(i + 1).padStart(6, '0')}`,
        dvlaApproved: true,
        isActive: true,
        motPrice: garageInfo.motPrice, // Use unique price from GARAGE_DATA
        retestPrice: Math.round(garageInfo.motPrice * 0.5 * 100) / 100, // Retest is 50% of MOT price
        ownerId: owner.id,
        openingHours: {
          monday: { open: '09:00', close: '17:30' },
          tuesday: { open: '09:00', close: '17:30' },
          wednesday: { open: '09:00', close: '17:30' },
          thursday: { open: '09:00', close: '17:30' },
          friday: { open: '09:00', close: '17:30' },
          saturday: { open: '09:00', close: '13:00' },
          sunday: { open: null, close: null }
        }
      }
    })

    // Create garage schedules (Monday = 1, Tuesday = 2, ..., Sunday = 0)
    const scheduleData = [
      { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '17:30', slotDuration: 60 }, // Monday
      { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '17:30', slotDuration: 60 }, // Tuesday
      { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '17:30', slotDuration: 60 }, // Wednesday
      { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '17:30', slotDuration: 60 }, // Thursday
      { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '17:30', slotDuration: 60 }, // Friday
      { dayOfWeek: 6, isOpen: true, openTime: '09:00', closeTime: '13:00', slotDuration: 60 }, // Saturday
      { dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '17:00', slotDuration: 60 }, // Sunday (closed)
    ]

    for (const schedule of scheduleData) {
      await prisma.garageSchedule.create({
        data: {
          garageId: garage.id,
          ...schedule
        }
      })
    }

    garages.push(garage)
  }
  console.log(`✅ Created ${garages.length} garages with schedules\n`)

  // Create schedule exceptions (Christmas block + random blocked days)
  console.log('📅 Creating schedule exceptions...')
  const CHRISTMAS_2025 = new Date(2025, 11, 25) // December 25, 2025
  const garageBlockedDays: Map<string, Set<string>> = new Map()
  let exceptionCount = 0

  for (const garage of garages) {
    const blockedDays = new Set<string>()

    // Block Christmas Day for all garages
    await prisma.garageScheduleException.create({
      data: {
        garageId: garage.id,
        date: CHRISTMAS_2025,
        isClosed: true,
        reason: 'Christmas Day - Closed'
      }
    })
    blockedDays.add(formatDateKey(CHRISTMAS_2025))
    exceptionCount++

    // Add 5-10 random blocked days in December 2025 (excluding Christmas and Sundays)
    const numRandomBlocks = Math.floor(Math.random() * 6) + 5 // 5-10 blocks
    const availableDays = DECEMBER_2025_DATES.filter(d => formatDateKey(d) !== formatDateKey(CHRISTMAS_2025))

    // Shuffle and pick random days
    const shuffledDays = [...availableDays].sort(() => Math.random() - 0.5)
    const daysToBlock = shuffledDays.slice(0, numRandomBlocks)

    for (const blockDate of daysToBlock) {
      const reasons = [
        'Staff Training Day',
        'Equipment Maintenance',
        'Bank Holiday',
        'Owner Holiday',
        'Deep Cleaning',
        'System Upgrade',
        'Annual Inspection'
      ]

      await prisma.garageScheduleException.create({
        data: {
          garageId: garage.id,
          date: blockDate,
          isClosed: true,
          reason: reasons[Math.floor(Math.random() * reasons.length)]
        }
      })
      blockedDays.add(formatDateKey(blockDate))
      exceptionCount++
    }

    garageBlockedDays.set(garage.id, blockedDays)
  }
  console.log(`✅ Created ${exceptionCount} schedule exceptions\n`)

  // Create bookings - 5-10 per customer in December 2025
  console.log('📅 Creating bookings in December 2025...')
  const bookingStatuses = [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW]

  let bookingCount = 0

  for (const customer of customers) {
    const customerVehicles = allVehicles.filter(v => v.ownerId === customer.id)
    const numBookings = Math.floor(Math.random() * 6) + 5 // 5-10 bookings per customer

    for (let b = 0; b < numBookings; b++) {
      const garage = garages[Math.floor(Math.random() * garages.length)]
      const vehicle = customerVehicles[Math.floor(Math.random() * customerVehicles.length)]
      const blockedDays = garageBlockedDays.get(garage.id) || new Set()

      // Find an available slot
      const slot = getAvailableSlot(garage.id, blockedDays)
      if (!slot) {
        console.log(`  ⚠️ Could not find available slot for customer ${customer.name}`)
        continue
      }

      // Randomize status
      const status = bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)]

      await prisma.booking.create({
        data: {
          date: slot.date,
          timeSlot: slot.timeSlot,
          status,
          totalPrice: garage.motPrice,
          customerId: customer.id,
          garageId: garage.id,
          vehicleId: vehicle.id,
          paymentStatus: status === BookingStatus.COMPLETED ? PaymentStatus.PAID : PaymentStatus.PENDING,
          paidAt: status === BookingStatus.COMPLETED ? slot.date : null
        }
      })

      bookingCount++
    }
  }

  console.log(`✅ Created ${bookingCount} bookings\n`)

  // Create bidirectional reviews for completed bookings
  console.log('⭐ Creating bidirectional reviews for completed bookings...')

  // Fetch all completed bookings
  const completedBookings = await prisma.booking.findMany({
    where: { status: BookingStatus.COMPLETED },
    include: {
      customer: true,
      garage: true
    }
  })

  let customerReviewCount = 0
  let garageReviewCount = 0

  // Track ratings for updating averages
  const garageRatings: Map<string, number[]> = new Map()
  const customerRatings: Map<string, number[]> = new Map()

  for (const booking of completedBookings) {
    // Random review date: 1-7 days after the booking date
    const reviewDate = new Date(booking.date)
    reviewDate.setDate(reviewDate.getDate() + Math.floor(Math.random() * 7) + 1)

    // Decide review scenario for this booking:
    // - 30% chance: no reviews
    // - 25% chance: only customer review
    // - 15% chance: only garage review
    // - 30% chance: both reviews (bidirectional)
    const scenario = Math.random()

    const createCustomerReview = scenario > 0.30 && scenario <= 0.55 || scenario > 0.70
    const createGarageReview = scenario > 0.55 && scenario <= 0.70 || scenario > 0.70

    // Create customer review (customer reviewing garage)
    if (createCustomerReview) {
      const rating = Math.random() < 0.80 ? 5 : 4
      const comment = CUSTOMER_COMMENTS[Math.floor(Math.random() * CUSTOMER_COMMENTS.length)]

      await prisma.review.create({
        data: {
          rating,
          comment,
          reviewerType: ReviewerType.CUSTOMER,
          customerId: booking.customerId,
          garageId: booking.garageId,
          bookingId: booking.id,
          createdAt: reviewDate
        }
      })

      // Track garage rating (garages receive ratings from customers)
      if (!garageRatings.has(booking.garageId)) {
        garageRatings.set(booking.garageId, [])
      }
      garageRatings.get(booking.garageId)!.push(rating)
      customerReviewCount++
    }

    // Create garage review (garage reviewing customer)
    if (createGarageReview) {
      const rating = Math.random() < 0.80 ? 5 : 4
      const comment = GARAGE_COMMENTS[Math.floor(Math.random() * GARAGE_COMMENTS.length)]

      // Garage reviews the customer a bit later
      const garageReviewDate = new Date(reviewDate)
      garageReviewDate.setHours(garageReviewDate.getHours() + Math.floor(Math.random() * 48) + 1)

      await prisma.review.create({
        data: {
          rating,
          comment,
          reviewerType: ReviewerType.GARAGE,
          customerId: booking.customerId,
          garageId: booking.garageId,
          bookingId: booking.id,
          createdAt: garageReviewDate
        }
      })

      // Track customer rating (customers receive ratings from garages)
      if (!customerRatings.has(booking.customerId)) {
        customerRatings.set(booking.customerId, [])
      }
      customerRatings.get(booking.customerId)!.push(rating)
      garageReviewCount++
    }
  }

  console.log(`✅ Created ${customerReviewCount} customer reviews and ${garageReviewCount} garage reviews\n`)

  // Update garage average ratings (from customer reviews)
  console.log('📊 Updating average ratings...')
  for (const [garageId, ratings] of garageRatings) {
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length
    await prisma.garage.update({
      where: { id: garageId },
      data: {
        averageRating: Math.round(avgRating * 100) / 100,
        totalReviews: ratings.length
      }
    })
  }

  // Update customer (user) average ratings (from garage reviews)
  for (const [customerId, ratings] of customerRatings) {
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length
    await prisma.user.update({
      where: { id: customerId },
      data: {
        averageRating: Math.round(avgRating * 100) / 100,
        totalReviews: ratings.length
      }
    })
  }
  console.log(`✅ Updated ratings for ${garageRatings.size} garages and ${customerRatings.size} customers\n`)

  // Create admin user
  console.log('👤 Creating admin user...')
  const adminPassword = await hashPassword('admin123')
  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'herlandroh@gmail.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      phone: '07000000000'
    }
  })
  console.log('✅ Admin user created\n')

  console.log('✨ Database seeding completed successfully!\n')
  console.log('📊 Summary:')
  console.log(`   - ${customers.length} customer users`)
  console.log(`   - ${garages.length} garage owners`)
  console.log(`   - 1 admin user`)
  console.log(`   - ${allVehicles.length} vehicles`)
  console.log(`   - ${garages.length} garages`)
  console.log(`   - ${exceptionCount} schedule exceptions`)
  console.log(`   - ${bookingCount} bookings`)
  console.log(`   - ${customerReviewCount + garageReviewCount} reviews (${customerReviewCount} from customers, ${garageReviewCount} from garages)`)
  console.log('\n🔑 Test Credentials:')
  console.log('   Customer: any email from SEED_DATA_CREDENTIALS.md / password: password123')
  console.log('   Garage: any garage email from SEED_DATA_CREDENTIALS.md / password: garage123')
  console.log('   Admin: herlandroh@gmail.com / password: admin123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

