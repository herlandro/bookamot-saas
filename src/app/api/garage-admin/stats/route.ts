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

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get total bookings
    const totalBookings = await prisma.booking.count({
      where: {
        garageId: garage.id,
      },
    });

    // Get today's bookings
    const todayBookings = await prisma.booking.count({
      where: {
        garageId: garage.id,
        date: {
          gte: startOfDay,
          lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    // Get this week's bookings
    const weeklyBookings = await prisma.booking.count({
      where: {
        garageId: garage.id,
        date: {
          gte: startOfWeek,
        },
      },
    });

    // Calculate monthly revenue (mock calculation - £50 per MOT test)
    const monthlyBookingsCount = await prisma.booking.count({
      where: {
        garageId: garage.id,
        date: {
          gte: startOfMonth,
        },
        status: 'COMPLETED',
      },
    });

    const monthlyRevenue = monthlyBookingsCount * 50; // £50 per completed MOT

    const stats = {
      totalBookings,
      todayBookings,
      weeklyBookings,
      monthlyRevenue,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching garage stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}