import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH to cancel a booking
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
      }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found or does not belong to user' },
        { status: 404 }
      )
    }

    // Check if booking can be cancelled
    if (existingBooking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      )
    }

    if (existingBooking.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed booking' },
        { status: 400 }
      )
    }

    // Check if booking is in the past
    const bookingDate = new Date(existingBooking.date)
    const today = new Date()
    if (bookingDate < today) {
      return NextResponse.json(
        { error: 'Cannot cancel a past booking' },
        { status: 400 }
      )
    }

    // Cancel booking
    const updatedBooking = await prisma.booking.update({
      where: {
        id: (await params).id
      },
      data: {
        status: 'CANCELLED'
      }
    })

    return NextResponse.json({
      message: 'Booking cancelled successfully',
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status
      }
    })

  } catch (error) {
    console.error('Error cancelling booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}