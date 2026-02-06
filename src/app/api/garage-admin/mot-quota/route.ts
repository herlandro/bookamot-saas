import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/garage-admin/mot-quota
 * Returns consumed bookings count (all non-cancelled) and purchased MOT quota for the current garage.
 * Consumed = bookings that use a slot (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, NO_SHOW); CANCELLED does not count.
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
      select: { id: true, motQuota: true },
    })

    if (!garage) {
      return NextResponse.json({ error: 'Garage not found' }, { status: 404 })
    }

    const consumedCount = await prisma.booking.count({
      where: {
        garageId: garage.id,
        status: { not: 'CANCELLED' },
      },
    })
    const purchasedQuota = garage.motQuota ?? 0
    const remaining = Math.max(0, purchasedQuota - consumedCount)

    return NextResponse.json({
      garageId: garage.id,
      consumedCount,
      purchasedQuota,
      remaining,
      isNearLimit: purchasedQuota > 0 && consumedCount / purchasedQuota >= 0.8 && consumedCount < purchasedQuota,
      isExhausted: purchasedQuota > 0 && consumedCount >= purchasedQuota,
    })
  } catch (error) {
    console.error('Error fetching MOT quota:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
