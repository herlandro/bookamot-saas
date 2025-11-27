import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { rating, comment } = updateReviewSchema.parse(body);

    // Get review
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            customer: true,
            garage: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (review.reviewerType === 'CUSTOMER' && review.booking.customerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (review.reviewerType === 'GARAGE' && review.booking.garage.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if review is within 7 days of creation
    const createdDate = new Date(review.createdAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > 7) {
      return NextResponse.json(
        { error: 'Reviews can only be edited within 7 days of creation' },
        { status: 400 }
      );
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        rating: rating !== undefined ? rating : review.rating,
        comment: comment !== undefined ? comment : review.comment,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
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

    // Recalculate average rating
    if (review.reviewerType === 'CUSTOMER') {
      const garageReviews = await prisma.review.findMany({
        where: {
          garageId: review.garageId,
          reviewerType: 'CUSTOMER',
        },
      });

      const averageRating =
        garageReviews.reduce((sum, r) => sum + r.rating, 0) / garageReviews.length;

      await prisma.garage.update({
        where: { id: review.garageId },
        data: {
          averageRating,
          totalReviews: garageReviews.length,
        },
      });
    } else {
      const customerReviews = await prisma.review.findMany({
        where: {
          customerId: review.customerId,
          reviewerType: 'GARAGE',
        },
      });

      const averageRating =
        customerReviews.reduce((sum, r) => sum + r.rating, 0) / customerReviews.length;

      await prisma.user.update({
        where: { id: review.customerId },
        data: {
          averageRating,
          totalReviews: customerReviews.length,
        },
      });
    }

    return NextResponse.json({
      message: 'Review updated successfully',
      review: updatedReview,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

