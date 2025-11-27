import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().optional().nullable(),
  reviewerType: z.enum(['CUSTOMER', 'GARAGE']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingId, rating, comment, reviewerType } = createReviewSchema.parse(body);

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        garage: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify user is authorized to review
    if (reviewerType === 'CUSTOMER' && booking.customerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the customer can review the garage' },
        { status: 403 }
      );
    }

    if (reviewerType === 'GARAGE' && booking.garage.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the garage owner can review the customer' },
        { status: 403 }
      );
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already exists for this booking' },
        { status: 400 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId,
        rating,
        comment: comment || null,
        reviewerType,
        customerId: booking.customerId,
        garageId: booking.garageId,
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
            ownerId: true,
          },
        },
      },
    });

    // Update average rating for the reviewed entity
    if (reviewerType === 'CUSTOMER') {
      // Update garage rating
      const garageReviews = await prisma.review.findMany({
        where: {
          garageId: booking.garageId,
          reviewerType: 'CUSTOMER',
        },
      });

      const averageRating =
        garageReviews.reduce((sum, r) => sum + r.rating, 0) / garageReviews.length;

      await prisma.garage.update({
        where: { id: booking.garageId },
        data: {
          averageRating,
          totalReviews: garageReviews.length,
        },
      });
    } else {
      // Update customer rating
      const customerReviews = await prisma.review.findMany({
        where: {
          customerId: booking.customerId,
          reviewerType: 'GARAGE',
        },
      });

      const averageRating =
        customerReviews.reduce((sum, r) => sum + r.rating, 0) / customerReviews.length;

      await prisma.user.update({
        where: { id: booking.customerId },
        data: {
          averageRating,
          totalReviews: customerReviews.length,
        },
      });
    }

    return NextResponse.json(
      {
        message: 'Review created successfully',
        review,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

