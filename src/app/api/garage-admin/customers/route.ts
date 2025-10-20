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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

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

    // Get all unique customers who have bookings at this garage (excluding CANCELLED)
    const skip = (page - 1) * limit;

    // Build search filter
    const searchFilter = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    // Get unique customers with their booking stats
    const customers = await prisma.user.findMany({
      where: {
        bookings: {
          some: {
            garageId: garage.id,
            status: {
              not: 'CANCELLED',
            },
          },
        },
        ...searchFilter,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        bookings: {
          where: {
            garageId: garage.id,
            status: {
              not: 'CANCELLED',
            },
          },
          select: {
            id: true,
            date: true,
            status: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy === 'bookings' ? 'bookings' : sortBy]: sortOrder === 'asc' ? 'asc' : 'desc',
      },
    });

    // Get total count for pagination
    const total = await prisma.user.count({
      where: {
        bookings: {
          some: {
            garageId: garage.id,
            status: {
              not: 'CANCELLED',
            },
          },
        },
        ...searchFilter,
      },
    });

    // Transform the data
    const transformedCustomers = customers.map((customer) => {
      const bookings = customer.bookings || [];
      const lastBooking = bookings.length > 0 
        ? bookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        : null;

      return {
        id: customer.id,
        name: customer.name || 'Unknown',
        email: customer.email,
        phone: customer.phone || 'N/A',
        totalBookings: bookings.length,
        lastBookingDate: lastBooking ? new Date(lastBooking.date).toISOString().split('T')[0] : null,
        status: bookings.length > 0 ? 'active' : 'inactive',
        joinedDate: new Date(customer.createdAt).toISOString().split('T')[0],
      };
    });

    return NextResponse.json({
      customers: transformedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching garage customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

