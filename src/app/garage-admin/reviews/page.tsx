'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GarageLayout } from '@/components/layout/garage-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Star, MessageSquare, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/signin');
      return;
    }

    if (session.user.role !== 'GARAGE_OWNER') {
      router.push('/dashboard');
      return;
    }

    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, currentPage, searchTerm]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let url = `/api/reviews/received?page=${currentPage}&limit=10&userType=GARAGE`;

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingBadge = (rating: number) => {
    if (rating >= 4) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Excellent</Badge>;
    } else if (rating === 3) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Good</Badge>;
    } else if (rating === 2) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Fair</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Poor</Badge>;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <GarageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </GarageLayout>
    );
  }

  return (
    <GarageLayout>
      <div className="min-h-screen bg-background">
        <div className="bg-card shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Reviews Management</h1>
                <p className="text-muted-foreground text-sm">View all reviews from customers about your garage</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="shadow-xl rounded-lg border border-border bg-card">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Customer Reviews
                  </CardTitle>
                  <CardDescription>
                    Manage all reviews from customers
                  </CardDescription>
                </div>
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by customer name..."
                    className="pl-9 w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </form>
              </div>
            </CardHeader>

            <CardContent>
              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">{review.customer?.name || 'Anonymous'}</p>
                              <p className="text-sm text-muted-foreground">{review.customer?.email}</p>
                            </div>
                            {getRatingBadge(review.rating)}
                          </div>
                          <div className="mb-2">
                            {renderStars(review.rating)}
                          </div>
                          <p className="text-sm text-foreground mb-3 italic">
                            {review.comment || "No comment provided"}
                          </p>
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            {review.booking && (
                              <>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Booking: {review.booking.bookingRef}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{format(new Date(review.booking.date), 'dd MMM yyyy', { locale: ptBR })}</span>
                                </div>
                              </>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(review.createdAt), 'dd MMM yyyy HH:mm', { locale: ptBR })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            {pagination.totalPages > 1 && (
              <div className="border-t border-border px-6 py-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total reviews)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </GarageLayout>
  );
}

