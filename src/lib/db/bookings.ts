import { prisma } from '@/lib/prisma'
import { BookingStatus, PaymentStatus, Prisma } from '@prisma/client'

export interface CreateBookingData {
  customerId: string
  garageId: string
  vehicleId: string
  date: Date
  timeSlot: string
  totalPrice: number
  notes?: string
}

export interface UpdateBookingData {
  status?: BookingStatus
  paymentStatus?: PaymentStatus
  notes?: string
  stripePaymentIntentId?: string
  paidAt?: Date
}

export interface BookingFilters {
  customerId?: string
  garageId?: string
  status?: BookingStatus
  paymentStatus?: PaymentStatus
  dateFrom?: Date
  dateTo?: Date
}

// Create a new booking
export async function createBooking(data: CreateBookingData) {
  // First, check if the time slot is available
  const existingBooking = await prisma.booking.findFirst({
    where: {
      garageId: data.garageId,
      date: data.date,
      timeSlot: data.timeSlot,
      status: {
        in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
      }
    }
  })

  if (existingBooking) {
    throw new Error('Time slot is already booked')
  }

  // Create the booking
  const booking = await prisma.booking.create({
    data: {
      customerId: data.customerId,
      garageId: data.garageId,
      vehicleId: data.vehicleId,
      date: data.date,
      timeSlot: data.timeSlot,
      totalPrice: data.totalPrice,
      notes: data.notes,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        }
      },
      garage: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
        }
      },
      vehicle: true
    }
  })

  // Update garage availability
  await prisma.garageAvailability.upsert({
    where: {
      garageId_date_timeSlot: {
        garageId: data.garageId,
        date: data.date,
        timeSlot: data.timeSlot
      }
    },
    update: {
      isBooked: true
    },
    create: {
      garageId: data.garageId,
      date: data.date,
      timeSlot: data.timeSlot,
      isBooked: true
    }
  })

  return booking
}

// Get booking by ID
export async function getBookingById(id: string) {
  return await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        }
      },
      garage: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          postcode: true,
          phone: true,
          email: true,
        }
      },
      vehicle: true,
      motResult: true,
      review: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }
    }
  })
}

// Get booking by reference
export async function getBookingByRef(bookingRef: string) {
  return await prisma.booking.findUnique({
    where: { bookingRef },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        }
      },
      garage: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          postcode: true,
          phone: true,
          email: true,
        }
      },
      vehicle: true,
      motResult: true
    }
  })
}

// Get bookings with filters
export async function getBookings(filters: BookingFilters = {}, page = 1, limit = 10) {
  const skip = (page - 1) * limit
  
  const where: Prisma.BookingWhereInput = {}

  if (filters.customerId) {
    where.customerId = filters.customerId
  }

  if (filters.garageId) {
    where.garageId = filters.garageId
  }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.paymentStatus) {
    where.paymentStatus = filters.paymentStatus
  }

  if (filters.dateFrom || filters.dateTo) {
    where.date = {}
    if (filters.dateFrom) {
      where.date.gte = filters.dateFrom
    }
    if (filters.dateTo) {
      where.date.lte = filters.dateTo
    }
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        garage: {
          select: {
            id: true,
            name: true,
            address: true,
          }
        },
        vehicle: {
          select: {
            id: true,
            registration: true,
            make: true,
            model: true,
            year: true,
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    }),
    prisma.booking.count({ where })
  ])

  return {
    bookings,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page
  }
}

// Update booking
export async function updateBooking(id: string, data: UpdateBookingData) {
  return await prisma.booking.update({
    where: { id },
    data,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        }
      },
      garage: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
        }
      },
      vehicle: true
    }
  })
}

// Cancel booking
export async function cancelBooking(id: string, reason?: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      garageId: true,
      date: true,
      timeSlot: true,
      status: true
    }
  })

  if (!booking) {
    throw new Error('Booking not found')
  }

  if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
    throw new Error('Cannot cancel this booking')
  }

  // Update booking status
  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      notes: reason ? `Cancelled: ${reason}` : 'Cancelled'
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      garage: {
        select: {
          id: true,
          name: true,
        }
      },
      vehicle: true
    }
  })

  // Free up the time slot
  await prisma.garageAvailability.updateMany({
    where: {
      garageId: booking.garageId,
      date: booking.date,
      timeSlot: booking.timeSlot
    },
    data: {
      isBooked: false
    }
  })

  return updatedBooking
}

// Get available time slots for a garage on a specific date (OPTIMIZED VERSION)
export async function getAvailableTimeSlots(garageId: string, date: Date) {
  const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Get garage schedule for the day of week
  const schedule = await prisma.garageSchedule.findUnique({
    where: {
      garageId_dayOfWeek: {
        garageId,
        dayOfWeek
      }
    }
  })
  
  // If no schedule defined or garage closed, return empty array
  if (!schedule || !schedule.isOpen) {
    return []
  }
  
  // Check for schedule exceptions on this specific date
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
  
  // If exception exists and garage is closed, return empty array
  if (exception && exception.isClosed) {
    return []
  }
  
  // Use exception times if available, otherwise use standard schedule
  const openTime = exception?.openTime || schedule.openTime
  const closeTime = exception?.closeTime || schedule.closeTime
  const slotDuration = schedule.slotDuration
  
  // Generate time slots based on working hours
  const timeSlots = generateTimeSlots(openTime, closeTime, slotDuration)
  
  // Get existing bookings for the date
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
  
  // Get blocked time slots
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
  const blockedTimeSlots = blockedSlots.map((block: { timeSlot: string }) => block.timeSlot);
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

// Get upcoming bookings for a customer
export async function getUpcomingBookings(customerId: string, limit = 5) {
  const now = new Date()
  
  return await prisma.booking.findMany({
    where: {
      customerId,
      date: {
        gte: now
      },
      status: {
        in: ['PENDING', 'CONFIRMED']
      }
    },
    take: limit,
    include: {
      garage: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
        }
      },
      vehicle: {
        select: {
          id: true,
          registration: true,
          make: true,
          model: true,
        }
      }
    },
    orderBy: {
      date: 'asc'
    }
  })
}

// Get booking statistics
export async function getBookingStats(garageId?: string, customerId?: string) {
  const where: Prisma.BookingWhereInput = {}
  
  if (garageId) {
    where.garageId = garageId
  }
  
  if (customerId) {
    where.customerId = customerId
  }

  const [statusStats, paymentStats, totalBookings] = await Promise.all([
    prisma.booking.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true
      }
    }),
    prisma.booking.groupBy({
      by: ['paymentStatus'],
      where,
      _count: {
        paymentStatus: true
      }
    }),
    prisma.booking.count({ where })
  ])

  return {
    statusStats,
    paymentStats,
    totalBookings
  }
}