import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    // Find all reviews for this booking (can be 0, 1, or 2 - customer and/or garage review)
    const reviews = await prisma.review.findMany({
      where: { bookingId },
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
      },
    });

    // Separate reviews by type for easier frontend consumption
    const customerReview = reviews.find(r => r.reviewerType === 'CUSTOMER') || null;
    const garageReview = reviews.find(r => r.reviewerType === 'GARAGE') || null;

    return NextResponse.json({
      reviews,
      customerReview,
      garageReview,
      // Keep backward compatibility - return first review as 'review'
      review: reviews[0] || null
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

