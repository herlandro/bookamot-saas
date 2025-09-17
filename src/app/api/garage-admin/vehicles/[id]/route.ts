import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vehicleId = (await params).id;

    // Find the vehicle
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        bookings: {
          include: {
            garage: true
          }
        }
      }
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Check if user has access to this vehicle (through garage ownership)
    const hasAccess = vehicle.bookings.some((booking: any) => 
      booking.garage.ownerId === session.user.id
    );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Return vehicle data with required fields
    const vehicleData = {
      id: vehicle.id,
      registration: vehicle.registration,
      make: vehicle.make || 'N/A',
      model: vehicle.model || 'N/A', 
      year: vehicle.year || new Date().getFullYear(),
      fuelType: vehicle.fuelType || 'N/A',
      color: vehicle.color || 'N/A',
      engineSize: vehicle.engineSize || 0,
      vin: vehicle.vin
    };

    return NextResponse.json(vehicleData);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}