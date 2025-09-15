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
import { MainLayout } from '@/components/layout/main-layout';

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
  const [selectedDate, setSelectedDate] = useState('2025-09-15'); // Data com agendamentos existentes
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
    if (isEditMode) {
      // Verificar se a data é passada
      const slotDate = new Date(date);
      const now = new Date();
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const slotDateTime = new Date(slotDate);
      slotDateTime.setHours(hours, minutes, 0, 0);
      
      // Impedir bloqueio/desbloqueio de slots passados
      if (slotDateTime < now) {
        alert('Não é possível bloquear/desbloquear slots que já passaram.');
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
    console.log('🔥 FUNÇÃO HANDLEAVECHANGES CHAMADA!');
    console.log('🔥 Estado atual - isEditMode:', isEditMode);
    console.log('🔥 Estado atual - loading:', loading);
    console.log('🔥 Data selecionada atual:', selectedDate);
    try {
      setLoading(true);
      
      console.log('Iniciando salvamento. Alterações pendentes:', pendingChanges);
      
      if (Object.keys(pendingChanges).length === 0) {
        console.log('Nenhuma alteração pendente para salvar');
        setIsEditMode(false);
        setLoading(false);
        return;
      }
      
      // Get all unique dates from pending changes to determine the full range
      const changedDates = Object.keys(pendingChanges).map(key => {
        const lastDashIndex = key.lastIndexOf('-');
        return key.substring(0, lastDashIndex);
      });
      
      const uniqueDates = [...new Set(changedDates)].sort();
      console.log('Datas com alterações:', uniqueDates);
      
      if (uniqueDates.length === 0) {
        console.log('Nenhuma data válida encontrada nas alterações');
        setIsEditMode(false);
        setLoading(false);
        return;
      }
      
      // Use the earliest and latest dates from changes, or fall back to current week
      let startDate = uniqueDates[0];
      let endDate = uniqueDates[uniqueDates.length - 1];
      
      // Expand to include full week range if needed
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      const startOfWeek = new Date(startDateObj);
      const startDay = startOfWeek.getDay();
      const startDiff = startOfWeek.getDate() - startDay + (startDay === 0 ? -6 : 1);
      startOfWeek.setDate(startDiff);
      
      const endOfWeek = new Date(endDateObj);
      const endDay = endOfWeek.getDay();
      const endDiff = endOfWeek.getDate() + (7 - endDay) % 7;
      endOfWeek.setDate(endDiff);
      
      startDate = startOfWeek.toISOString().split('T')[0];
      endDate = endOfWeek.toISOString().split('T')[0];
      
      console.log(`Buscando slots de ${startDate} a ${endDate} (expandido para semana completa)`);
      
      // Get all availability slots to find slot IDs
      const response = await fetch(`/api/garage-admin/schedule?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch slot data');
      }
      
      const data = await response.json();
      const allSlots = data.schedule?.flatMap((day: any) => day.slots) || [];
      
      console.log(`Encontrados ${allSlots.length} slots`);
      
      // Apply all pending changes
      const promises = Object.entries(pendingChanges).map(async ([slotKey, shouldBlock]) => {
        // Split correctly: slotKey format is "YYYY-MM-DD-HH:MM"
        const lastDashIndex = slotKey.lastIndexOf('-');
        const date = slotKey.substring(0, lastDashIndex);
        const timeSlot = slotKey.substring(lastDashIndex + 1);
        
        console.log(`Processando slot: ${date} ${timeSlot}, bloquear: ${shouldBlock}`);
        
        // The date is already in ISO format (YYYY-MM-DD) from GarageCalendar
        console.log(`Procurando slot com data ISO: ${date}`);
        
        const slot = allSlots.find((s: any) => 
          s.date === date && s.timeSlot === timeSlot
        );
        
        if (slot) {
          console.log(`Slot encontrado, ID: ${slot.id}`);
          
          const patchResponse = await fetch('/api/garage-admin/schedule', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              slotId: slot.id,
              isBlocked: shouldBlock
            })
          });
          
          if (!patchResponse.ok) {
            const errorData = await patchResponse.json();
            console.error('Erro na requisição PATCH:', errorData);
            throw new Error(errorData.error || 'Failed to update slot');
          } else {
            console.log(`Slot ${slot.id} atualizado com sucesso`);
          }
        } else {
          console.error(`Slot não encontrado para ${date} ${timeSlot}`);
          console.log('Slots disponíveis:', allSlots.map((s: any) => ({ date: s.date, timeSlot: s.timeSlot })));
        }
      });
      
      await Promise.all(promises);
      
      console.log('Todas as alterações foram processadas');
      
      // Exit edit mode and refresh data
      setIsEditMode(false);
      setPendingChanges({});
      await fetchBookings();
      await fetchStats();
      
      // Force calendar to refresh by incrementing key
      setCalendarKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Erro ao salvar alterações. Tente novamente.');
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
    <MainLayout>
      <div className="min-h-screen">
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Garage Admin Panel</h1>
              <p className="text-muted-foreground text-sm">Manage your bookings and schedule</p>
            </div>
            <div className="flex gap-3">
              {!isEditMode ? (
                <>
                  <Button
                    onClick={handleEditMode}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar Agenda
                  </Button>
                  <Button
                    onClick={() => router.push('/garage-admin/settings')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      console.log('🔥 BOTÃO SALVAR CLICADO!');
                      handleSaveChanges();
                    }}
                    className="flex items-center gap-2"
                    disabled={loading}
                  >
                    <Save className="h-4 w-4" />
                    {loading ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.totalBookings}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Today's Bookings</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.todayBookings}</div>
                <p className="text-xs text-muted-foreground">Scheduled for today</p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">This Week</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.weeklyBookings}</div>
                <p className="text-xs text-muted-foreground">Bookings this week</p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Monthly Revenue</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">£{stats.monthlyRevenue}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>
        )}

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
    </MainLayout>
  );
}