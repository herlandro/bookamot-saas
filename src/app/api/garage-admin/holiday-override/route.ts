import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
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

    const { date, isAvailable } = await request.json()

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const parsedDate = new Date(date + 'T00:00:00.000Z')

    // Check if exception already exists
    const existingException = await prisma.garageScheduleException.findFirst({
      where: {
        garageId: garage.id,
        date: parsedDate
      }
    })

    if (isAvailable) {
      // Mark as available (override holiday closure)
      if (existingException) {
        await prisma.garageScheduleException.update({
          where: { id: existingException.id },
          data: {
            isClosed: false,
            reason: 'Holiday Override - Open'
          }
        })
      } else {
        // Get default schedule for that day of the week
        const dayOfWeek = parsedDate.getDay()
        const schedule = await prisma.garageSchedule.findFirst({
          where: { garageId: garage.id, dayOfWeek }
        })

        await prisma.garageScheduleException.create({
          data: {
            garageId: garage.id,
            date: parsedDate,
            isClosed: false,
            openTime: schedule?.openTime || '09:00',
            closeTime: schedule?.closeTime || '17:30',
            reason: 'Holiday Override - Open'
          }
        })
      }

      // Also remove any blocked slots for that date
      await prisma.garageTimeSlotBlock.deleteMany({
        where: {
          garageId: garage.id,
          date: parsedDate
        }
      })
    } else {
      // Mark as closed (restore holiday closure)
      if (existingException) {
        await prisma.garageScheduleException.update({
          where: { id: existingException.id },
          data: {
            isClosed: true,
            reason: 'Holiday - Closed'
          }
        })
      } else {
        await prisma.garageScheduleException.create({
          data: {
            garageId: garage.id,
            date: parsedDate,
            isClosed: true,
            reason: 'Holiday - Closed'
          }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating holiday override:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

