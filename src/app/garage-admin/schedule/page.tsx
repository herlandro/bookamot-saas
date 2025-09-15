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

  const removeTimeSlot = async (slotId: string) => {
    try {
      const response = await fetch(`/api/garage-admin/schedule/${slotId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSchedule();
      }
    } catch (error) {
      console.error('Error removing time slot:', error);
    }
  };

  const toggleSlotBlock = async (slotId: string, currentBlockedStatus: boolean) => {
    try {
      const response = await fetch('/api/garage-admin/schedule', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          slotId, 
          isBlocked: !currentBlockedStatus 
        }),
      });

      if (response.ok) {
        fetchSchedule();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erro ao alterar status do slot');
      }
    } catch (error) {
      console.error('Error toggling slot block:', error);
      alert('Erro ao alterar status do slot');
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(selectedWeek.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newWeek);
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
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/garage-admin')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Schedule Management</h1>
                <p className="text-gray-600">Manage your available time slots</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Week Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Button onClick={() => navigateWeek('prev')} variant="outline">
            Previous Week
          </Button>
          <h2 className="text-xl font-semibold">
            {formatDate(weekStart)} - {formatDate(getWeekEnd(selectedWeek))}
          </h2>
          <Button onClick={() => navigateWeek('next')} variant="outline">
            Next Week
          </Button>
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {weekDays.map((day, dayIndex) => {
            const dateStr = day.toISOString().split('T')[0];
            const daySchedule = schedule.find(d => d.date === dateStr);
            const isToday = day.toDateString() === new Date().toDateString();
            const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

            return (
              <Card key={dayIndex} className={isToday ? 'ring-2 ring-blue-500' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </CardTitle>
                  <CardDescription>
                    {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Existing slots */}
                    {daySchedule?.slots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between p-2 rounded border ${
                          slot.isBlocked
                            ? 'bg-red-800 border-red-700 text-white'
                            : slot.isBooked
                            ? 'bg-red-50 border-red-200'
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {slot.isBlocked ? (
                            <Lock className="h-4 w-4 text-red-300" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                          <span className={`text-sm font-medium ${
                            slot.isBlocked ? 'text-white' : ''
                          }`}>{slot.timeSlot}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {slot.isBlocked ? (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="destructive" className="bg-red-600 text-white border-red-500">Bloqueado</Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Este horário foi bloqueado e não está disponível para reservas</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => toggleSlotBlock(slot.id, slot.isBlocked)}
                                    className="h-6 w-6 p-0 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                  >
                                    <Unlock className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Clique para desbloquear este horário e torná-lo disponível para reservas</p>
                                </TooltipContent>
                              </Tooltip>
                            </>
                          ) : slot.isBooked ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="destructive">Reservado</Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Este horário já foi reservado por um cliente{slot.customerName ? `: ${slot.customerName}` : ''}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="default">Disponível</Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Este horário está disponível para reservas de clientes</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => toggleSlotBlock(slot.id, slot.isBlocked)}
                                    className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 mr-1"
                                  >
                                    <Lock className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Clique para bloquear este horário temporariamente</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeTimeSlot(slot.id)}
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Clique para remover este horário permanentemente</p>
                                </TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add new slots */}
                    {!isPast && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500 mb-2">Add time slots:</p>
                        <div className="grid grid-cols-3 gap-1">
                          {availableHours.map((hour) => {
                            const available = isSlotAvailable(dateStr, hour);
                            return (
                              <Button
                                key={hour}
                                size="sm"
                                variant={available ? "outline" : "ghost"}
                                disabled={!available}
                                onClick={() => addTimeSlot(dateStr, hour)}
                                className="text-xs h-7"
                              >
                                {available ? (
                                  <Plus className="h-3 w-3 mr-1" />
                                ) : null}
                                {hour}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {isPast && (
                      <p className="text-xs text-gray-400 text-center py-4">
                        Past date
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Legenda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                  <span className="text-sm">Horário disponível</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                  <span className="text-sm">Horário reservado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded flex items-center justify-center">
                    <Lock className="h-2 w-2 text-red-600" />
                  </div>
                  <span className="text-sm">Horário bloqueado</span>
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
    </div>
    </TooltipProvider>
  );
}