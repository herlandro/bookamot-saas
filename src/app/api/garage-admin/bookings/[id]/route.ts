import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'GARAGE_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get garage ID for the current user
    const garage = await prisma.garage.findFirst({
      where: {
        ownerId: session.user.id,
      },
    });

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      );
    }

    // Get booking with related data
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        garageId: garage.id,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            registration: true,
            make: true,
            model: true,
            year: true,
            fuelType: true,
          },
        },
        garage: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Transform the response
    const transformedBooking = {
      id: booking.id,
      date: booking.date.toISOString(),
      timeSlot: booking.timeSlot,
      status: booking.status,
      reference: booking.bookingRef,
      totalPrice: booking.totalPrice,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      user: {
        id: booking.customer.id,
        name: booking.customer.name || 'Unknown',
        email: booking.customer.email,
        phone: booking.customer.phone,
      },
      vehicle: {
        id: booking.vehicle.id,
        registration: booking.vehicle.registration,
        make: booking.vehicle.make,
        model: booking.vehicle.model,
        year: booking.vehicle.year,
        fuelType: booking.vehicle.fuelType,
      },
      garage: {
        id: booking.garage.id,
        name: booking.garage.name,
      },
    };

    return NextResponse.json({ booking: transformedBooking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'GARAGE_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get garage ID for the current user
    const garage = await prisma.garage.findFirst({
      where: {
        ownerId: session.user.id,
      },
    });

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      );
    }

    // Check if booking exists and belongs to this garage
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id,
        garageId: garage.id,
      },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Allow confirming/rejecting existing bookings regardless of quota (confirming does not add a consumed slot; only new bookings do).

    // Get previous status to detect changes
    const previousStatus = existingBooking.status

    // Update booking status and notes
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { 
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            registration: true,
            make: true,
            model: true,
            year: true,
          },
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
          },
        },
      },
    });

    // Exhaustion rule: after confirming, if consumed count equals purchased quota, set garage inactive
    if (status === 'CONFIRMED' && previousStatus !== 'CONFIRMED') {
      const motQuota = (garage as { motQuota?: number }).motQuota ?? 0
      const newConsumedCount = await prisma.booking.count({
        where: {
          garageId: garage.id,
          status: { not: 'CANCELLED' },
        },
      })
      if (motQuota > 0 && newConsumedCount >= motQuota) {
        await prisma.garage.update({
          where: { id: garage.id },
          data: { isActive: false },
        })
      }
    }

    // When a booking is cancelled, garage may have quota again – make it visible in search
    if (status === 'CANCELLED') {
      const motQuota = (garage as { motQuota?: number }).motQuota ?? 0
      const newConsumedCount = await prisma.booking.count({
        where: {
          garageId: garage.id,
          status: { not: 'CANCELLED' },
        },
      })
      if (motQuota > 0 && newConsumedCount < motQuota) {
        await prisma.garage.update({
          where: { id: garage.id },
          data: { isActive: true },
        })
      }
    }

    // Send status update emails if status changed
    if (status && status !== previousStatus) {
      try {
        const {
          sendBookingApprovedToCustomer,
          sendBookingRejectedToCustomer,
        } = await import('@/lib/email/booking-email-service')
        const { 
          scheduleBookingReminders,
          cancelBookingReminders 
        } = await import('@/lib/email/email-queue')

        // Send appropriate email based on new status
        if (status === 'CONFIRMED') {
          await sendBookingApprovedToCustomer(updatedBooking)
          // Schedule reminder emails
          await scheduleBookingReminders(updatedBooking)
        } else if (status === 'CANCELLED') {
          await sendBookingRejectedToCustomer(updatedBooking, notes || 'Booking cancelled by the garage.')
          // Cancel scheduled reminders
          await cancelBookingReminders(updatedBooking.id)
        } else if (status === 'COMPLETED') {
          // Get MOT result if available
          const motResult = await prisma.motResult.findUnique({
            where: { bookingId: updatedBooking.id },
            select: {
              result: true,
              certificateNumber: true,
              expiryDate: true,
            },
          })

          const { sendBookingCompletedFollowupToCustomer } = await import('@/lib/email/booking-email-service')
          await sendBookingCompletedFollowupToCustomer(
            updatedBooking,
            motResult ? {
              result: motResult.result,
              certificateNumber: motResult.certificateNumber || undefined,
              expiryDate: motResult.expiryDate || undefined,
            } : undefined
          )
          // Cancel any remaining scheduled reminders
          await cancelBookingReminders(updatedBooking.id)
        }
      } catch (error) {
        console.error('Error sending status update email:', error)
        // Don't fail the request if email fails
      }
    }

    // Transform the response
    const transformedBooking = {
      id: updatedBooking.id,
      date: updatedBooking.date.toISOString(),
      timeSlot: updatedBooking.timeSlot,
      status: updatedBooking.status,
      reference: updatedBooking.bookingRef,
      totalPrice: updatedBooking.totalPrice,
      notes: updatedBooking.notes,
      createdAt: updatedBooking.createdAt.toISOString(),
      updatedAt: updatedBooking.updatedAt.toISOString(),
      user: {
        id: updatedBooking.customer.id,
        name: updatedBooking.customer.name || 'Unknown',
        email: updatedBooking.customer.email,
        phone: updatedBooking.customer.phone,
      },
      vehicle: {
        id: updatedBooking.vehicle.id,
        registration: updatedBooking.vehicle.registration,
        make: updatedBooking.vehicle.make,
        model: updatedBooking.vehicle.model,
        year: updatedBooking.vehicle.year,
      },
      garage: {
        id: updatedBooking.garage.id,
        name: updatedBooking.garage.name,
      },
    };

    return NextResponse.json({
      message: 'Booking status updated successfully',
      booking: transformedBooking,
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}