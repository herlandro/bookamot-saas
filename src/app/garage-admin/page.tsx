'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Calendar, Clock, Users, Settings, BarChart3, Plus, Edit, Save, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { GarageCalendar } from '@/components/garage/garage-calendar';
import { BookingModal } from '@/components/garage/booking-modal';
import { GarageLayout } from '@/components/layout/garage-layout';

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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Data atual
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{[key: string]: boolean}>({});
  const [calendarKey, setCalendarKey] = useState(0);

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

    fetchBookings();
    fetchStats();
  }, [session, status, router, selectedDate]);

  const fetchBookings = async () => {
    try {
      // Calculate week range for better calendar display
      const currentDate = new Date(selectedDate);
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
      startOfWeek.setDate(diff);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const startDate = startOfWeek.toISOString().split('T')[0];
      const endDate = endOfWeek.toISOString().split('T')[0];
      
      const response = await fetch(`/api/garage-admin/bookings?startDate=${startDate}&endDate=${endDate}`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
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
      const response = await fetch(`/api/garage-admin/bookings/${bookingId}`, {
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
      } else {
        console.error('Failed to update booking status:', response.status, response.statusText);
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
    if (isEditMode) {
      // Check if the date is in the past
      const slotDate = new Date(date);
      const now = new Date();
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const slotDateTime = new Date(slotDate);
      slotDateTime.setHours(hours, minutes, 0, 0);

      // Prevent blocking/unblocking of past slots
      if (slotDateTime < now) {
        alert('Cannot block/unblock slots that have already passed.');
        return;
      }
      
      // Handle slot blocking/unblocking in edit mode
      const slotKey = `${date}-${timeSlot}`;
      setPendingChanges(prev => ({
        ...prev,
        [slotKey]: !prev[slotKey]
      }));
    } else {
      // Handle empty slot click - could open booking creation modal
      console.log('Empty slot clicked:', date, timeSlot);
    }
  };

  const handleEditMode = () => {
    setIsEditMode(true);
    setPendingChanges({});
  };

  // Add function to handle calendar navigation
  const handleCalendarDateChange = (newDate: Date) => {
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);

      if (Object.keys(pendingChanges).length === 0) {
        setIsEditMode(false);
        setLoading(false);
        return;
      }

      // Apply all pending changes using the new API
      const promises = Object.entries(pendingChanges).map(async ([slotKey, shouldBlock]) => {
        // Split correctly: slotKey format is "YYYY-MM-DD-HH:MM"
        const lastDashIndex = slotKey.lastIndexOf('-');
        const date = slotKey.substring(0, lastDashIndex);
        const timeSlot = slotKey.substring(lastDashIndex + 1);

        try {
          const response = await fetch('/api/garage-admin/slots', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              date: date,
              timeSlot: timeSlot,
              action: shouldBlock ? 'block' : 'unblock',
              reason: shouldBlock ? 'Blocked by administrator' : undefined
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error processing slot');
          }
        } catch (error) {
          console.error(`Error processing slot ${date} ${timeSlot}:`, error);
          throw error;
        }
      });

      await Promise.all(promises);

      // Exit edit mode and refresh data
      setIsEditMode(false);
      setPendingChanges({});
      await fetchBookings();
      await fetchStats();

      // Force calendar to refresh by incrementing key
      setCalendarKey(prev => prev + 1);

      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error saving changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setPendingChanges({});
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Status color handling now moved to StatusBadge component
  // The StatusBadge component is used to display booking status with appropriate colors

  return (
    <GarageLayout>
      <div className="min-h-screen">
      <div>
        <div className="px-6">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-muted-foreground text-sm">Manage your bookings and schedule</p>
            </div>
            <div className="flex gap-3">
              {!isEditMode ? (
                <Button
                  onClick={handleEditMode}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Calendar
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSaveChanges}
                    className="flex items-center gap-2"
                    disabled={loading}
                  >
                    <Save className="h-4 w-4" />
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Interactive Calendar */}
        <GarageCalendar
          key={calendarKey}
          bookings={bookings}
          onBookingClick={handleBookingClick}
          onSlotClick={handleSlotClick}
          onDateChange={handleCalendarDateChange}
          isEditMode={isEditMode}
          pendingChanges={pendingChanges}
          initialDate={selectedDate}
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
    </GarageLayout>
  );
}