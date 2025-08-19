import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateTimeSlots } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    
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
      where: { id: params.id }
    })

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      )
    }

    // Generate all possible time slots (9 AM to 5 PM, hourly)
    const allTimeSlots = generateTimeSlots(9, 17, 60)

    // Get existing bookings for this date
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const existingBookings = await prisma.booking.findMany({
      where: {
        garageId: params.id,
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      },
      select: {
        timeSlot: true
      }
    })

    // Get booked time slots
    const bookedSlots = existingBookings.map(booking => booking.timeSlot)

    // Filter out booked slots
    const availableSlots = allTimeSlots.filter(slot => !bookedSlots.includes(slot))

    // Check if the date is in the past
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    let filteredSlots = availableSlots
    
    if (isToday) {
      // If it's today, filter out past time slots
      const currentHour = now.getHours()
      filteredSlots = availableSlots.filter(slot => {
        const slotHour = parseInt(slot.split(':')[0])
        return slotHour > currentHour
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