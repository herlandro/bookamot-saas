import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BookingStatus } from '@prisma/client';

export async function PATCH(
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
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !Object.values(BookingStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
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

    // Check if booking exists and belongs to this garage
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id,
        garageId: garage.id,
      },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { 
        status: status as BookingStatus,
        updatedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            registration: true,
            make: true,
            model: true,
            year: true,
          },
        },
        garage: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform the response
    const transformedBooking = {
      id: updatedBooking.id,
      date: updatedBooking.date.toISOString(),
      timeSlot: updatedBooking.timeSlot,
      status: updatedBooking.status,
      reference: updatedBooking.bookingRef,
      totalPrice: updatedBooking.totalPrice,
      notes: updatedBooking.notes,
      createdAt: updatedBooking.createdAt.toISOString(),
      updatedAt: updatedBooking.updatedAt.toISOString(),
      user: {
        id: updatedBooking.customer.id,
        name: updatedBooking.customer.name || 'Unknown',
        email: updatedBooking.customer.email,
        phone: updatedBooking.customer.phone,
      },
      vehicle: {
        id: updatedBooking.vehicle.id,
        registration: updatedBooking.vehicle.registration,
        make: updatedBooking.vehicle.make,
        model: updatedBooking.vehicle.model,
        year: updatedBooking.vehicle.year,
      },
      garage: {
        id: updatedBooking.garage.id,
        name: updatedBooking.garage.name,
      },
    };

    return NextResponse.json({
      message: 'Booking status updated successfully',
      booking: transformedBooking,
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}