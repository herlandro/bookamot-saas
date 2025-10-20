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

    // Get vehicle details with bookings and MOT history
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: {
        id: true,
        registration: true,
        make: true,
        model: true,
        year: true,
        color: true,
        fuelType: true,
        engineSize: true,
        mileage: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
            customer: {
              select: {
                name: true,
                email: true,
              },
            },
            createdAt: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
        motHistory: {
          select: {
            id: true,
            testDate: true,
            result: true,
            certificateNumber: true,
            expiryDate: true,
            mileage: true,
            testLocation: true,
            dangerousDefects: true,
            majorDefects: true,
            minorDefects: true,
            advisoryDefects: true,
          },
          orderBy: {
            testDate: 'desc',
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Verify vehicle has bookings at this garage
    if (vehicle.bookings.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle has no bookings at this garage' },
        { status: 403 }
      );
    }

    // Calculate MOT status
    const latestMot = vehicle.motHistory && vehicle.motHistory.length > 0
      ? vehicle.motHistory[0]
      : null;

    let motStatus = 'unknown';
    let daysUntilExpiry = null;

    if (latestMot) {
      if (latestMot.result === 'PASS' && latestMot.expiryDate) {
        const expiryDate = new Date(latestMot.expiryDate);
        const today = new Date();
        daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
          motStatus = 'expired';
        } else if (daysUntilExpiry <= 30) {
          motStatus = 'expiring_soon';
        } else {
          motStatus = 'valid';
        }
      } else if (latestMot.result === 'FAIL') {
        motStatus = 'failed';
      }
    }

    // Calculate statistics
    const totalBookings = vehicle.bookings.length;
    const totalRevenue = vehicle.bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    const completedBookings = vehicle.bookings.filter(b => b.status === 'COMPLETED').length;

    return NextResponse.json({
      vehicle: {
        id: vehicle.id,
        registration: vehicle.registration,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color || 'N/A',
        fuelType: vehicle.fuelType,
        engineSize: vehicle.engineSize || 'N/A',
        mileage: vehicle.mileage || 'N/A',
        owner: {
          id: vehicle.owner.id,
          name: vehicle.owner.name || 'Unknown',
          email: vehicle.owner.email,
          phone: vehicle.owner.phone || 'N/A',
        },
        totalBookings,
        totalRevenue,
        completedBookings,
        motStatus,
        daysUntilExpiry,
        latestMot: latestMot ? {
          testDate: new Date(latestMot.testDate).toISOString().split('T')[0],
          result: latestMot.result,
          certificateNumber: latestMot.certificateNumber,
          expiryDate: latestMot.expiryDate ? new Date(latestMot.expiryDate).toISOString().split('T')[0] : null,
          mileage: latestMot.mileage,
          testLocation: latestMot.testLocation,
          defects: {
            dangerous: latestMot.dangerousDefects,
            major: latestMot.majorDefects,
            minor: latestMot.minorDefects,
            advisory: latestMot.advisoryDefects,
          },
        } : null,
        bookings: vehicle.bookings.map(booking => ({
          id: booking.id,
          reference: booking.bookingRef,
          date: new Date(booking.date).toISOString().split('T')[0],
          timeSlot: booking.timeSlot,
          status: booking.status,
          totalPrice: booking.totalPrice,
          customer: booking.customer,
          createdAt: new Date(booking.createdAt).toISOString().split('T')[0],
        })),
        motHistory: vehicle.motHistory.map(mot => ({
          id: mot.id,
          testDate: new Date(mot.testDate).toISOString().split('T')[0],
          result: mot.result,
          certificateNumber: mot.certificateNumber,
          expiryDate: mot.expiryDate ? new Date(mot.expiryDate).toISOString().split('T')[0] : null,
          mileage: mot.mileage,
          testLocation: mot.testLocation,
          defects: {
            dangerous: mot.dangerousDefects,
            major: mot.majorDefects,
            minor: mot.minorDefects,
            advisory: mot.advisoryDefects,
          },
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}