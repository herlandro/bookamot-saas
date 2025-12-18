import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createBookingSchema } from '@/lib/validations'
import { generateBookingReference } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate request data
    const validationResult = createBookingSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { garageId, vehicleId, date, timeSlot, notes } = validationResult.data

    // Verify garage exists and is approved
    const garage = await prisma.garage.findUnique({
      where: { id: garageId },
      select: {
        id: true,
        name: true,
        dvlaApproved: true,
        motPrice: true
      }
    })

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      )
    }

    if (!garage.dvlaApproved) {
      return NextResponse.json(
        { error: 'Garage is not approved for MOT tests' },
        { status: 400 }
      )
    }

    // Verify vehicle belongs to user
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        ownerId: session.user.id
      },
      select: {
        id: true,
        registration: true,
        make: true,
        model: true
      }
    })

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or does not belong to user' },
        { status: 404 }
      )
    }

    // Check if time slot is in the past
    const bookingDate = new Date(date)
    const now = new Date()
    const [slotHour, slotMinute] = timeSlot.split(':').map(Number)

    // Create a date object for the booking time slot
    const bookingDateTime = new Date(bookingDate)
    bookingDateTime.setHours(slotHour, slotMinute, 0, 0)

    // If the booking date/time is in the past, reject it
    if (bookingDateTime < now) {
      return NextResponse.json(
        { error: 'Cannot book a time slot in the past' },
        { status: 400 }
      )
    }

    // Check if time slot is available
    const startOfDay = new Date(bookingDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(bookingDate)
    endOfDay.setHours(23, 59, 59, 999)

    const existingBooking = await prisma.booking.findFirst({
      where: {
        garageId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        timeSlot,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    })

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Time slot is no longer available' },
        { status: 409 }
      )
    }

    // Check if time slot is blocked by the garage
    const blockedSlot = await prisma.garageTimeSlotBlock.findFirst({
      where: {
        garageId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        timeSlot
      }
    })

    if (blockedSlot) {
      return NextResponse.json(
        { error: 'This time slot has been blocked by the garage' },
        { status: 409 }
      )
    }

    // Check if the garage is closed on this day (schedule exception)
    const scheduleException = await prisma.garageScheduleException.findFirst({
      where: {
        garageId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        isClosed: true
      }
    })

    if (scheduleException) {
      return NextResponse.json(
        { error: 'The garage is closed on this date' },
        { status: 409 }
      )
    }

    // Generate unique booking reference
    let reference: string
    let isUnique = false
    let attempts = 0
    
    do {
      reference = generateBookingReference()
      const existingRef = await prisma.booking.findUnique({
        where: { bookingRef: reference }
      })
      isUnique = !existingRef
      attempts++
    } while (!isUnique && attempts < 10)

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique booking reference' },
        { status: 500 }
      )
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        bookingRef: reference,
        customerId: session.user.id,
        garageId,
        vehicleId,
        date: bookingDate,
        timeSlot,
        status: 'PENDING',
        totalPrice: garage.motPrice,
        notes,
        paymentStatus: 'PENDING'
      },
      include: {
        garage: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            postcode: true,
            phone: true,
            email: true
          }
        },
        vehicle: {
          select: {
            id: true,
            registration: true,
            make: true,
            model: true,
            year: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    // Send confirmation emails (async, non-blocking)
    // Import and execute immediately to ensure it runs
    console.log('📧 Starting booking confirmation emails...')
    console.log('   Booking ID:', booking.id)
    console.log('   Customer email:', booking.customer.email)
    console.log('   Garage email:', booking.garage.email)
    
    // Immediately start the email sending process
    // Using void to explicitly mark as fire-and-forget
    void (async () => {
      try {
        const emailService = await import('@/lib/email/booking-email-service')
        console.log('   ✅ Email service imported')
        
        // Send emails in parallel
        await Promise.allSettled([
          emailService.sendBookingConfirmationToCustomer(booking).catch(err => {
            console.error('❌ Customer email error:', err)
          }),
          emailService.sendBookingNotificationToGarage(booking).catch(err => {
            console.error('❌ Garage email error:', err)
          }),
        ])
        
        console.log('   ✅ Email sending process completed')
      } catch (error) {
        console.error('❌ Error in email sending process:', error)
      }
    })()

    return NextResponse.json({
      booking: {
        id: booking.id,
        reference: booking.bookingRef,
        date: booking.date,
        timeSlot: booking.timeSlot,
        status: booking.status,
        totalPrice: booking.totalPrice,
        garage: booking.garage,
        vehicle: booking.vehicle
      },
      message: 'Booking created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset')!)
      : (page - 1) * limit

    const whereCondition: any = {
      customerId: session.user.id
    }

    if (status) {
      whereCondition.status = status
    }

    // Add search filter for booking reference or vehicle registration
    if (search) {
      whereCondition.OR = [
        { bookingRef: { contains: search, mode: 'insensitive' } },
        { vehicle: { registration: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const bookings = await prisma.booking.findMany({
      where: whereCondition,
      include: {
        garage: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            postcode: true,
            phone: true,
            reviews: {
              where: {
                reviewerType: 'CUSTOMER'
              },
              select: {
                rating: true
              }
            }
          }
        },
        vehicle: {
          select: {
            id: true,
            registration: true,
            make: true,
            model: true,
            year: true
          }
        },
        reviews: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: limit,
      skip: offset
    })

    const total = await prisma.booking.count({
      where: whereCondition
    })

    // Map database fields to frontend expected format
    const formattedBookings = bookings.map(booking => {
      // Calculate average rating for garage
      const garageReviews = booking.garage.reviews || []
      const averageRating = garageReviews.length > 0 
        ? garageReviews.reduce((sum, review) => sum + review.rating, 0) / garageReviews.length 
        : 0
      
      return {
        id: booking.id,
        reference: booking.bookingRef,
        date: booking.date,
        timeSlot: booking.timeSlot,
        status: booking.status,
        garage: {
          ...booking.garage,
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          reviewCount: garageReviews.length,
          reviews: undefined // Remove reviews from response
        },
        vehicle: booking.vehicle,
        createdAt: booking.createdAt,
        hasReview: booking.reviews && booking.reviews.length > 0
      }
    })

    return NextResponse.json({
      bookings: formattedBookings,
      total,
      limit,
      offset,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      }
    })

  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}