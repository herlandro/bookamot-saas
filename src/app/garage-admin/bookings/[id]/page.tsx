'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GarageLayout } from '@/components/layout/garage-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReviewSubmissionModal } from '@/components/reviews/review-submission-modal';
import { BookingReviewsSection } from '@/components/reviews/booking-reviews-section';
import { ArrowLeft, Calendar, Clock, User, Car, Phone, Mail, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface Booking {
  id: string;
  reference: string;
  date: string;
  timeSlot: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'PENDING';
  notes?: string;
  vehicle: {
    id: string;
    registration: string;
    make: string;
    model: string;
    year: number;
    fuelType: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const bookingId = React.use(params).id;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);

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

    fetchBooking();
  }, [session, status, router, bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/garage-admin/bookings/${bookingId}`);
      if (response.ok) {
        const data = await response.json();
        setBooking(data.booking);
        setNotes(data.booking.notes || '');
      } else {
        console.error('Booking not found');
        router.push('/garage-admin/bookings');
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (newStatus: string) => {
    if (!booking) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/garage-admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBooking(data.booking);
        setPreviousStatus(booking.status);

        // Show review modal if status changed to COMPLETED
        if (newStatus === 'COMPLETED') {
          setShowReviewModal(true);
        } else {
          alert('Booking updated successfully!');
        }
      } else {
        alert('Error updating booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Error updating booking');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: enUS });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy HH:mm', { locale: enUS });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Cancelled</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Booking not found</p>
      </div>
    );
  }

  return (
    <GarageLayout>
      <div className="min-h-screen bg-background">
        <div className="bg-card shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Booking Details</h1>
                <p className="text-muted-foreground text-sm">View and manage booking details</p>
              </div>
              <Button
                onClick={() => router.push('/garage-admin/bookings')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Bookings
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Booking Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-xl rounded-lg border border-border bg-card">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Booking Information
                      </CardTitle>
                      <CardDescription>
                        Complete booking details
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{booking.reference}</span>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Date & Time</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatDate(booking.date)}</span>
                          <Clock className="h-4 w-4 ml-2 text-muted-foreground" />
                          <span className="font-medium">{booking.timeSlot}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                        <div className="mt-1">
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                        <p className="mt-1">{formatDateTime(booking.createdAt)}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                        <p className="mt-1">{formatDateTime(booking.updatedAt)}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                        <textarea
                          className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                          rows={4}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add notes about this booking..."
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setNotes(booking.notes || '')}
                          disabled={updating}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => updateBookingStatus(booking.status)}
                          disabled={updating || notes === booking.notes}
                        >
                          Save Notes
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-border pt-6">
                  <div className="flex gap-2">
                    {booking.status !== 'CANCELLED' && (
                      <Button
                        variant="destructive"
                        onClick={() => updateBookingStatus('CANCELLED')}
                        disabled={updating}
                        className="flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel Booking
                      </Button>
                    )}

                    {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                      <Button
                        variant="default"
                        onClick={() => updateBookingStatus('COMPLETED')}
                        disabled={updating}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark as Completed
                      </Button>
                    )}

                    {booking.status === 'PENDING' && (
                      <Button
                        variant="default"
                        onClick={() => updateBookingStatus('CONFIRMED')}
                        disabled={updating}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Confirm Booking
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </div>
            
            {/* Customer and Vehicle Info */}
            <div className="space-y-6">
              <Card className="shadow-xl rounded-lg border border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                    <p className="mt-1 font-medium">{booking.user.name}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${booking.user.email}`} className="text-primary hover:underline">
                        {booking.user.email}
                      </a>
                    </div>
                  </div>

                  {booking.user.phone && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${booking.user.phone}`} className="text-primary hover:underline">
                          {booking.user.phone}
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="shadow-xl rounded-lg border border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Registration</h3>
                    <p className="mt-1 font-medium">{booking.vehicle.registration}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Vehicle</h3>
                    <p className="mt-1">{booking.vehicle.make} {booking.vehicle.model} ({booking.vehicle.year})</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Fuel Type</h3>
                    <p className="mt-1">{booking.vehicle.fuelType}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => router.push(`/garage-admin/vehicles/${booking.vehicle.id}`)}
                  >
                    <Car className="h-4 w-4" />
                    View Vehicle Details
                  </Button>
                </CardFooter>
              </Card>

              {/* Reviews Section */}
              {booking && (
                <BookingReviewsSection
                  bookingId={booking.id}
                  reviewerType="CUSTOMER"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {booking && (
        <ReviewSubmissionModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          bookingId={booking.id}
          reviewerType="GARAGE"
          revieweeName={booking.user.name || 'Customer'}
          onSuccess={() => {
            alert('Review submitted successfully!');
          }}
        />
      )}
    </GarageLayout>
  );
}