import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateTimeSlots } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const bookingIdToExclude = searchParams.get('bookingId')
    
    if (!dateParam) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    const date = new Date(dateParam)
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Check if garage exists
    const garage = await prisma.garage.findUnique({
      where: { id: (await params).id }
    })

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      )
    }

    // Get garage schedule to determine slot duration
    const dayOfWeek = date.getDay()
    const schedule = await prisma.garageSchedule.findUnique({
      where: {
        garageId_dayOfWeek: {
          garageId: (await params).id,
          dayOfWeek
        }
      }
    })
    
    // Use schedule slotDuration if available, otherwise default to 30 minutes
    const slotDuration = schedule?.slotDuration || 30
    
    // Get opening hours from schedule or use defaults
    let openHour = 9
    let closeHour = 18
    
    if (schedule && schedule.isOpen) {
      const [openH, openM] = schedule.openTime.split(':').map(Number)
      const [closeH, closeM] = schedule.closeTime.split(':').map(Number)
      openHour = openH
      closeHour = closeH + (closeM > 0 ? 1 : 0) // Round up if there are minutes
    }
    
    // Generate all possible time slots based on schedule
    const allTimeSlots = generateTimeSlots(openHour, closeHour, slotDuration)

    // Get existing bookings for this date
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const existingBookings = await prisma.booking.findMany({
      where: {
        garageId: (await params).id,
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        ...(bookingIdToExclude ? { id: { not: bookingIdToExclude } } : {})
      },
      select: {
        timeSlot: true
      }
    })

    // Get booked time slots
    const bookedSlots = existingBookings.map((booking: { timeSlot: string }) => booking.timeSlot)

    // Filter out booked slots
    const availableSlots = allTimeSlots.filter(slot => !bookedSlots.includes(slot))

    // Check if the date is in the past
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    let filteredSlots = availableSlots
    
    if (isToday) {
      // If it's today, filter out past time slots
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      filteredSlots = availableSlots.filter(slot => {
        const [slotHour, slotMinute] = slot.split(':').map(Number)
        const slotMinutes = slotHour * 60 + slotMinute
        return slotMinutes > currentMinutes
      })
    }

    return NextResponse.json({
      date: date.toISOString(),
      availableSlots: filteredSlots,
      totalSlots: allTimeSlots.length,
      bookedSlots: bookedSlots.length
    })

  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}