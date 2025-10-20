'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { GarageLayout } from '@/components/layout/garage-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/ui/star-rating';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

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
  booking?: {
    id: string;
    bookingRef: string;
    date: string;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<'CUSTOMER' | 'GARAGE'>('CUSTOMER');
  const [isGarageOwner, setIsGarageOwner] = useState(false);
  const [layoutLoading, setLayoutLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Detect if user is a garage owner
  useEffect(() => {
    const checkGarageOwnership = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/user/garages');
          if (response.ok) {
            const data = await response.json();
            setIsGarageOwner(data.garages && data.garages.length > 0);
            // If garage owner, default to GARAGE view
            if (data.garages && data.garages.length > 0) {
              setUserType('GARAGE');
            }
          }
        } catch (error) {
          console.error('Error checking garage ownership:', error);
        } finally {
          setLayoutLoading(false);
        }
      }
    };

    checkGarageOwnership();
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchReviews(1);
    }
  }, [session?.user?.id, userType]);

  const fetchReviews = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/reviews/received?page=${page}&limit=10&userType=${userType}`
      );

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchReviews(newPage);
  };

  if (status === 'loading' || layoutLoading) {
    const Layout = isGarageOwner ? GarageLayout : MainLayout;
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const Layout = isGarageOwner ? GarageLayout : MainLayout;

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
                <p className="text-muted-foreground text-sm">
                  {userType === 'CUSTOMER'
                    ? 'Reviews you received from garages'
                    : 'Reviews you received from customers'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* User Type Toggle */}
          {isGarageOwner && (
            <div className="flex gap-2 mb-6">
              <Button
                variant={userType === 'CUSTOMER' ? 'default' : 'outline'}
                onClick={() => setUserType('CUSTOMER')}
              >
                Customer Reviews
              </Button>
              <Button
                variant={userType === 'GARAGE' ? 'default' : 'outline'}
                onClick={() => setUserType('GARAGE')}
              >
                Garage Reviews
              </Button>
            </div>
          )}

          {/* Reviews List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No reviews yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">
                            {userType === 'CUSTOMER'
                              ? review.garage?.name
                              : review.customer?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(review.createdAt), 'MMM d, yyyy', {
                              locale: enUS,
                            })}
                          </p>
                        </div>
                        <StarRating
                          rating={review.rating}
                          interactive={false}
                          size="md"
                          showLabel={true}
                        />
                      </div>

                      {/* Comment */}
                      {review.comment && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm text-foreground">{review.comment}</p>
                        </div>
                      )}

                      {/* Booking Info */}
                      {review.booking && (
                        <div className="text-xs text-muted-foreground border-t pt-3">
                          <p>
                            Booking #{review.booking.bookingRef} •{' '}
                            {format(new Date(review.booking.date), 'MMM d, yyyy', {
                              locale: enUS,
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

