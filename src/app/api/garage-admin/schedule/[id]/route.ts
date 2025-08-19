import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'GARAGE_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

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

    // Check if the availability slot exists and belongs to this garage
    const availabilitySlot = await prisma.garageAvailability.findFirst({
      where: {
        id,
        garageId: garage.id,
      },
    });

    if (!availabilitySlot) {
      return NextResponse.json(
        { error: 'Availability slot not found' },
        { status: 404 }
      );
    }

    // Check if the slot is booked
    const booking = await prisma.booking.findFirst({
      where: {
        garageId: garage.id,
        date: availabilitySlot.date,
        timeSlot: availabilitySlot.timeSlot,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    if (booking) {
      return NextResponse.json(
        { error: 'Cannot delete a booked time slot' },
        { status: 400 }
      );
    }

    // Delete the availability slot
    await prisma.garageAvailability.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Time slot deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting time slot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}