'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from '@/components/ui/star-rating';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  garage?: {
    id: string;
    name: string;
  };
}

interface BookingReviewsSectionProps {
  bookingId: string;
  reviewerType?: 'CUSTOMER' | 'GARAGE'; // Type of review to display
}

export function BookingReviewsSection({
  bookingId,
  reviewerType = 'GARAGE',
}: BookingReviewsSectionProps) {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReview();
  }, [bookingId]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/reviews/booking/${bookingId}`);

      if (response.status === 404) {
        // No review yet
        setReview(null);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        // Filter by reviewer type if needed
        if (data.review && data.review.reviewerType === reviewerType) {
          setReview(data.review);
        } else {
          setReview(null);
        }
      } else {
        setError('Failed to load review');
      }
    } catch (err) {
      console.error('Error fetching review:', err);
      setError('Error loading review');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!review) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Review
          </CardTitle>
          <CardDescription>
            {reviewerType === 'GARAGE'
              ? 'Review from garage'
              : 'Review from customer'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No review yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Review
        </CardTitle>
        <CardDescription>
          {reviewerType === 'GARAGE'
            ? `Review from ${review.garage?.name || 'Garage'}`
            : `Review from ${review.customer?.name || 'Customer'}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating */}
        <div className="flex items-center gap-4">
          <StarRating
            rating={review.rating}
            interactive={false}
            size="md"
            showLabel={true}
          />
          <span className="text-sm text-muted-foreground">
            {format(new Date(review.createdAt), 'MMM d, yyyy', { locale: enUS })}
          </span>
        </div>

        {/* Comment */}
        {review.comment && (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-foreground">{review.comment}</p>
          </div>
        )}

        {/* Reviewer Info */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          {reviewerType === 'GARAGE' && review.garage && (
            <p>Reviewed by: {review.garage.name}</p>
          )}
          {reviewerType === 'CUSTOMER' && review.customer && (
            <p>Reviewed by: {review.customer.name}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

