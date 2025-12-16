import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'GARAGE_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // Get pending bookings to create notifications
    const pendingBookings = await prisma.booking.findMany({
      where: {
        garageId: garage.id,
        status: 'PENDING',
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            registration: true,
            make: true,
            model: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    // Transform bookings into notifications
    const notifications = pendingBookings.map((booking) => ({
      id: `booking-${booking.id}`,
      type: 'BOOKING_PENDING' as const,
      title: 'New Booking Pending Approval',
      message: `${booking.customer.name || 'Customer'} requested a booking for ${booking.vehicle.make} ${booking.vehicle.model}`,
      bookingId: booking.id,
      isRead: false, // In a real app, you'd have a notifications table
      createdAt: booking.createdAt.toISOString(),
      metadata: {
        booking: {
          id: booking.id,
          reference: booking.bookingRef,
          date: booking.date.toISOString().split('T')[0],
          timeSlot: booking.timeSlot,
          vehicle: {
            make: booking.vehicle.make,
            model: booking.vehicle.model,
            registration: booking.vehicle.registration,
          },
          user: {
            name: booking.customer.name || 'Unknown',
            email: booking.customer.email,
          },
        },
      },
    }));

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

