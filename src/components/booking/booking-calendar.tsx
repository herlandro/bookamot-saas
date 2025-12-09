"use client"

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Phone, Mail, Loader2 } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { generateTimeSlots } from '@/lib/utils'

interface Garage {
  id: string
  name: string
  address: string
  city: string
  postcode: string
  phone: string
  email: string
  motPrice: number
}

interface Vehicle {
  id: string
  registration: string
  make: string
  model: string
  year: number
}

interface BookingCalendarProps {
  garage: Garage
  vehicle: Vehicle
  onBookingSelect: (date: Date, timeSlot: string) => void
  onCancel: () => void
}

export function BookingCalendar({ garage, vehicle, onBookingSelect, onCancel }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  // Generate available time slots (9 AM to 5 PM, hourly)
  const timeSlots = generateTimeSlots(9, 17, 60)

  // Fetch available slots when date is selected
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate)
    }
  }, [selectedDate])

  const fetchAvailableSlots = async (date: Date) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/garages/${garage.id}/availability?date=${date.toISOString()}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.availableSlots || timeSlots)
      } else {
        setAvailableSlots(timeSlots) // Fallback to all slots
      }
    } catch (error) {
      console.error('Error fetching available slots:', error)
      setAvailableSlots(timeSlots) // Fallback to all slots
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedTimeSlot(undefined)
  }

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot)
  }

  const handleConfirmBooking = () => {
    if (selectedDate && selectedTimeSlot) {
      onBookingSelect(selectedDate, selectedTimeSlot)
    }
  }

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const maxDate = new Date()
    maxDate.setMonth(maxDate.getMonth() + 3) // Allow booking up to 3 months in advance
    
    // Disable past dates and dates beyond 3 months
    if (date < today || date > maxDate) {
      return true
    }
    
    // Disable Sundays (assuming garages are closed)
    if (date.getDay() === 0) {
      return true
    }
    
    return false
  }

  return (
    <div className="space-y-6">
      {/* Garage and Vehicle Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {garage.name}
            </CardTitle>
            <CardDescription>{garage.address}, {garage.city}, {garage.postcode}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              {garage.phone}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {garage.email}
            </div>
            <div className="pt-2">
              <Badge variant="secondary">
                MOT Price: {formatCurrency(garage.motPrice)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-lg font-semibold">{vehicle.registration}</div>
            <div className="text-sm text-muted-foreground">
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
          <CardDescription>
            Choose a date for your MOT test. Sundays are not available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Time Slots */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Available Times for {formatDate(selectedDate, 'long')}
            </CardTitle>
            <CardDescription>
              Select your preferred time slot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {timeSlots.map((slot) => {
                  const isAvailable = availableSlots.includes(slot)
                  const isSelected = selectedTimeSlot === slot
                  
                  return (
                    <Button
                      key={slot}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      disabled={!isAvailable}
                      onClick={() => handleTimeSlotSelect(slot)}
                      className={`${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {slot}
                    </Button>
                  )
                })}
              </div>
            )}
            
            {availableSlots.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                No available time slots for this date. Please select another date.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Summary and Actions */}
      {selectedDate && selectedTimeSlot && (
        <Card>
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Date:</div>
                <div className="text-muted-foreground">{formatDate(selectedDate, 'long')}</div>
              </div>
              <div>
                <div className="font-medium">Time:</div>
                <div className="text-muted-foreground">{selectedTimeSlot}</div>
              </div>
              <div>
                <div className="font-medium">Vehicle:</div>
                <div className="text-muted-foreground">{vehicle.registration}</div>
              </div>
              <div>
                <div className="font-medium">Price:</div>
                <div className="text-muted-foreground">{formatCurrency(garage.motPrice)}</div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleConfirmBooking} className="flex-1">
                Confirm Booking
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
