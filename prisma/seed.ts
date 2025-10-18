import { PrismaClient, UserRole, FuelType, BookingStatus, PaymentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// British names for customers
const CUSTOMER_NAMES = [
  'James Smith', 'Oliver Johnson', 'George Williams', 'Harry Brown', 'Jack Jones',
  'Jacob Miller', 'Charlie Davis', 'Thomas Wilson', 'Oscar Moore', 'William Taylor',
  'Emily Anderson', 'Olivia Thomas', 'Amelia Jackson', 'Isla White', 'Ava Harris',
  'Jessica Martin', 'Poppy Thompson', 'Sophie Garcia', 'Isabella Martinez', 'Mia Robinson',
  'Noah Clark', 'Alfie Rodriguez', 'Leo Lewis', 'Freddie Lee', 'Arthur Walker',
  'Archie Hall', 'Henry Allen', 'Theodore Young', 'Lucas Hernandez', 'Alexander King'
]

// British garage names
const GARAGE_DATA = [
  // Stevenage garages
  { name: "Smith's Motor Services", city: 'Stevenage', postcode: 'SG1 1AA', address: '45 High Street, Stevenage' },
  { name: "Stevenage Auto Centre", city: 'Stevenage', postcode: 'SG1 2BB', address: '12 London Road, Stevenage' },
  { name: "Quick Fit MOT & Service", city: 'Stevenage', postcode: 'SG2 7HG', address: '78 Fairlands Way, Stevenage' },
  { name: "Town Centre Garage", city: 'Stevenage', postcode: 'SG1 3XY', address: '23 Queensway, Stevenage' },
  { name: "Broadwater Motors", city: 'Stevenage', postcode: 'SG2 8UT', address: '156 Broadwater Crescent, Stevenage' },
  
  // Hitchin garages
  { name: "Hitchin MOT Centre", city: 'Hitchin', postcode: 'SG4 9AA', address: '34 Bancroft, Hitchin' },
  { name: "High Street Auto Repairs", city: 'Hitchin', postcode: 'SG5 1AT', address: '89 High Street, Hitchin' },
  { name: "Walsworth Road Garage", city: 'Hitchin', postcode: 'SG4 9SP', address: '67 Walsworth Road, Hitchin' },
  { name: "Hitchin Vehicle Services", city: 'Hitchin', postcode: 'SG5 2DA', address: '145 Cambridge Road, Hitchin' },
  { name: "The MOT Workshop", city: 'Hitchin', postcode: 'SG4 0TW', address: '22 Bedford Road, Hitchin' }
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

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
]

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

// Generate random date between two dates
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
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
        motPrice: 54.85,
        retestPrice: 27.43,
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

  // Create bookings
  console.log('📅 Creating bookings...')
  const bookingStatuses = [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW]
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
  const threeMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate())
  
  let bookingCount = 0

  // Ensure each customer has 1-2 bookings
  for (const customer of customers) {
    const customerVehicles = allVehicles.filter(v => v.ownerId === customer.id)
    const numBookings = Math.floor(Math.random() * 2) + 1 // 1-2 bookings per customer
    
    for (let b = 0; b < numBookings; b++) {
      const garage = garages[Math.floor(Math.random() * garages.length)]
      const vehicle = customerVehicles[Math.floor(Math.random() * customerVehicles.length)]
      const isPast = Math.random() > 0.4 // 60% past, 40% future
      const bookingDate = isPast 
        ? randomDate(sixMonthsAgo, now)
        : randomDate(new Date(now.getTime() + 86400000), threeMonthsAhead) // Tomorrow onwards
      
      let status = isPast 
        ? bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)]
        : Math.random() > 0.5 ? BookingStatus.CONFIRMED : BookingStatus.PENDING
      
      await prisma.booking.create({
        data: {
          date: bookingDate,
          timeSlot: TIME_SLOTS[Math.floor(Math.random() * TIME_SLOTS.length)],
          status,
          totalPrice: garage.motPrice,
          customerId: customer.id,
          garageId: garage.id,
          vehicleId: vehicle.id,
          paymentStatus: status === BookingStatus.COMPLETED ? PaymentStatus.PAID : PaymentStatus.PENDING,
          paidAt: status === BookingStatus.COMPLETED ? bookingDate : null
        }
      })
      
      bookingCount++
    }
  }

  console.log(`✅ Created ${bookingCount} bookings\n`)

  console.log('✨ Database seeding completed successfully!\n')
  console.log('📊 Summary:')
  console.log(`   - ${customers.length} customer users`)
  console.log(`   - ${garages.length} garage owners`)
  console.log(`   - ${allVehicles.length} vehicles`)
  console.log(`   - ${garages.length} garages`)
  console.log(`   - ${bookingCount} bookings`)
  console.log('\n🔑 Test Credentials:')
  console.log('   Customer: any email from SEED_DATA_CREDENTIALS.md / password: password123')
  console.log('   Garage: any garage email from SEED_DATA_CREDENTIALS.md / password: garage123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

