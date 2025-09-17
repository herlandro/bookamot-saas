import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'GARAGE_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { date, timeSlot, action, reason } = body

    if (!date || !timeSlot || !action) {
      return NextResponse.json(
        { error: 'Date, timeSlot, and action are required' },
        { status: 400 }
      )
    }

    // Get garage for the current user
    const garage = await prisma.garage.findFirst({
      where: {
        ownerId: session.user.id,
      },
    })

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      )
    }

    // Parse date in UTC to avoid timezone issues
    const slotDate = new Date(date + 'T00:00:00.000Z')

    if (action === 'block') {
      // Create or update block
      const existingBlock = await prisma.garageTimeSlotBlock.findUnique({
        where: {
          garageId_date_timeSlot: {
            garageId: garage.id,
            date: slotDate,
            timeSlot: timeSlot
          }
        }
      })

      if (existingBlock) {
        return NextResponse.json(
          { message: 'Slot already blocked' },
          { status: 200 }
        )
      }

      await prisma.garageTimeSlotBlock.create({
        data: {
          garageId: garage.id,
          date: slotDate,
          timeSlot: timeSlot,
          reason: reason || 'Blocked by admin'
        }
      })

      return NextResponse.json(
        { message: 'Slot blocked successfully' },
        { status: 201 }
      )
    } else if (action === 'unblock') {
      // Remove block
      const deletedBlock = await prisma.garageTimeSlotBlock.deleteMany({
        where: {
          garageId: garage.id,
          date: slotDate,
          timeSlot: timeSlot
        }
      })

      if (deletedBlock.count === 0) {
        return NextResponse.json(
          { message: 'Slot was not blocked' },
          { status: 200 }
        )
      }

      return NextResponse.json(
        { message: 'Slot unblocked successfully' },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "block" or "unblock"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error managing slot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch blocked slots for a date range
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'GARAGE_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    // Get garage for the current user
    const garage = await prisma.garage.findFirst({
      where: {
        ownerId: session.user.id,
      },
    })

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      )
    }

    // Parse dates in UTC to avoid timezone issues
    const start = new Date(startDate + 'T00:00:00.000Z')
    const end = new Date(endDate + 'T23:59:59.999Z')

    const blockedSlots = await prisma.garageTimeSlotBlock.findMany({
      where: {
        garageId: garage.id,
        date: {
          gte: start,
          lte: end
        }
      },
      select: {
        date: true,
        timeSlot: true,
        reason: true,
        createdAt: true
      }
    })

    return NextResponse.json(
      { blockedSlots },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching blocked slots:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}