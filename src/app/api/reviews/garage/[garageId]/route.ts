import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ garageId: string }> }
) {
  try {
    const { garageId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get reviews for the garage (only customer reviews)
    const reviews = await prisma.review.findMany({
      where: {
        garageId,
        reviewerType: 'CUSTOMER',
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Get total count
    const totalCount = await prisma.review.count({
      where: {
        garageId,
        reviewerType: 'CUSTOMER',
      },
    });

    // Get garage info
    const garage = await prisma.garage.findUnique({
      where: { id: garageId },
      select: {
        id: true,
        name: true,
        averageRating: true,
        totalReviews: true,
      },
    });

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      garage,
      reviews,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching garage reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

