import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Get garage ID for the current user
    const garage = await prisma.garage.findFirst({
      where: {
        ownerId: session.user.id,
      },
    });

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date

    // Get availability slots
    const availabilitySlots = await prisma.garageAvailability.findMany({
      where: {
        garageId: garage.id,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: [
        { date: 'asc' },
        { timeSlot: 'asc' },
      ],
    });

    // Get bookings for the same period
    const bookings = await prisma.booking.findMany({
      where: {
        garageId: garage.id,
        date: {
          gte: start,
          lte: end,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
    });

    // Group by date
    const scheduleMap = new Map<string, any[]>();

    // Add availability slots
    availabilitySlots.forEach((slot) => {
      const dateKey = slot.date.toISOString().split('T')[0];
      if (!scheduleMap.has(dateKey)) {
        scheduleMap.set(dateKey, []);
      }
      
      // Check if this slot is booked
      const booking = bookings.find(
        (b) => 
          b.date.toISOString().split('T')[0] === dateKey && 
          b.timeSlot === slot.timeSlot
      );

      scheduleMap.get(dateKey)!.push({
        id: slot.id,
        date: dateKey,
        timeSlot: slot.timeSlot,
        isBooked: !!booking,
        isBlocked: slot.isBlocked || false,
        bookingId: booking?.id,
        customerName: booking?.customer.name,
      });
    });

    // Convert map to array format
    const schedule = Array.from(scheduleMap.entries()).map(([date, slots]) => ({
      date,
      slots: slots.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot)),
    }));

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'GARAGE_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { date, timeSlot } = body;

    if (!date || !timeSlot) {
      return NextResponse.json(
        { error: 'Date and time slot are required' },
        { status: 400 }
      );
    }

    // Get garage ID for the current user
    const garage = await prisma.garage.findFirst({
      where: {
        ownerId: session.user.id,
      },
    });

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      );
    }

    const slotDate = new Date(date);

    // Check if slot already exists
    const existingSlot = await prisma.garageAvailability.findUnique({
      where: {
        garageId_date_timeSlot: {
          garageId: garage.id,
          date: slotDate,
          timeSlot,
        },
      },
    });

    if (existingSlot) {
      return NextResponse.json(
        { error: 'Time slot already exists' },
        { status: 400 }
      );
    }

    // Create new availability slot
    const newSlot = await prisma.garageAvailability.create({
      data: {
        garageId: garage.id,
        date: slotDate,
        timeSlot,
      },
    });

    return NextResponse.json({
      message: 'Time slot added successfully',
      slot: {
        id: newSlot.id,
        date: newSlot.date.toISOString().split('T')[0],
        timeSlot: newSlot.timeSlot,
        isBooked: false,
        isBlocked: false,
      },
    });
  } catch (error) {
    console.error('Error adding time slot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'GARAGE_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { slotId, isBlocked } = body;

    if (!slotId || typeof isBlocked !== 'boolean') {
      return NextResponse.json(
        { error: 'Slot ID and isBlocked status are required' },
        { status: 400 }
      );
    }

    // Get garage ID for the current user
    const garage = await prisma.garage.findFirst({
      where: {
        ownerId: session.user.id,
      },
    });

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      );
    }

    // Check if the slot exists and belongs to this garage
    const slot = await prisma.garageAvailability.findFirst({
      where: {
        id: slotId,
        garageId: garage.id,
      },
    });

    if (!slot) {
      return NextResponse.json(
        { error: 'Time slot not found' },
        { status: 404 }
      );
    }

    // Check if the slot is booked
    if (slot.isBooked && isBlocked) {
      return NextResponse.json(
        { error: 'Cannot block a slot that is already booked' },
        { status: 400 }
      );
    }

    // Verificar se o slot é passado
    const now = new Date();
    const slotDate = new Date(slot.date);
    const [hours, minutes] = slot.timeSlot.split(':').map(Number);
    const slotDateTime = new Date(slotDate);
    slotDateTime.setHours(hours, minutes, 0, 0);
    
    if (slotDateTime < now) {
      return NextResponse.json(
        { error: 'Não é possível bloquear/desbloquear slots que já passaram' },
        { status: 400 }
      );
    }

    // Update the slot's blocked status
    const updatedSlot = await prisma.garageAvailability.update({
      where: { id: slotId },
      data: { isBlocked },
    });

    return NextResponse.json({
      message: `Time slot ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      slot: {
        id: updatedSlot.id,
        date: updatedSlot.date.toISOString().split('T')[0],
        timeSlot: updatedSlot.timeSlot,
        isBooked: updatedSlot.isBooked,
        isBlocked: updatedSlot.isBlocked,
      },
    });
  } catch (error) {
    console.error('Error updating time slot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}