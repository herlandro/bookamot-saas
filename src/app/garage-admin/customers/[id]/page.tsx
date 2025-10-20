'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { GarageLayout } from '@/components/layout/garage-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StarRatingDisplay } from '@/components/ui/star-rating';
import { ReviewList } from '@/components/reviews/review-list';
import { ArrowLeft, Mail, Phone, Calendar, DollarSign, CheckCircle, Car } from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedDate: string;
  totalBookings: number;
  totalRevenue: number;
  completedBookings: number;
  averageRating: number;
  totalReviews: number;
  vehicles: Array<{
    id: string;
    registration: string;
    make: string;
    model: string;
    year: number;
  }>;
  bookings: Array<{
    id: string;
    reference: string;
    date: string;
    timeSlot: string;
    status: string;
    totalPrice: number;
    vehicle: {
      registration: string;
      make: string;
      model: string;
    };
    createdAt: string;
  }>;
}

export default function CustomerDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);

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

    fetchCustomerDetails();
    fetchCustomerReviews();
  }, [session, status, router, customerId]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/garage-admin/customers/${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
      } else {
        console.error('Failed to fetch customer details');
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerReviews = async (page: number = 1) => {
    try {
      setReviewsLoading(true);
      const response = await fetch(`/api/reviews/customer/${customerId}?page=${page}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setReviewsPage(page);
      }
    } catch (error) {
      console.error('Error fetching customer reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy', { locale: enUS });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'GBP',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <GarageLayout>
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Button
              onClick={() => router.push('/garage-admin/customers')}
              variant="outline"
              className="flex items-center gap-2 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Customer not found</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </GarageLayout>
    );
  }

  return (
    <GarageLayout>
      <div className="min-h-screen bg-background">
        <div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    onClick={() => router.push('/garage-admin/customers')}
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
                </div>
                <p className="text-muted-foreground text-sm">Customer Details</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Email</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{customer.email}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Phone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{customer.phone}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Member Since</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatDate(customer.joinedDate)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customer.totalBookings}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Completed Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customer.completedBookings}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(customer.totalRevenue)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customer.vehicles.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <StarRatingDisplay
                  rating={customer.averageRating}
                  reviewCount={customer.totalReviews}
                  size="md"
                  showCount={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Vehicles */}
          {customer.vehicles.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicles
                </CardTitle>
                <CardDescription>Vehicles registered by this customer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {customer.vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium">{vehicle.registration}</p>
                        <p className="text-sm text-muted-foreground">{vehicle.make} {vehicle.model} ({vehicle.year})</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/garage-admin/vehicles/${vehicle.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Booking History */}
          <Card>
            <CardHeader>
              <CardTitle>Booking History</CardTitle>
              <CardDescription>All bookings from this customer at your garage</CardDescription>
            </CardHeader>
            <CardContent>
              {customer.bookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No bookings found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium">Reference</th>
                        <th className="text-left py-3 px-4 font-medium">Date</th>
                        <th className="text-left py-3 px-4 font-medium">Vehicle</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-right py-3 px-4 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.bookings.map((booking) => (
                        <tr key={booking.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{booking.reference}</td>
                          <td className="py-3 px-4">{formatDate(booking.date)} {booking.timeSlot}</td>
                          <td className="py-3 px-4">{booking.vehicle.registration}</td>
                          <td className="py-3 px-4">{getStatusBadge(booking.status)}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(booking.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Reviews from Garages</CardTitle>
              <CardDescription>Reviews written by garages about this customer</CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewList
                reviews={reviews}
                currentPage={reviewsPage}
                totalPages={Math.ceil((customer.totalReviews || 0) / 5)}
                onPageChange={fetchCustomerReviews}
                isLoading={reviewsLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </GarageLayout>
  );
}

