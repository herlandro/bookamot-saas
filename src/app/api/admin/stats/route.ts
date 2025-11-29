import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get counts
    const [
      totalCustomers,
      totalGarages,
      totalBookings,
      totalVehicles,
      totalReviews,
      pendingGarages,
      bookingsByStatus,
      recentBookings,
      recentGarages,
      recentReviews,
      bookingsByMonth,
      averageRating
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.garage.count(),
      prisma.booking.count(),
      prisma.vehicle.count(),
      prisma.review.count(),
      prisma.garage.count({ where: { isActive: false } }),
      prisma.booking.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          garage: { select: { name: true } },
          vehicle: { select: { registration: true, make: true, model: true } }
        }
      }),
      prisma.garage.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { name: true, email: true } }
        }
      }),
      prisma.review.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
          garage: { select: { name: true } }
        }
      }),
      prisma.$queryRaw`
        SELECT 
          TO_CHAR(date, 'YYYY-MM') as month,
          COUNT(*)::int as count
        FROM "Booking"
        WHERE date >= NOW() - INTERVAL '12 months'
        GROUP BY TO_CHAR(date, 'YYYY-MM')
        ORDER BY month ASC
      ` as Promise<{ month: string; count: number }[]>,
      prisma.review.aggregate({
        _avg: { rating: true }
      })
    ])

    // Transform bookings by status
    const statusDistribution: Record<string, number> = {}
    bookingsByStatus.forEach(item => {
      statusDistribution[item.status] = item._count.status
    })

    return NextResponse.json({
      overview: {
        totalCustomers,
        totalGarages,
        totalBookings,
        totalVehicles,
        totalReviews,
        pendingGarages,
        averageRating: averageRating._avg.rating || 0
      },
      statusDistribution,
      bookingsByMonth,
      recentBookings: recentBookings.map(b => ({
        id: b.id,
        date: b.date,
        timeSlot: b.timeSlot,
        status: b.status,
        customerName: b.customer.name,
        customerEmail: b.customer.email,
        garageName: b.garage.name,
        vehicle: `${b.vehicle.make} ${b.vehicle.model} (${b.vehicle.registration})`
      })),
      recentGarages: recentGarages.map(g => ({
        id: g.id,
        name: g.name,
        city: g.city,
        isActive: g.isActive,
        ownerName: g.owner.name,
        ownerEmail: g.owner.email,
        createdAt: g.createdAt
      })),
      recentReviews: recentReviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        reviewerName: r.customer?.name,
        garageName: r.garage?.name,
        createdAt: r.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

