"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Clock, User, Car } from 'lucide-react'
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

interface GarageCalendarProps {
  bookings: Booking[]
  onBookingClick?: (booking: Booking) => void
  onSlotClick?: (date: string, timeSlot: string) => void
}

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30'
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
  PENDING: 'Pendente'
}

export function GarageCalendar({ bookings, onBookingClick, onSlotClick }: GarageCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedWeek, setSelectedWeek] = useState<Date[]>([])

  useEffect(() => {
    generateWeekDays(currentDate)
  }, [currentDate])

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

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPastSlot = (date: Date, timeSlot: string) => {
    const now = new Date()
    const slotDateTime = new Date(date)
    const [hours, minutes] = timeSlot.split(':').map(Number)
    slotDateTime.setHours(hours, minutes, 0, 0)
    return slotDateTime < now
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Calendário de Agendamentos
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
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="flex items-center gap-1">
              <div className={cn('w-3 h-3 rounded', statusColors[status as keyof typeof statusColors])} />
              <span>{label}</span>
            </div>
          ))}
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
                    const isPast = isPastSlot(date, timeSlot)
                    
                    return (
                      <div
                        key={`${dayIndex}-${timeSlot}`}
                        className={cn(
                          "p-1 min-h-[60px] border rounded cursor-pointer transition-colors",
                          isPast ? "bg-gray-100" : "bg-white hover:bg-gray-50",
                          slotBookings.length > 0 ? "border-blue-300" : "border-gray-200"
                        )}
                        onClick={() => {
                          if (slotBookings.length > 0 && onBookingClick) {
                            onBookingClick(slotBookings[0])
                          } else if (slotBookings.length === 0 && !isPast && onSlotClick) {
                            onSlotClick(formatDate(date), timeSlot)
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
                        
                        {slotBookings.length === 0 && !isPast && (
                          <div className="text-xs text-gray-400 text-center pt-4">
                            Disponível
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