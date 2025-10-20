'use client';

import React from 'react';
import { StarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    email: string;
  };
}

interface ReviewListProps {
  reviews: Review[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function ReviewList({
  reviews,
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: ReviewListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {review.customer?.name || review.garage?.name || 'Anonymous'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(review.createdAt), 'MMM d, yyyy', { locale: enUS })}
                  </p>
                </div>
                <StarRating
                  rating={review.rating}
                  interactive={false}
                  size="sm"
                  showLabel={false}
                />
              </div>

              {/* Rating display */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{review.rating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">out of 5 stars</span>
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="text-sm text-foreground leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

