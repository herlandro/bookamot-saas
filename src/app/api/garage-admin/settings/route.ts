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

    // Get garage for the current user
    const garage = await prisma.garage.findFirst({
      where: {
        ownerId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        postcode: true,
        description: true,
        website: true,
        motPrice: true,
        retestPrice: true,
        openingHours: true,
        motLicenseNumber: true,
        dvlaApproved: true,
        isActive: true,
      },
    });

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ garage });
  } catch (error) {
    console.error('Error fetching garage settings:', error);
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
    const {
      name,
      email,
      phone,
      address,
      city,
      postcode,
      description,
      website,
      motPrice,
      retestPrice,
      openingHours,
    } = body;

    // Get garage for the current user
    const existingGarage = await prisma.garage.findFirst({
      where: {
        ownerId: session.user.id,
      },
    });

    if (!existingGarage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!name || !email || !phone || !address || !city || !postcode) {
      return NextResponse.json(
        { error: 'Name, email, phone, address, city, and postcode are required' },
        { status: 400 }
      );
    }

    // Validate pricing
    if (motPrice < 0 || retestPrice < 0) {
      return NextResponse.json(
        { error: 'Prices cannot be negative' },
        { status: 400 }
      );
    }

    // Update garage
    const updatedGarage = await prisma.garage.update({
      where: {
        id: existingGarage.id,
      },
      data: {
        name,
        email,
        phone,
        address,
        city,
        postcode,
        description,
        website,
        motPrice,
        retestPrice,
        openingHours,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        postcode: true,
        description: true,
        website: true,
        motPrice: true,
        retestPrice: true,
        openingHours: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: 'Garage settings updated successfully',
      garage: updatedGarage,
    });
  } catch (error) {
    console.error('Error updating garage settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}