"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Clock, User, Car, Lock, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Booking {
  id: string
  date: string
  timeSlot: string
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'PENDING'
  reference: string
  vehicle: {
    registration: string
    make: string
    model: string
  }
  user: {
    name: string
    email: string
  }
}

interface TimeSlot {
  id: string
  date: string
  timeSlot: string
  isBooked: boolean
  isBlocked: boolean
}

interface GarageCalendarProps {
  bookings: Booking[]
  onBookingClick?: (booking: Booking) => void
  onSlotClick?: (date: string, timeSlot: string) => void
  onDateChange?: (date: Date) => void
  isEditMode?: boolean
  pendingChanges?: {[key: string]: boolean}
  initialDate?: string // Nova prop para data inicial
}

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00'
]

const statusColors = {
  CONFIRMED: 'bg-blue-500 text-white',
  COMPLETED: 'bg-green-500 text-white',
  CANCELLED: 'bg-red-500 text-white',
  PENDING: 'bg-yellow-500 text-black'
}

const statusLabels = {
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  PENDING: 'Pendente',
  BLOCKED: 'Bloqueado'
}

export function GarageCalendar({ bookings, onBookingClick, onSlotClick, onDateChange, isEditMode = false, pendingChanges = {}, initialDate }: GarageCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate ? new Date(initialDate) : new Date())
  const [selectedWeek, setSelectedWeek] = useState<Date[]>([])
  const [availabilitySlots, setAvailabilitySlots] = useState<TimeSlot[]>([])

  useEffect(() => {
    generateWeekDays(currentDate)
  }, [currentDate])

  useEffect(() => {
    if (selectedWeek.length > 0) {
      fetchAvailabilitySlots()
    }
  }, [selectedWeek])

  // Atualizar currentDate quando initialDate mudar
  useEffect(() => {
    if (initialDate) {
      setCurrentDate(new Date(initialDate))
    }
  }, [initialDate])

  const fetchAvailabilitySlots = async () => {
    if (selectedWeek.length === 0) return
    
    try {
      const startDate = selectedWeek[0].toISOString().split('T')[0]
      const endDate = selectedWeek[6].toISOString().split('T')[0]
      
      const response = await fetch(`/api/garage-admin/schedule?startDate=${startDate}&endDate=${endDate}`)
      if (response.ok) {
        const data = await response.json()
        // Flatten the schedule array to get all slots
        const allSlots = data.schedule?.flatMap((day: any) => day.slots) || []
        setAvailabilitySlots(allSlots)
      }
    } catch (error) {
      console.error('Error fetching availability slots:', error)
    }
  }

  const generateWeekDays = (date: Date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    startOfWeek.setDate(diff)

    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      weekDays.push(day)
    }
    setSelectedWeek(weekDays)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentDate(newDate)
    // Notify parent component about date change
    if (onDateChange) {
      onDateChange(newDate)
    }
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const getBookingsForSlot = (date: Date, timeSlot: string) => {
    const dateStr = formatDate(date)
    return bookings.filter(booking => 
      booking.date === dateStr && booking.timeSlot === timeSlot
    )
  }

  const getSlotInfo = (date: Date, timeSlot: string) => {
    const dateStr = formatDate(date)
    return availabilitySlots.find(slot => 
      slot.date === dateStr && slot.timeSlot === timeSlot
    )
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPastSlot = (date: Date, timeSlot: string) => {
    const now = new Date()
    const slotDateTime = new Date(date)
    const [hours, minutes] = timeSlot.split(':').map(Number)
    slotDateTime.setHours(hours, minutes, 0, 0)
    
    // Only consider a slot as past if it's actually in the past (including time)
    // This allows editing of future slots and current day slots that haven't passed yet
    return slotDateTime < now
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Calendário de Agendamentos
            {isEditMode && (
              <Badge variant="secondary" className="ml-2">
                <Edit className="h-3 w-3 mr-1" />
                Modo de Edição
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              {selectedWeek.length > 0 && (
                `${selectedWeek[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${selectedWeek[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
              )}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(statusLabels).map(([status, label]) => {
            if (status === 'BLOCKED') {
              return (
                <div key={status} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-gray-500" />
                  <span>{label}</span>
                </div>
              )
            }
            return (
              <div key={status} className="flex items-center gap-1">
                <div className={cn('w-3 h-3 rounded', statusColors[status as keyof typeof statusColors])} />
                <span>{label}</span>
              </div>
            )
          })}
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
            <span>Disponível</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with days */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="p-2 text-sm font-medium text-center">Horário</div>
              {selectedWeek.map((date, index) => (
                <div key={index} className={cn(
                  "p-2 text-sm font-medium text-center rounded",
                  isToday(date) ? "bg-blue-100 text-blue-800" : "bg-gray-50"
                )}>
                  <div>{date.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                  <div className="text-xs">{date.getDate()}</div>
                </div>
              ))}
            </div>
            
            {/* Time slots grid */}
            <div className="space-y-1">
              {timeSlots.map((timeSlot) => (
                <div key={timeSlot} className="grid grid-cols-8 gap-1">
                  <div className="p-2 text-sm font-medium text-center bg-gray-50 rounded">
                    {timeSlot}
                  </div>
                  {selectedWeek.map((date, dayIndex) => {
                    const slotBookings = getBookingsForSlot(date, timeSlot)
                    const slotInfo = getSlotInfo(date, timeSlot)
                    const isPast = isPastSlot(date, timeSlot)
                    const slotKey = `${formatDate(date)}-${timeSlot}`
                    const hasPendingChange = pendingChanges[slotKey] !== undefined
                    const originallyBlocked = slotInfo?.isBlocked || false
                    const isBlocked = hasPendingChange ? pendingChanges[slotKey] : originallyBlocked
                    
                    return (
                      <div
                        key={`${dayIndex}-${timeSlot}`}
                        className={cn(
                          "p-1 min-h-[60px] border rounded transition-colors",
                          isPast ? "bg-gray-100" : 
                          isBlocked ? "bg-gray-200 border-gray-400" :
                          slotBookings.length > 0 ? "bg-white border-blue-300" : "bg-green-50 border-green-300",
                          isEditMode && !isPast && slotBookings.length === 0 ? "cursor-pointer hover:bg-blue-50 hover:border-blue-400" : 
                          !isEditMode && slotBookings.length === 0 && !isPast && !isBlocked ? "cursor-pointer hover:bg-green-100" :
                          slotBookings.length > 0 ? "cursor-pointer" : "cursor-default",
                          hasPendingChange ? "ring-2 ring-blue-500 ring-opacity-50" : ""
                        )}
                        onClick={() => {
                          if (isEditMode && slotBookings.length === 0 && !isPast && onSlotClick) {
                            onSlotClick(formatDate(date), timeSlot)
                          } else if (!isEditMode) {
                            if (slotBookings.length > 0 && onBookingClick) {
                              onBookingClick(slotBookings[0])
                            } else if (slotBookings.length === 0 && !isPast && !isBlocked && onSlotClick) {
                              onSlotClick(formatDate(date), timeSlot)
                            }
                          }
                        }}
                      >
                        {slotBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="mb-1 last:mb-0"
                          >
                            <Badge
                              className={cn(
                                "text-xs px-1 py-0.5 w-full justify-start",
                                statusColors[booking.status]
                              )}
                            >
                              <div className="flex items-center gap-1 truncate">
                                <Car className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{booking.vehicle.registration}</span>
                              </div>
                            </Badge>
                            <div className="text-xs text-gray-600 mt-0.5 truncate flex items-center gap-1">
                              <User className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{booking.user.name}</span>
                            </div>
                          </div>
                        ))}
                        
                        {slotBookings.length === 0 && isBlocked && (
                          <div className="text-xs text-gray-600 text-center pt-4 flex items-center justify-center gap-1">
                            <Lock className="h-3 w-3" />
                            <span>Bloqueado</span>
                            {hasPendingChange && (
                              <span className="text-blue-600 font-semibold">(Alterando)</span>
                            )}
                          </div>
                        )}
                        
                        {slotBookings.length === 0 && !isPast && !isBlocked && (
                          <div className="text-xs text-green-600 text-center pt-4">
                            <span>Disponível</span>
                            {hasPendingChange && (
                              <div className="text-blue-600 font-semibold">(Bloqueando)</div>
                            )}
                            {isEditMode && !hasPendingChange && (
                              <div className="text-blue-500 text-xs mt-1">Clique para bloquear</div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}