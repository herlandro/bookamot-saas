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

    // Get customer details with bookings and vehicles
    const customer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        averageRating: true,
        totalReviews: true,
        vehicles: {
          select: {
            id: true,
            registration: true,
            make: true,
            model: true,
            year: true,
          },
        },
        bookings: {
          where: {
            garageId: garage.id,
            status: {
              not: 'CANCELLED',
            },
          },
          select: {
            id: true,
            bookingRef: true,
            date: true,
            timeSlot: true,
            status: true,
            totalPrice: true,
            vehicle: {
              select: {
                registration: true,
                make: true,
                model: true,
              },
            },
            createdAt: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify customer has bookings at this garage
    if (customer.bookings.length === 0) {
      return NextResponse.json(
        { error: 'Customer has no bookings at this garage' },
        { status: 403 }
      );
    }

    // Calculate statistics
    const totalBookings = customer.bookings.length;
    const totalRevenue = customer.bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    const completedBookings = customer.bookings.filter(b => b.status === 'COMPLETED').length;

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name || 'Unknown',
        email: customer.email,
        phone: customer.phone || 'N/A',
        joinedDate: new Date(customer.createdAt).toISOString().split('T')[0],
        totalBookings,
        totalRevenue,
        completedBookings,
        averageRating: customer.averageRating || 0,
        totalReviews: customer.totalReviews || 0,
        vehicles: customer.vehicles,
        bookings: customer.bookings.map(booking => ({
          id: booking.id,
          reference: booking.bookingRef,
          date: new Date(booking.date).toISOString().split('T')[0],
          timeSlot: booking.timeSlot,
          status: booking.status,
          totalPrice: booking.totalPrice,
          vehicle: booking.vehicle,
          createdAt: new Date(booking.createdAt).toISOString().split('T')[0],
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

