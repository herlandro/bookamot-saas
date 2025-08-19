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

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

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

    // Build where clause
    const where: any = {
      garageId: garage.id,
    };

    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      where.date = {
        gte: startOfDay,
        lt: endOfDay,
      };
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    const skip = (page - 1) * limit;

    // Get bookings with related data
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
        },
        orderBy: [
          { date: 'asc' },
          { timeSlot: 'asc' },
        ],
      }),
      prisma.booking.count({ where }),
    ]);

    // Transform the data to match the expected format
    const transformedBookings = bookings.map((booking) => ({
      id: booking.id,
      date: booking.date.toISOString(),
      timeSlot: booking.timeSlot,
      status: booking.status,
      reference: booking.bookingRef,
      totalPrice: booking.totalPrice,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
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
      },
    }));

    return NextResponse.json({
      bookings: transformedBookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching garage bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}