import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'GARAGE_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's garage
    const garage = await prisma.garage.findFirst({
      where: { ownerId: session.user.id }
    })

    if (!garage) {
      return NextResponse.json({ error: 'No garage found' }, { status: 404 })
    }

    // Get all blocked time slots grouped by date
    const blockedSlots = await prisma.garageTimeSlotBlock.findMany({
      where: { 
        garageId: garage.id,
        date: { gte: new Date() }
      },
      orderBy: { date: 'asc' }
    })

    // Group by date and get unique dates
    const blockedDatesMap = new Map<string, { date: string; reason?: string }>()
    blockedSlots.forEach(slot => {
      const dateStr = slot.date.toISOString().split('T')[0]
      if (!blockedDatesMap.has(dateStr)) {
        blockedDatesMap.set(dateStr, { date: dateStr, reason: slot.reason || undefined })
      }
    })

    // Get schedule exceptions (for holiday overrides)
    const exceptions = await prisma.garageScheduleException.findMany({
      where: { 
        garageId: garage.id,
        date: { gte: new Date() }
      },
      orderBy: { date: 'asc' }
    })

    const holidayOverrides = exceptions
      .filter(e => e.reason?.includes('Holiday') && !e.isClosed)
      .map(e => ({
        date: e.date.toISOString().split('T')[0],
        isAvailable: !e.isClosed
      }))

    return NextResponse.json({
      blockedDates: Array.from(blockedDatesMap.values()),
      holidayOverrides
    })
  } catch (error) {
    console.error('Error fetching blocked dates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

