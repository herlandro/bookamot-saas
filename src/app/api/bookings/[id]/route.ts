import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET a specific booking
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if booking exists and belongs to user or garage owner
    const booking = await prisma.booking.findFirst({
      where: {
        id: (await params).id,
        OR: [
          { customerId: session.user.id },
          { garage: { ownerId: session.user.id } }
        ]
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
            year: true,
            color: true
          }
        },
        motResult: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: booking.id,
      reference: booking.bookingRef,
      date: booking.date,
      timeSlot: booking.timeSlot,
      status: booking.status.toLowerCase(),
      totalPrice: booking.totalPrice,
      notes: booking.notes,
      garage: booking.garage,
      vehicle: booking.vehicle,
      createdAt: booking.createdAt,
      paymentStatus: booking.paymentStatus
    })

  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH to update a booking
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if booking exists and belongs to user
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: (await params).id,
        customerId: session.user.id
      },
      include: {
        garage: true
      }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found or does not belong to user' },
        { status: 404 }
      )
    }

    // Check if booking can be updated
    if (existingBooking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot update a cancelled booking' },
        { status: 400 }
      )
    }

    if (existingBooking.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot update a completed booking' },
        { status: 400 }
      )
    }

    // Check if booking is in the past
    const bookingDate = new Date(existingBooking.date)
    const today = new Date()
    if (bookingDate < today) {
      return NextResponse.json(
        { error: 'Cannot update a past booking' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    
    const updateBookingSchema = z.object({
      date: z.string().optional(),
      timeSlot: z.string().optional(),
      notes: z.string().optional().nullable()
    })

    const validatedData = updateBookingSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validatedData.error.format() },
        { status: 400 }
      )
    }

    const { date, timeSlot, notes } = validatedData.data

    // If date or timeSlot is changing, check availability
    if ((date && date !== existingBooking.date.toISOString().split('T')[0]) || 
        (timeSlot && timeSlot !== existingBooking.timeSlot)) {
      
      // Check if the time slot is available
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          garageId: existingBooking.garageId,
          date: date ? new Date(date) : existingBooking.date,
          timeSlot: timeSlot || existingBooking.timeSlot,
          status: { notIn: ['CANCELLED'] },
          id: { not: (await params).id } // Exclude current booking
        }
      })

      if (conflictingBooking) {
        return NextResponse.json(
          { error: 'This time slot is already booked' },
          { status: 400 }
        )
      }
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: {
        id: (await params).id
      },
      data: {
        date: date ? new Date(date) : undefined,
        timeSlot: timeSlot || undefined,
        notes: notes !== undefined ? notes : undefined
      }
    })

    return NextResponse.json({
      message: 'Booking updated successfully',
      booking: updatedBooking
    })

  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE a booking
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if booking exists and belongs to user
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: (await params).id,
        customerId: session.user.id
      }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found or does not belong to user' },
        { status: 404 }
      )
    }

    // Check if booking is in the past
    const bookingDate = new Date(existingBooking.date)
    const today = new Date()
    if (bookingDate < today && existingBooking.status !== 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot delete a past booking that was not cancelled' },
        { status: 400 }
      )
    }

    // Delete booking
    await prisma.booking.delete({
      where: {
        id: (await params).id
      }
    })

    return NextResponse.json({
      message: 'Booking deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}