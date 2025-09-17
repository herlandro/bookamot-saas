"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '../ui/checkbox'
import { ChevronLeft, ChevronRight, Clock, User, Car, Lock, Edit, Filter } from 'lucide-react'
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

// Usando as variáveis CSS para cores de status
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
  BLOCKED: 'Indisponível'
}

export function GarageCalendar({ bookings, onBookingClick, onSlotClick, onDateChange, isEditMode = false, pendingChanges = {}, initialDate }: GarageCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate ? new Date(initialDate) : new Date())
  const [selectedWeek, setSelectedWeek] = useState<Date[]>([])
  const [availabilitySlots, setAvailabilitySlots] = useState<TimeSlot[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [showCancelled, setShowCancelled] = useState<boolean>(true)

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
    let filteredBookings = bookings.filter(booking => 
      booking.date === dateStr && booking.timeSlot === timeSlot
    )
    
    // Filter out cancelled bookings if showCancelled is false
    if (!showCancelled) {
      filteredBookings = filteredBookings.filter(booking => booking.status !== 'CANCELLED')
    }
    
    // Apply status filter
    if (statusFilter !== 'ALL') {
      filteredBookings = filteredBookings.filter(booking => booking.status === statusFilter)
    }
    
    return filteredBookings
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

  const shouldShowSlot = (date: Date, timeSlot: string, slotBookings: any[], isBlocked: boolean) => {
    if (statusFilter === 'ALL') return true
    
    if (statusFilter === 'BLOCKED') {
      return isBlocked && slotBookings.length === 0
    }
    
    // For other status filters, only show if there are bookings with that status
    return slotBookings.length > 0
  }

  return (
    <Card className="w-full bg-card border border-border">
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                    <SelectItem value="COMPLETED">Concluído</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    <SelectItem value="BLOCKED">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                   id="show-cancelled"
                   checked={showCancelled}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowCancelled(e.target.checked)}
                   className="h-4 w-4"
                 />
                <label
                  htmlFor="show-cancelled"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Mostrar cancelados
                </label>
              </div>
            </div>
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
                  <Badge className="bg-muted text-muted-foreground border-0">
                    {label}
                  </Badge>
                </div>
              )
            }
            
            // Definir cores com base no status
            let badgeClass = '';
            switch(status) {
              case 'CONFIRMED': badgeClass = 'bg-primary text-primary-foreground border-0'; break;
              case 'COMPLETED': badgeClass = 'bg-success text-success-foreground border-0'; break;
              case 'CANCELLED': badgeClass = 'bg-destructive text-destructive-foreground border-0'; break;
              case 'PENDING': badgeClass = 'bg-warning text-warning-foreground border-0'; break;
            }
            
            return (
              <div key={status} className="flex items-center gap-1">
                <Badge className={`${badgeClass} py-0.5 px-2`}>
                  {label}
                </Badge>
              </div>
            )
          })}
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="bg-success/10 border-success/20 text-success">
              Disponível
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with days */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="p-2 text-sm font-medium text-center text-foreground">Horário</div>
              {selectedWeek.map((date, index) => (
                <div key={index} className={cn(
                  "p-2 text-sm font-medium text-center rounded",
                  isToday(date) ? "bg-primary/20 text-primary" : "bg-card text-foreground"
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
                  <div className="p-2 text-sm font-medium text-center bg-muted text-muted-foreground rounded">
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
                    
                    // Check if this slot should be shown based on the filter
                    const allSlotBookings = bookings.filter(booking => 
                      booking.date === formatDate(date) && booking.timeSlot === timeSlot
                    )
                    
                    if (!shouldShowSlot(date, timeSlot, allSlotBookings, isBlocked)) {
                      return (
                        <div key={`${dayIndex}-${timeSlot}`} className="p-1 min-h-[60px] border rounded bg-muted/30 opacity-30">
                          <div className="text-xs text-muted-foreground text-center pt-4">
                            Filtrado
                          </div>
                        </div>
                      )
                    }
                    
                    return (
                      <div
                        key={`${dayIndex}-${timeSlot}`}
                        className={cn(
                          "p-1 min-h-[60px] border rounded transition-colors",
                          isPast ? "bg-muted text-muted-foreground" : 
                           isBlocked ? "bg-muted border-border text-muted-foreground" :
                           slotBookings.length > 0 ? "bg-card border-primary/30" : "bg-success/10 border-success/20",
                          isEditMode && !isPast && slotBookings.length === 0 ? "cursor-pointer hover:bg-primary/10 hover:border-primary/40" : 
                          !isEditMode && slotBookings.length === 0 && !isPast && !isBlocked ? "cursor-pointer hover:bg-success/20" :
                          slotBookings.length > 0 ? "cursor-pointer hover:bg-muted" : "cursor-default",
                          hasPendingChange ? "ring-2 ring-primary ring-opacity-50" : ""
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
                            <div className="text-xs text-muted-foreground font-medium mt-0.5 truncate flex items-center gap-1">
                              <User className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{booking.user.name}</span>
                            </div>
                          </div>
                        ))}
                        
                        {slotBookings.length === 0 && isBlocked && (
                          <div className="text-xs text-muted-foreground font-medium text-center pt-4 flex items-center justify-center gap-1">
                            <Lock className="h-3 w-3" />
                            <span>Indisponível</span>
                            {hasPendingChange && (
                              <span className="text-primary font-semibold">(Alterando)</span>
                            )}
                          </div>
                        )}
                        
                        {slotBookings.length === 0 && !isPast && !isBlocked && (
                          <div className="text-xs text-success font-medium text-center pt-4">
                            <span>Disponível</span>
                            {hasPendingChange && (
                              <div className="text-primary font-semibold">(Bloqueando)</div>
                            )}
                            {isEditMode && !hasPendingChange && (
                              <div className="text-primary text-xs font-medium mt-1">Clique para bloquear</div>
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