import { prisma } from '@/lib/prisma'

// Optimized function to dynamically calculate availability
export async function getAvailableTimeSlotsOptimized(garageId: string, date: Date) {
  const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Get garage opening hours for the day of the week
  const schedule = await prisma.garageSchedule.findUnique({
    where: {
      garageId_dayOfWeek: {
        garageId,
        dayOfWeek
      }
    }
  })
  
  // If no schedule defined or garage is closed, return empty array
  if (!schedule || !schedule.isOpen) {
    return []
  }
  
  // Check if there's an exception for this specific date
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)
  
  const exception = await prisma.garageScheduleException.findUnique({
    where: {
      garageId_date: {
        garageId,
        date: startOfDay
      }
    }
  })
  
  // If there's an exception and garage is closed, return empty array
  if (exception && exception.isClosed) {
    return []
  }
  
  // Use exception hours if they exist, otherwise use default hours
  const openTime = exception?.openTime || schedule.openTime
  const closeTime = exception?.closeTime || schedule.closeTime
  const slotDuration = schedule.slotDuration
  
  // Generate time slots based on opening hours
  const timeSlots = generateTimeSlots(openTime, closeTime, slotDuration)
  
  // Get existing bookings for the day
  const existingBookings = await prisma.booking.findMany({
    where: {
      garageId,
      date: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: {
        in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
      }
    },
    select: {
      timeSlot: true
    }
  })
  
  // Get specific blocks for the day
  const blockedSlots = await prisma.garageTimeSlotBlock.findMany({
    where: {
      garageId,
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    select: {
      timeSlot: true
    }
  })
  
  const bookedTimeSlots = existingBookings.map(booking => booking.timeSlot)
  const blockedTimeSlots = blockedSlots.map((block: { timeSlot: string }) => block.timeSlot)
  const unavailableSlots = [...bookedTimeSlots, ...blockedTimeSlots]
  
  // Filter available slots
  const availableSlots = timeSlots.filter(slot => !unavailableSlots.includes(slot))
  
  return availableSlots
}

// Helper function to generate time slots
function generateTimeSlots(openTime: string, closeTime: string, durationMinutes: number): string[] {
  const slots: string[] = []
  
  const [openHour, openMinute] = openTime.split(':').map(Number)
  const [closeHour, closeMinute] = closeTime.split(':').map(Number)
  
  const openTimeInMinutes = openHour * 60 + openMinute
  const closeTimeInMinutes = closeHour * 60 + closeMinute
  
  for (let time = openTimeInMinutes; time < closeTimeInMinutes; time += durationMinutes) {
    const hours = Math.floor(time / 60)
    const minutes = time % 60
    const timeSlot = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    slots.push(timeSlot)
  }
  
  return slots
}

// Function to create default schedule for a garage
export async function createDefaultScheduleForGarage(garageId: string) {
  const defaultSchedule = [
    { dayOfWeek: 1, isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDuration: 30 }, // Monday
    { dayOfWeek: 2, isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDuration: 30 }, // Tuesday
    { dayOfWeek: 3, isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDuration: 30 }, // Wednesday
    { dayOfWeek: 4, isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDuration: 30 }, // Thursday
    { dayOfWeek: 5, isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDuration: 30 }, // Friday
    { dayOfWeek: 6, isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDuration: 30 }, // Saturday
    { dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '18:00', slotDuration: 30 }, // Sunday (closed)
  ]
  
  for (const schedule of defaultSchedule) {
    await prisma.garageSchedule.upsert({
      where: {
        garageId_dayOfWeek: {
          garageId,
          dayOfWeek: schedule.dayOfWeek
        }
      },
      update: schedule,
      create: {
        garageId,
        ...schedule
      }
    })
  }
}

// Function to migrate existing data
export async function migrateExistingAvailabilityData() {
  console.log('🔄 Starting availability data migration...')
  
  // Get all garages
  const garages = await prisma.garage.findMany({
    select: { id: true, name: true }
  })
  
  for (const garage of garages) {
    console.log(`📝 Creating default schedule for ${garage.name}...`)
    await createDefaultScheduleForGarage(garage.id)
  }
  
  console.log('✅ Migration completed!')
}

// Function to compare performance
export async function comparePerformance(garageId: string, date: Date) {
  console.time('Original Method')
  const originalSlots = await getOriginalAvailableTimeSlots(garageId, date)
  console.timeEnd('Original Method')
  
  console.time('Optimized Method')
  const optimizedSlots = await getAvailableTimeSlotsOptimized(garageId, date)
  console.timeEnd('Optimized Method')
  
  console.log('Original slots:', originalSlots)
  console.log('Optimized slots:', optimizedSlots)
  
  return { originalSlots, optimizedSlots }
}

// Original function for comparison
async function getOriginalAvailableTimeSlots(garageId: string, date: Date) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const bookedSlots = await prisma.booking.findMany({
    where: {
      garageId,
      date: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: {
        in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
      }
    },
    select: {
      timeSlot: true
    }
  })

  const standardSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ]

  const bookedTimeSlots = bookedSlots.map(slot => slot.timeSlot)
  const availableSlots = standardSlots.filter(slot => !bookedTimeSlots.includes(slot))

  return availableSlots
}
