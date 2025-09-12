'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Settings, BarChart3, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { GarageCalendar } from '@/components/garage/garage-calendar';
import { BookingModal } from '@/components/garage/booking-modal';

interface Booking {
  id: string;
  date: string;
  timeSlot: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'PENDING';
  reference: string;
  vehicle: {
    registration: string;
    make: string;
    model: string;
  };
  user: {
    name: string;
    email: string;
  };
}

interface GarageStats {
  totalBookings: number;
  todayBookings: number;
  weeklyBookings: number;
  monthlyRevenue: number;
}

export default function GarageAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<GarageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (session.user.role !== 'GARAGE_OWNER') {
      router.push('/dashboard');
      return;
    }

    fetchBookings();
    fetchStats();
  }, [session, status, router, selectedDate]);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`/api/garage-admin/bookings?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/garage-admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh bookings and stats
        fetchBookings();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleSlotClick = (date: string, timeSlot: string) => {
    // Handle empty slot click - could open booking creation modal
    console.log('Empty slot clicked:', date, timeSlot);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Garage Admin Panel</h1>
              <p className="text-slate-600">Manage your bookings and schedule</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/garage-admin/schedule')}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Manage Schedule
              </Button>
              <Button
                onClick={() => router.push('/garage-admin/settings')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBookings}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayBookings}</div>
                <p className="text-xs text-muted-foreground">Scheduled for today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.weeklyBookings}</div>
                <p className="text-xs text-muted-foreground">Bookings this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{stats.monthlyRevenue}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Interactive Calendar */}
        <GarageCalendar
          bookings={bookings}
          onBookingClick={handleBookingClick}
          onSlotClick={handleSlotClick}
        />

        {/* Booking Modal */}
        <BookingModal
          booking={selectedBooking}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedBooking(null);
          }}
          onStatusUpdate={updateBookingStatus}
        />
      </div>
    </div>
  );
}