'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number; // 0-5
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  onRatingChange,
  interactive = false,
  size = 'md',
  showLabel = true,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState(0);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const displayRating = interactive ? hoverRating || rating : rating;

  const handleStarClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleStarHover = (value: number) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            onMouseLeave={handleMouseLeave}
            disabled={!interactive}
            className={cn(
              'transition-colors',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
            aria-label={`Rate ${star} stars`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              )}
            />
          </button>
        ))}
      </div>

      {showLabel && (
        <span className="text-sm font-medium text-foreground ml-2">
          {displayRating > 0 ? `${displayRating.toFixed(1)}` : 'No rating'}
        </span>
      )}
    </div>
  );
}

interface StarRatingDisplayProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function StarRatingDisplay({
  rating,
  reviewCount = 0,
  size = 'md',
  showCount = true,
  className,
}: StarRatingDisplayProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <StarRating
        rating={rating}
        interactive={false}
        size={size}
        showLabel={false}
      />
      <span className="text-sm font-medium text-foreground">
        {rating.toFixed(1)}
      </span>
      {showCount && reviewCount > 0 && (
        <span className="text-sm text-muted-foreground">
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}

