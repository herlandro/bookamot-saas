"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Clock, User, Car, Lock, Edit, Filter, Save, X, Settings, CheckCircle2, AlertCircle, XCircle, CircleCheck } from 'lucide-react'
import Link from 'next/link'
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
    phone?: string
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
  initialDate?: string // Initial date prop
  onEditMode?: () => void
  onSaveChanges?: () => void
  onCancelEdit?: () => void
  loading?: boolean
}

// Generate time slots dynamically (30-minute intervals from 09:00 to 17:00)
const generateTimeSlotsForCalendar = (): string[] => {
  const slots: string[] = []
  const startHour = 9
  const endHour = 18
  
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    slots.push(`${hour.toString().padStart(2, '0')}:30`)
  }
  
  return slots
}

const timeSlots = generateTimeSlotsForCalendar()

// Using CSS variables for status colors
const statusColors = {
  CONFIRMED: 'bg-blue-500 text-white',
  COMPLETED: 'bg-green-500 text-white',
  CANCELLED: 'bg-red-500 text-white',
  PENDING: 'bg-yellow-500 text-black'
}

// Background colors with 20% opacity for calendar cells
const statusBgColors = {
  CONFIRMED: 'bg-blue-500/20',
  COMPLETED: 'bg-green-500/20',
  CANCELLED: 'bg-red-500/20',
  PENDING: 'bg-yellow-500/20'
}

// Status colors for borders and text (full opacity)
const statusColorMap = {
  CONFIRMED: {
    bg: 'rgba(59, 130, 246, 0.2)', // blue-500/20
    border: 'rgb(59, 130, 246)', // blue-500
    text: 'rgb(59, 130, 246)', // blue-500
    full: 'rgb(59, 130, 246)' // blue-500
  },
  COMPLETED: {
    bg: 'rgba(34, 197, 94, 0.2)', // green-500/20
    border: 'rgb(34, 197, 94)', // green-500
    text: 'rgb(34, 197, 94)', // green-500
    full: 'rgb(34, 197, 94)' // green-500
  },
  CANCELLED: {
    bg: 'rgba(239, 68, 68, 0.2)', // red-500/20
    border: 'rgb(239, 68, 68)', // red-500
    text: 'rgb(239, 68, 68)', // red-500
    full: 'rgb(239, 68, 68)' // red-500
  },
  PENDING: {
    bg: 'rgba(234, 179, 8, 0.2)', // yellow-500/20
    border: 'rgb(234, 179, 8)', // yellow-500
    text: 'rgb(234, 179, 8)', // yellow-500
    full: 'rgb(234, 179, 8)' // yellow-500
  }
}

const statusLabels = {
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  PENDING: 'Pending',
  BLOCKED: 'Unavailable'
}

// Status icons mapping
const statusIcons = {
  CONFIRMED: CheckCircle2,
  COMPLETED: CircleCheck,
  CANCELLED: XCircle,
  PENDING: AlertCircle,
}

// Status icon descriptions for accessibility
const statusIconLabels = {
  CONFIRMED: 'Reserva confirmada',
  COMPLETED: 'Reserva concluída',
  CANCELLED: 'Reserva cancelada',
  PENDING: 'Reserva pendente de aprovação',
}

// Status labels in English for display
const statusDisplayLabels = {
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  PENDING: 'Pending',
}

