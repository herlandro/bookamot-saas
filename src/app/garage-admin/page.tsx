'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Settings, BarChart3, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Booking {
  id: string;
  date: string;
  timeSlot: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
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

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const response = await fetch(`/api/garage-admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchBookings();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating booking:', error);
    }
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
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Garage Admin Panel</h1>
              <p className="text-gray-600">Manage your bookings and schedule</p>
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

        {/* Date Filter */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Filter by Date</CardTitle>
              <CardDescription>Select a date to view bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </CardContent>
          </Card>
        </div>

        {/* Bookings List */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings for {formatDate(new Date(selectedDate))}</CardTitle>
            <CardDescription>
              {bookings.length} booking(s) scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No bookings for this date</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {booking.vehicle.make} {booking.vehicle.model}
                        </h3>
                        <p className="text-gray-600">{booking.vehicle.registration}</p>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <Clock className="h-4 w-4" />
                          {booking.timeSlot}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="h-4 w-4" />
                          {booking.user.name}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Reference: {booking.reference}</p>
                        <p className="text-sm text-gray-600">Email: {booking.user.email}</p>
                      </div>
                    </div>

                    {booking.status === 'CONFIRMED' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'COMPLETED')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}