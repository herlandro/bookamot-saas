'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Search, Loader2, Star, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewerType: 'CUSTOMER' | 'GARAGE';
  createdAt: string;
  customer: { name: string; email: string };
  garage: { name: string } | null;
  booking: { date: string; timeSlot: string } | null;
}

export default function ReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = session?.user?.id;
  const userRole = session?.user?.role;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '10', search });
      if (ratingFilter !== 'all') params.set('rating', ratingFilter);
      const response = await fetch(`/api/admin/reviews?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
        setAverageRating(data.averageRating);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, ratingFilter]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!userId || userRole !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }
    fetchReviews();
  }, [userId, userRole, status, router, fetchReviews]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/reviews/${deleteId}`, { method: 'DELETE' });
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (status === 'loading' || (loading && reviews.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Star className="h-6 w-6" />
            Reviews Management
          </h1>
          <p className="text-muted-foreground">View and moderate all reviews</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Reviews</CardDescription>
              <CardTitle className="text-2xl">{total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average Rating</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-1">
                {averageRating.toFixed(1)} <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rating Distribution</CardDescription>
              <CardTitle className="text-sm flex gap-1">
                {[5,4,3,2,1].map(r => (
                  <Badge key={r} variant={ratingFilter === r.toString() ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => { setRatingFilter(r.toString()); setPage(1); }}>
                    {r}★
                  </Badge>
                ))}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>All Reviews</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={ratingFilter} onValueChange={(v) => { setRatingFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    {[5,4,3,2,1].map(r => <SelectItem key={r} value={r.toString()}>{r} Stars</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search reviews..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{review.customer?.name || 'Unknown'}</span>
                        <span className="text-muted-foreground">→</span>
                        <span>{review.garage?.name || 'Unknown'}</span>
                        <Badge variant="secondary" className="ml-2">{review.reviewerType}</Badge>
                        <div className="flex items-center ml-auto">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{review.comment || 'No comment provided'}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{format(new Date(review.createdAt), 'dd MMM yyyy HH:mm')}</span>
                        {review.booking && <span>Booking: {format(new Date(review.booking.date), 'dd MMM yyyy')} at {review.booking.timeSlot}</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setDeleteId(review.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="py-2 px-3 text-sm">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Review</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this review? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
