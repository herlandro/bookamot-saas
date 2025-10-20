import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userType = searchParams.get('userType') || 'CUSTOMER'; // CUSTOMER or GARAGE

    const skip = (page - 1) * limit;

    let whereCondition: Prisma.ReviewWhereInput = {};

    if (userType === 'CUSTOMER') {
      // Customer viewing reviews from garages
      whereCondition = {
        customerId: session.user.id,
        reviewerType: 'GARAGE',
      };
    } else if (userType === 'GARAGE') {
      // Garage owner viewing reviews from customers
      // Get all garages owned by the current user
      const garages = await prisma.garage.findMany({
        where: {
          ownerId: session.user.id,
        },
        select: { id: true },
      });

      const garageIds = garages.map((g) => g.id);
      whereCondition = {
        garageId: { in: garageIds },
        reviewerType: 'CUSTOMER',
      };
    }

    // Get total count
    const total = await prisma.review.count({
      where: whereCondition,
    });

    // Get reviews with pagination
    const reviews = await prisma.review.findMany({
      where: whereCondition,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        garage: {
          select: {
            id: true,
            name: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingRef: true,
            date: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

