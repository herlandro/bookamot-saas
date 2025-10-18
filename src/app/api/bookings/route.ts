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

    // Check if time slot is available
    const bookingDate = new Date(date)
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
            registration: true,
            make: true,
            model: true,
            year: true
          }
        },
        customer: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    // TODO: Send confirmation email
    // TODO: Send SMS notification if phone number is available

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
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const whereCondition: any = {
      customerId: session.user.id
    }

    if (status) {
      whereCondition.status = status
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
            phone: true
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
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      reference: booking.bookingRef,
      date: booking.date,
      timeSlot: booking.timeSlot,
      status: booking.status,
      garage: booking.garage,
      vehicle: booking.vehicle,
      createdAt: booking.createdAt
    }))

    return NextResponse.json({
      bookings: formattedBookings,
      total,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}