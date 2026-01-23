import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Fetch garage schedules and exceptions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'GARAGE_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const garage = await prisma.garage.findFirst({
      where: { ownerId: session.user.id },
      include: {
        schedules: { orderBy: { dayOfWeek: 'asc' } },
        scheduleExceptions: { orderBy: { date: 'asc' } },
      }
    })

    if (!garage) {
      return NextResponse.json({ error: 'Garage not found' }, { status: 404 })
    }

    return NextResponse.json({
      schedules: garage.schedules,
      exceptions: garage.scheduleExceptions,
    })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Bulk block/unblock operations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'GARAGE_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const garage = await prisma.garage.findFirst({
      where: { ownerId: session.user.id },
    })

    if (!garage) {
      return NextResponse.json({ error: 'Garage not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action, type, data } = body

    // type: 'dateRange' | 'weekDay' | 'fullWeek' | 'schedule'
    // action: 'block' | 'unblock'

    if (type === 'dateRange') {
      // Block/unblock all slots in a date range
      const { startDate, endDate, timeSlots, reason } = data
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      const blocksToCreate: { garageId: string; date: Date; timeSlot: string; reason: string }[] = []
      const blocksToDelete: { date: Date; timeSlot: string }[] = []
      
      // Get garage schedule to know which time slots exist
      const schedules = await prisma.garageSchedule.findMany({
        where: { garageId: garage.id }
      })
      
      // Generate all dates in range
      const currentDate = new Date(start)
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay()
        const schedule = schedules.find(s => s.dayOfWeek === dayOfWeek)
        
        if (schedule && schedule.isOpen) {
          // Generate time slots for this day
          const slots = timeSlots || generateTimeSlots(schedule.openTime, schedule.closeTime, schedule.slotDuration)
          
          for (const slot of slots) {
            const dateForBlock = new Date(currentDate.toISOString().split('T')[0] + 'T00:00:00.000Z')
            if (action === 'block') {
              blocksToCreate.push({
                garageId: garage.id,
                date: dateForBlock,
                timeSlot: slot,
                reason: reason || 'Blocked via availability manager'
              })
            } else {
              blocksToDelete.push({ date: dateForBlock, timeSlot: slot })
            }
          }
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      if (action === 'block') {
        // Use createMany with skipDuplicates
        await prisma.garageTimeSlotBlock.createMany({
          data: blocksToCreate,
          skipDuplicates: true
        })
      } else {
        // Delete blocks
        for (const block of blocksToDelete) {
          await prisma.garageTimeSlotBlock.deleteMany({
            where: {
              garageId: garage.id,
              date: block.date,
              timeSlot: block.timeSlot
            }
          })
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `${action === 'block' ? 'Blocked' : 'Unblocked'} ${blocksToCreate.length || blocksToDelete.length} slots`
      })
    }

    if (type === 'schedule') {
      // Update weekly schedule (opening hours)
      const { dayOfWeek, isOpen, openTime, closeTime, slotDuration } = data
      
      await prisma.garageSchedule.upsert({
        where: { garageId_dayOfWeek: { garageId: garage.id, dayOfWeek } },
        update: { isOpen, openTime, closeTime, slotDuration },
        create: { garageId: garage.id, dayOfWeek, isOpen, openTime, closeTime, slotDuration: slotDuration || 30 }
      })
      
      return NextResponse.json({ success: true, message: 'Schedule updated' })
    }

    return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 })
  } catch (error) {
    console.error('Error managing availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateTimeSlots(openTime: string, closeTime: string, slotDuration: number): string[] {
  const slots: string[] = []
  const [openHour, openMinute] = openTime.split(':').map(Number)
  const [closeHour, closeMinute] = closeTime.split(':').map(Number)
  
  let currentMinutes = openHour * 60 + openMinute
  const endMinutes = closeHour * 60 + closeMinute - slotDuration
  
  while (currentMinutes <= endMinutes) {
    const hour = Math.floor(currentMinutes / 60)
    const minute = currentMinutes % 60
    slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
    currentMinutes += slotDuration
  }
  
  return slots
}