export function GarageCalendar({ 
  bookings, 
  onBookingClick, 
  onSlotClick, 
  onDateChange, 
  isEditMode = false, 
  pendingChanges = {}, 
  initialDate,
  onEditMode,
  onSaveChanges,
  onCancelEdit,
  loading = false
}: GarageCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate ? new Date(initialDate) : new Date())
  const [selectedWeek, setSelectedWeek] = useState<Date[]>([])
  const [availabilitySlots, setAvailabilitySlots] = useState<TimeSlot[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  useEffect(() => {
    generateWeekDays(currentDate)
  }, [currentDate])

  useEffect(() => {
    if (selectedWeek.length > 0) {
      fetchAvailabilitySlots()
    }
  }, [selectedWeek])

  // Update currentDate when initialDate changes
  useEffect(() => {
    if (initialDate) {
      setCurrentDate(new Date(initialDate))
    }
  }, [initialDate])

  const fetchAvailabilitySlots = async () => {
    if (selectedWeek.length === 0) return
    
    try {
      const startDate = selectedWeek[0].toISOString().split('T')[0]
      const endDate = selectedWeek[selectedWeek.length - 1].toISOString().split('T')[0]
      
      const response = await fetch(`/api/garage-admin/slots?startDate=${startDate}&endDate=${endDate}`)
      if (response.ok) {
        const data = await response.json()
        
        // Convert blocked slots to TimeSlot format
        const blockedSlots: TimeSlot[] = data.blockedSlots.map((slot: any) => ({
          id: `${slot.date}-${slot.timeSlot}`,
          date: new Date(slot.date).toISOString().split('T')[0],
          timeSlot: slot.timeSlot,
          isBooked: false,
          isBlocked: true
        }))
        
        setAvailabilitySlots(blockedSlots)
      } else {
        console.error('Failed to fetch blocked slots')
        setAvailabilitySlots([])
      }
    } catch (error) {
      console.error('Error fetching availability slots:', error)
      setAvailabilitySlots([])
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
    
    // Always filter out cancelled bookings
    filteredBookings = filteredBookings.filter(booking => booking.status !== 'CANCELLED')
    
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
    <Card className="w-full bg-card border border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Clock className="h-6 w-6 text-primary" />
              Booking Calendar
              {isEditMode && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  <Edit className="h-3 w-3 mr-1" />
                  Edit Mode
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1.5">
              View and manage your bookings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="BLOCKED">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
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
                `${selectedWeek[0].toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${selectedWeek[6].toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
              )}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {/* Edit Calendar Controls - Moved to the right */}
            <div className="flex gap-2 ml-4">
              {!isEditMode ? (
                <>
                  <Button
                    onClick={onEditMode}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Calendar
                  </Button>
                  <Link href="/garage-admin/availability">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      size="sm"
                    >
                      <Settings className="h-4 w-4" />
                      Manage Availability
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button
                    onClick={onSaveChanges}
                    className="flex items-center gap-2"
                    disabled={loading}
                    size="sm"
                  >
                    <Save className="h-4 w-4" />
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={onCancelEdit}
                    variant="outline"
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header with days - Google Calendar style */}
            <div className="grid grid-cols-8 border-b border-border bg-muted/30">
              <div className="p-3 text-xs font-semibold text-muted-foreground text-center border-r border-border">
                TIME
              </div>
              {selectedWeek.map((date, index) => (
                <div key={index} className={cn(
                  "p-3 text-center border-r border-border last:border-r-0",
                  isToday(date) 
                    ? "bg-primary/10 border-b-2 border-b-primary" 
                    : "bg-background"
                )}>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    {date.toLocaleDateString('en-GB', { weekday: 'short' })}
                  </div>
                  <div className={cn(
                    "text-lg font-semibold",
                    isToday(date) ? "text-primary" : "text-foreground"
                  )}>
                    {date.getDate()}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Time slots grid */}
            <div className="divide-y divide-border">
              {timeSlots.map((timeSlot) => (
                <div key={timeSlot} className="grid grid-cols-8 hover:bg-muted/20 transition-colors">
                  <div className="p-3 text-xs font-semibold text-muted-foreground text-center border-r border-border bg-muted/30">
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
                        <div key={`${dayIndex}-${timeSlot}`} className="p-2 min-h-[80px] border-r border-border last:border-r-0 bg-muted/20 opacity-40">
                          <div className="text-xs text-muted-foreground text-center pt-6">
                            Filtered
                          </div>
                        </div>
                      )
                    }
                    
                    // Get background color based on first booking's status (20% opacity)
                    const statusColor = slotBookings.length > 0 
                      ? statusColorMap[slotBookings[0].status as keyof typeof statusColorMap]
                      : null
                    
                    return (
                      <div
                        key={`${dayIndex}-${timeSlot}`}
                        className={cn(
                          "p-2 min-h-[80px] border-r border-border last:border-r-0 transition-all duration-150 relative",
                          !statusColor && "bg-muted/30 hover:bg-muted/40",
                          isPast ? "cursor-default" : 
                           isBlocked ? "cursor-default" :
                           slotBookings.length > 0 ? "cursor-pointer" : "",
                          isEditMode && !isPast && slotBookings.length === 0 ? "cursor-pointer hover:bg-primary/5 hover:border-l-primary" : 
                          !isEditMode && slotBookings.length === 0 && !isPast && !isBlocked ? "cursor-pointer hover:bg-green-50/50 dark:hover:bg-green-950/20" :
                          slotBookings.length > 0 ? "cursor-pointer" : "cursor-default"
                        )}
                        style={statusColor ? {
                          backgroundColor: statusColor.bg,
                          borderLeft: `4px solid ${statusColor.border}`
                        } : undefined}
                        onMouseEnter={(e) => {
                          if (statusColor && slotBookings.length > 0) {
                            const hoverColor = statusColor.bg.replace('0.2', '0.3')
                            e.currentTarget.style.backgroundColor = hoverColor
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (statusColor && slotBookings.length > 0) {
                            e.currentTarget.style.backgroundColor = statusColor.bg
                          }
                        }}
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
                        {slotBookings.map((booking) => {
                          const statusColor = statusColorMap[booking.status]
                          const StatusIcon = statusIcons[booking.status as keyof typeof statusIcons] || Car
                          const iconLabel = statusIconLabels[booking.status as keyof typeof statusIconLabels] || 'Reserva'
                          const statusLabel = statusDisplayLabels[booking.status as keyof typeof statusDisplayLabels] || booking.status
                          
                          return (
                            <div
                              key={booking.id}
                              className="mb-1.5 last:mb-0 group"
                            >
                              <div className="flex items-start gap-2">
                                <span
                                  role="img"
                                  aria-label={iconLabel}
                                  title={iconLabel}
                                  className="flex-shrink-0 flex items-center"
                                  style={{ height: '1.25rem' }}
                                >
                                  <StatusIcon 
                                    className="h-3.5 w-3.5"
                                    style={{ color: '#ffffff', fill: statusColor.full }}
                                    aria-hidden="true"
                                  />
                                </span>
                                <div className="flex-1 min-w-0">
                                  {/* Status label in bold - first line */}
                                  <div
                                    className="text-sm font-bold truncate mb-1 flex items-center"
                                    style={{ color: statusColor.text, height: '1.25rem' }}
                                  >
                                    {statusLabel}
                                  </div>
                                  {/* Vehicle make/model - normal weight */}
                                  <div
                                    className="text-xs truncate mb-0.5"
                                    style={{ color: '#000000' }}
                                  >
                                    {booking.vehicle.make} {booking.vehicle.model}
                                  </div>
                                  {/* Vehicle registration - normal weight */}
                                  <div
                                    className="text-xs truncate mb-0.5"
                                    style={{ color: '#000000' }}
                                  >
                                    {booking.vehicle.registration}
                                  </div>
                                  {/* User name - normal weight */}
                                  <div
                                    className="text-xs truncate mb-0.5"
                                    style={{ color: '#000000' }}
                                  >
                                    {booking.user.name}
                                  </div>
                                  {/* User phone - normal weight */}
                                  {booking.user.phone && (
                                    <div
                                      className="text-xs truncate"
                                      style={{ color: '#000000' }}
                                    >
                                      {booking.user.phone}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        
                        {slotBookings.length === 0 && isBlocked && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Lock className="h-3.5 w-3.5" />
                              <span className="font-medium">Unavailable</span>
                            </div>
                          </div>
                        )}

                        {slotBookings.length === 0 && !isPast && !isBlocked && (
                          <>
                            {isEditMode && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs text-primary/70 font-medium">Click to block</span>
                              </div>
                            )}
                          </>
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