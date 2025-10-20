import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all garages owned by the current user
    const garages = await prisma.garage.findMany({
      where: {
        ownerId: session.user.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({
      garages,
      isGarageOwner: garages.length > 0,
    });
  } catch (error) {
    console.error('Error fetching user garages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

