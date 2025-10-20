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
    const sortBy = searchParams.get('sortBy') || 'registration';
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

    const skip = (page - 1) * limit;

    // Build search filter
    const searchFilter = search ? {
      OR: [
        { registration: { contains: search, mode: 'insensitive' as const } },
        { make: { contains: search, mode: 'insensitive' as const } },
        { model: { contains: search, mode: 'insensitive' as const } },
        { owner: { name: { contains: search, mode: 'insensitive' as const } } },
      ],
    } : {};

    // Get unique vehicles with their booking stats
    const vehicles = await prisma.vehicle.findMany({
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
        registration: true,
        make: true,
        model: true,
        year: true,
        owner: {
          select: {
            id: true,
            name: true,
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
            date: true,
            status: true,
          },
        },
        motHistory: {
          select: {
            id: true,
            testDate: true,
            result: true,
            expiryDate: true,
          },
          orderBy: {
            testDate: 'desc',
          },
          take: 1,
        },
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc',
      },
    });

    // Get total count for pagination
    const total = await prisma.vehicle.count({
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
    const transformedVehicles = vehicles.map((vehicle) => {
      const bookings = vehicle.bookings || [];
      const lastBooking = bookings.length > 0 
        ? bookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        : null;

      const latestMot = vehicle.motHistory && vehicle.motHistory.length > 0 
        ? vehicle.motHistory[0]
        : null;

      let motStatus = 'unknown';
      if (latestMot) {
        if (latestMot.result === 'PASS') {
          if (latestMot.expiryDate) {
            const expiryDate = new Date(latestMot.expiryDate);
            const today = new Date();
            const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry < 0) {
              motStatus = 'expired';
            } else if (daysUntilExpiry <= 30) {
              motStatus = 'expiring_soon';
            } else {
              motStatus = 'valid';
            }
          }
        } else if (latestMot.result === 'FAIL') {
          motStatus = 'failed';
        }
      }

      return {
        id: vehicle.id,
        registration: vehicle.registration,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        ownerName: vehicle.owner.name || 'Unknown',
        totalBookings: bookings.length,
        lastBookingDate: lastBooking ? new Date(lastBooking.date).toISOString().split('T')[0] : null,
        motStatus: motStatus,
        lastMotDate: latestMot ? new Date(latestMot.testDate).toISOString().split('T')[0] : null,
      };
    });

    return NextResponse.json({
      vehicles: transformedVehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching garage vehicles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

