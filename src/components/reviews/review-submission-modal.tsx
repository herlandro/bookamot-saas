'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/star-rating';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  reviewerType: 'CUSTOMER' | 'GARAGE';
  revieweeName: string;
  onSuccess?: () => void;
}

export function ReviewSubmissionModal({
  isOpen,
  onClose,
  bookingId,
  reviewerType,
  revieweeName,
  onSuccess,
}: ReviewSubmissionModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Reset form when modal is closed or booking changes
  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setComment('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen, bookingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          rating,
          comment: comment || null,
          reviewerType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        onSuccess?.();
        // Reset form
        setRating(0);
        setComment('');
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const title = reviewerType === 'CUSTOMER' 
    ? `Review ${revieweeName}` 
    : `Review Customer`;

  const description = reviewerType === 'CUSTOMER'
    ? `Share your experience with ${revieweeName}`
    : `Provide feedback about this customer`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-center font-medium">Review submitted successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Rating</label>
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                interactive={true}
                size="lg"
                showLabel={true}
              />
            </div>

            {/* Comment */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Comment (Optional)</label>
              <Textarea
                placeholder="Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-24 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {comment.length}/500 characters
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || rating === 0}
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

