'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, Clock, Plus, Trash2, ArrowLeft, Lock, Unlock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { GarageLayout } from '@/components/layout/garage-layout';

interface TimeSlot {
  id: string;
  date: string;
  timeSlot: string;
  isBooked: boolean;
  isBlocked: boolean;
  bookingId?: string;
  customerName?: string;
}

interface ScheduleDay {
  date: string;
  slots: TimeSlot[];
}

export default function SchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [availableHours] = useState([
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ]);

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

    fetchSchedule();
  }, [session, status, router, selectedWeek]);

  const fetchSchedule = async () => {
    try {
      const startDate = getWeekStart(selectedWeek);
      const endDate = getWeekEnd(selectedWeek);
      
      const response = await fetch(
        `/api/garage-admin/schedule?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSchedule(data.schedule);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    return new Date(start.setDate(diff));
  };

  const getWeekEnd = (date: Date) => {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  };

  const addTimeSlot = async (date: string, timeSlot: string) => {
    try {
      const response = await fetch('/api/garage-admin/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date, timeSlot }),
      });

      if (response.ok) {
        fetchSchedule();
      }
    } catch (error) {
      console.error('Error adding time slot:', error);
    }
  };

  const removeTimeSlot = async (id: string) => {
    try {
      const response = await fetch(`/api/garage-admin/schedule/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSchedule();
      }
    } catch (error) {
      console.error('Error removing time slot:', error);
    }
  };

  const toggleBlockTimeSlot = async (id: string, isBlocked: boolean) => {
    try {
      const response = await fetch(`/api/garage-admin/schedule/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isBlocked: !isBlocked }),
      });

      if (response.ok) {
        fetchSchedule();
      }
    } catch (error) {
      console.error('Error toggling time slot block status:', error);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next' | 'current') => {
    const newDate = new Date(selectedWeek);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (direction === 'next') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(new Date().getDate());
    }
    setSelectedWeek(newDate);
  };

  const isSlotAvailable = (date: string, timeSlot: string) => {
    const day = schedule.find(d => d.date === date);
    if (!day) return true;
    return !day.slots.some(slot => slot.timeSlot === timeSlot);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const weekStart = getWeekStart(selectedWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  return (
    <GarageLayout>
      <TooltipProvider>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Gerenciamento de Agenda</h1>
              <p className="text-muted-foreground">Gerencie seus horários disponíveis</p>
            </div>
            <Button
              onClick={() => router.push('/garage-admin')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Painel
            </Button>
          </div>

          <div className="space-y-6">
        {/* Week Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Button onClick={() => navigateWeek('prev')} variant="outline">
            Previous Week
          </Button>
          <h2 className="text-xl font-semibold">
            {formatDate(weekStart)} - {formatDate(getWeekEnd(selectedWeek))}
          </h2>
          <div className="space-x-2">
            <Button onClick={() => navigateWeek('current')} variant="outline">
              Current Week
            </Button>
            <Button onClick={() => navigateWeek('next')} variant="outline">
              Next Week
            </Button>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day, dayIndex) => {
            const dateStr = day.toISOString().split('T')[0];
            const daySchedule = schedule.find(d => d.date === dateStr);
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            
            return (
              <div key={dayIndex} className={`border rounded-lg p-4 ${isToday ? 'border-blue-500' : 'border-border'}`}>
                <div className="font-semibold mb-2">
                  {day.toLocaleDateString('pt-BR', { weekday: 'short' })}, {day.getDate()}
                </div>
                
                <div className="space-y-2">
                  {availableHours.map((hour, hourIndex) => {
                    const slot = daySchedule?.slots.find(s => s.timeSlot === hour);
                    
                    if (slot) {
                      return (
                        <div key={hourIndex} className="relative">
                          <div className={`p-2 rounded-md text-sm flex justify-between items-center ${slot.isBlocked ? 'bg-gray-200 text-gray-500' : (slot.isBooked ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800')}`}>
                            <span>{hour}</span>
                            <div className="flex space-x-1">
                              {slot.isBooked ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="text-xs">
                                      {slot.customerName || 'Reservado'}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Reservado por {slot.customerName || 'Cliente'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <div className="flex space-x-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6"
                                        onClick={() => toggleBlockTimeSlot(slot.id, slot.isBlocked)}
                                      >
                                        {slot.isBlocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{slot.isBlocked ? 'Desbloquear' : 'Bloquear'} horário</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 text-red-500 hover:text-red-700"
                                        onClick={() => removeTimeSlot(slot.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Remover horário</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    if (isSlotAvailable(dateStr, hour)) {
                      return (
                        <div key={hourIndex} className="relative">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                className="w-full justify-between items-center text-sm py-1 h-auto border border-dashed border-gray-300 hover:border-gray-400"
                                onClick={() => addTimeSlot(dateStr, hour)}
                              >
                                <span>{hour}</span>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Adicionar horário disponível</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      );
                    }
                    
                    return null;
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Legenda</CardTitle>
            <CardDescription>Entenda os status dos horários</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                <span className="text-sm">Disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
                <span className="text-sm">Reservado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded"></div>
                <span className="text-sm">Bloqueado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
                <span className="text-sm">Hoje</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
      </TooltipProvider>
    </GarageLayout>
  );
}