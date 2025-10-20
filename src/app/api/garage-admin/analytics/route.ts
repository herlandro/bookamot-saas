import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Simple in-memory cache
interface CacheEntry {
  data: Record<string, unknown>;
  timestamp: number;
}

const analyticsCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

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
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Create cache key
    const cacheKey = `${session.user.id}-${dateFrom || 'all'}-${dateTo || 'all'}`;

    // Check cache
    const cached = analyticsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Get garage
    const garage = await prisma.garage.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      );
    }

    // Build date filter
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo);
    }

    // Get all bookings for this garage
    const bookings = await prisma.booking.findMany({
      where: {
        garageId: garage.id,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      },
      include: {
        customer: true,
        vehicle: true,
      },
    });

    // Get all customers
    const customers = await prisma.user.findMany({
      where: {
        bookings: {
          some: {
            garageId: garage.id,
          },
        },
      },
      include: {
        bookings: {
          where: { garageId: garage.id },
        },
      },
    });

    // Get all vehicles
    const vehicles = await prisma.vehicle.findMany({
      where: {
        bookings: {
          some: {
            garageId: garage.id,
          },
        },
      },
      include: {
        bookings: {
          where: { garageId: garage.id },
        },
        owner: {
          select: {
            name: true,
          },
        },
        motHistory: true,
      },
    });

    // Get all reviews for this garage
    const reviews = await prisma.review.findMany({
      where: {
        garageId: garage.id,
        reviewerType: 'CUSTOMER',
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
    });

    // Calculate overview statistics
    const totalCustomers = customers.length;
    const totalVehicles = vehicles.length;
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    const averageBookingsPerCustomer = totalCustomers > 0 ? totalBookings / totalCustomers : 0;
    
    // Calculate review statistics
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

    // Calculate customer retention (customers with multiple bookings)
    const returningCustomers = customers.filter(c => c.bookings.length > 1).length;
    const retentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    // Group bookings by month for trend
    const bookingsByMonth: { [key: string]: number } = {};
    const revenueByMonth: { [key: string]: number } = {};
    
    bookings.forEach(booking => {
      const month = new Date(booking.date).toISOString().substring(0, 7); // YYYY-MM
      bookingsByMonth[month] = (bookingsByMonth[month] || 0) + 1;
      revenueByMonth[month] = (revenueByMonth[month] || 0) + booking.totalPrice;
    });

    // Top customers by booking count
    const topCustomers = customers
      .sort((a, b) => b.bookings.length - a.bookings.length)
      .slice(0, 10)
      .map(c => ({
        name: c.name || 'Unknown',
        bookings: c.bookings.length,
      }));

    // Vehicles by make
    const vehiclesByMake: { [key: string]: number } = {};
    vehicles.forEach(v => {
      vehiclesByMake[v.make] = (vehiclesByMake[v.make] || 0) + 1;
    });

    const topMakes = Object.entries(vehiclesByMake)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([make, count]) => ({ make, count }));

    // Vehicles by year
    const vehiclesByYear: { [key: number]: number } = {};
    vehicles.forEach(v => {
      vehiclesByYear[v.year] = (vehiclesByYear[v.year] || 0) + 1;
    });

    const vehicleYearData = Object.entries(vehiclesByYear)
      .sort((a, b) => a[0] - b[0])
      .map(([year, count]) => ({ year: parseInt(year), count }));

    // MOT status distribution
    const motStatusDistribution = {
      valid: 0,
      expiring_soon: 0,
      expired: 0,
      failed: 0,
      unknown: 0,
    };

    vehicles.forEach(v => {
      const latestMot = v.motHistory && v.motHistory.length > 0 ? v.motHistory[0] : null;
      
      if (!latestMot) {
        motStatusDistribution.unknown++;
      } else if (latestMot.result === 'FAIL') {
        motStatusDistribution.failed++;
      } else if (latestMot.result === 'PASS' && latestMot.expiryDate) {
        const expiryDate = new Date(latestMot.expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
          motStatusDistribution.expired++;
        } else if (daysUntilExpiry <= 30) {
          motStatusDistribution.expiring_soon++;
        } else {
          motStatusDistribution.valid++;
        }
      }
    });

    // Booking status distribution
    const bookingStatusDistribution = {
      pending: bookings.filter(b => b.status === 'PENDING').length,
      confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
      completed: bookings.filter(b => b.status === 'COMPLETED').length,
      cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
    };

    // Customer status distribution
    const activeCustomers = customers.filter(c => c.bookings.length > 0).length;
    const inactiveCustomers = totalCustomers - activeCustomers;

    // Recent new customers
    const recentCustomers = customers
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(c => ({
        name: c.name || 'Unknown',
        email: c.email,
        joinedDate: new Date(c.createdAt).toISOString().split('T')[0],
        bookings: c.bookings.length,
      }));

    // Vehicles with expiring MOT (next 30 days)
    const expiringMotVehicles = vehicles
      .filter(v => {
        const latestMot = v.motHistory && v.motHistory.length > 0 ? v.motHistory[0] : null;
        if (!latestMot || latestMot.result !== 'PASS' || !latestMot.expiryDate) return false;
        
        const expiryDate = new Date(latestMot.expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
      })
      .sort((a, b) => {
        const aExpiry = a.motHistory[0]?.expiryDate || '';
        const bExpiry = b.motHistory[0]?.expiryDate || '';
        return new Date(aExpiry).getTime() - new Date(bExpiry).getTime();
      })
      .slice(0, 10)
      .map(v => ({
        registration: v.registration,
        make: v.make,
        model: v.model,
        ownerName: v.owner?.name || 'Unknown',
        expiryDate: v.motHistory[0]?.expiryDate ? new Date(v.motHistory[0].expiryDate).toISOString().split('T')[0] : 'N/A',
        daysUntilExpiry: v.motHistory[0]?.expiryDate 
          ? Math.floor((new Date(v.motHistory[0].expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null,
      }));

    const analyticsData = {
      overview: {
        totalCustomers,
        totalVehicles,
        totalBookings,
        completedBookings,
        totalRevenue,
        averageBookingValue,
        averageBookingsPerCustomer,
        retentionRate,
        activeCustomers,
        inactiveCustomers,
        totalReviews,
        averageRating,
      },
      trends: {
        bookingsByMonth: Object.entries(bookingsByMonth).map(([month, count]) => ({ month, count })),
        revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue })),
      },
      customers: {
        topCustomers,
        recentCustomers,
        statusDistribution: {
          active: activeCustomers,
          inactive: inactiveCustomers,
        },
      },
      vehicles: {
        topMakes,
        yearDistribution: vehicleYearData,
        motStatusDistribution,
      },
      bookings: {
        statusDistribution: bookingStatusDistribution,
        expiringMotVehicles,
      },
    };

    // Cache the result
    analyticsCache.set(cacheKey, {
      data: analyticsData,
      timestamp: Date.now(),
    });

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

