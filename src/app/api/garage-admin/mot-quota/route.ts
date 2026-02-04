import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/garage-admin/mot-quota
 * Returns confirmed bookings count and purchased MOT quota for the current garage.
 * Used by the MOT Bookings dashboard component (polling).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'GARAGE_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const garage = await prisma.garage.findFirst({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        motQuota: true,
        _count: {
          select: {
            bookings: {
              where: { status: 'CONFIRMED' },
            },
          },
        },
      },
    })

    if (!garage) {
      return NextResponse.json({ error: 'Garage not found' }, { status: 404 })
    }

    const confirmedCount = garage._count.bookings
    const purchasedQuota = garage.motQuota ?? 0

    return NextResponse.json({
      garageId: garage.id,
      confirmedCount,
      purchasedQuota,
      isNearLimit: purchasedQuota > 0 && confirmedCount / purchasedQuota >= 0.8 && confirmedCount < purchasedQuota,
      isExhausted: purchasedQuota > 0 && confirmedCount >= purchasedQuota,
    })
  } catch (error) {
    console.error('Error fetching MOT quota:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
