"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Calendar, Save, Loader2 } from 'lucide-react'

interface Booking {
  id: string
  reference: string
  date: string
  timeSlot: string
  status: string
  notes?: string
  garage: {
    id: string
    name: string
  }
  vehicle: {
    id: string
    registration: string
  }
}

export default function EditBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const userId = session?.user?.id
  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState('')
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!userId) {
      router.push('/signin')
      return
    }

    fetchBooking()
  }, [userId, status, router, id])

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch booking')
      }
      const data = await response.json()
      setBooking(data)
      setNotes(data.notes || '')
      
      // Format date for input
      const bookingDate = new Date(data.date)
      const formattedDate = bookingDate.toISOString().split('T')[0]
      setSelectedDate(formattedDate)
      setSelectedTimeSlot(data.timeSlot)
      
      // Fetch available time slots for this date and garage
      fetchAvailableTimeSlots(formattedDate, data.garage.id)
    } catch (error) {
      setError('Failed to load booking details')
      console.error('Error fetching booking:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableTimeSlots = async (date: string, garageId: string) => {
    try {
      const response = await fetch(`/api/garages/${garageId}/availability?date=${date}&bookingId=${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch available time slots')
      }
      const data = await response.json()
      setAvailableTimeSlots(data.availableSlots || [])
    } catch (error) {
      console.error('Error fetching time slots:', error)
      setError('Failed to load available time slots')
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setSelectedDate(newDate)
    if (booking) {
      fetchAvailableTimeSlots(newDate, booking.garage.id)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!booking) return
    
    // Validate form
    if (!selectedDate) {
      setError('Please select a date')
      return
    }
    
    if (!selectedTimeSlot) {
      setError('Please select a time slot')
      return
    }
    
    setIsSaving(true)
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: selectedDate,
          timeSlot: selectedTimeSlot,
          notes
        })
      })

      if (response.ok) {
        router.push(`/bookings/${id}`)
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to update booking')
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading booking details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 flex items-center gap-2" 
          onClick={() => router.push('/bookings')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </Button>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-red-800 mb-2">Booking Not Found</h3>
          <p className="text-red-700 mb-4">{error || 'The booking you\'re looking for doesn\'t exist or you don\'t have permission to edit it.'}</p>
          <Button onClick={() => router.push('/bookings')}>View All Bookings</Button>
        </div>
      </div>
    )
  }

  // Check if booking can be edited
  const bookingDate = new Date(booking.date)
  const today = new Date()
  const isPastBooking = bookingDate < today
  const canEdit = !isPastBooking && (booking.status === 'confirmed' || booking.status === 'pending')

  if (!canEdit) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 flex items-center gap-2" 
          onClick={() => router.push(`/bookings/${id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Booking Details
        </Button>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-yellow-800 mb-2">Cannot Edit Booking</h3>
          <p className="text-yellow-700 mb-4">
            {isPastBooking 
              ? 'This booking is in the past and cannot be edited.' 
              : `This booking has a status of ${booking.status} and cannot be edited.`}
          </p>
          <Button onClick={() => router.push(`/bookings/${id}`)}>View Booking Details</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-6 flex items-center gap-2" 
        onClick={() => router.push(`/bookings/${id}`)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Booking Details
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Booking</CardTitle>
          <CardDescription>
            Update details for booking #{booking.reference}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle</Label>
              <Input
                id="vehicle"
                value={`${booking.vehicle.registration}`}
                disabled
                className="bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="garage">Garage</Label>
              <Input
                id="garage"
                value={booking.garage.name}
                disabled
                className="bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={!selectedDate ? 'border-red-500' : ''}
                />
              </div>
              {!selectedDate && <p className="text-red-500 text-sm">Date is required</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeSlot">Time Slot</Label>
              <select
                id="timeSlot"
                value={selectedTimeSlot}
                onChange={(e) => setSelectedTimeSlot(e.target.value)}
                className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${!selectedTimeSlot ? 'border-red-500' : ''}`}
              >
                <option value="">Select a time slot</option>
                {availableTimeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
                {/* Include current time slot if not in available slots */}
                {selectedTimeSlot && !availableTimeSlots.includes(selectedTimeSlot) && (
                  <option value={selectedTimeSlot}>{selectedTimeSlot} (Current)</option>
                )}
              </select>
              {!selectedTimeSlot && <p className="text-red-500 text-sm">Time slot is required</p>}
              {availableTimeSlots.length === 0 && selectedDate && (
                <p className="text-yellow-500 text-sm">No available time slots for this date</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requirements or information"
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSaving} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
