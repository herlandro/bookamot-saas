"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { BookingCalendar } from '@/components/booking/booking-calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle } from 'lucide-react'

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

interface BookingData {
  garage: Garage
  vehicle: Vehicle
}

export default function BookingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const garageId = params.id as string
  
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingStep, setBookingStep] = useState<'calendar' | 'confirmation' | 'success'>('calendar')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [bookingReference, setBookingReference] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
      return
    }

    // Try to get booking data from session storage
    const storedData = sessionStorage.getItem('bookingData')
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData)
        if (parsed.garage?.id === garageId) {
          setBookingData(parsed)
        } else {
          // Garage ID doesn't match, fetch garage data
          fetchGarageData()
        }
      } catch (error) {
        console.error('Error parsing booking data:', error)
        fetchGarageData()
      }
    } else {
      fetchGarageData()
    }
    
    setLoading(false)
  }, [status, garageId, router])

  const fetchGarageData = async () => {
    try {
      const response = await fetch(`/api/garages/${garageId}`)
      if (response.ok) {
        const garage = await response.json()
        
        // Get user's first vehicle as default
        const vehiclesResponse = await fetch('/api/vehicles')
        if (vehiclesResponse.ok) {
          const vehiclesData = await vehiclesResponse.json()
          if (vehiclesData.vehicles?.length > 0) {
            setBookingData({
              garage,
              vehicle: vehiclesData.vehicles[0]
            })
          } else {
            // No vehicles, redirect to add vehicle page
            router.push('/vehicles/add')
          }
        }
      } else {
        router.push('/search')
      }
    } catch (error) {
      console.error('Error fetching garage data:', error)
      router.push('/search')
    }
  }

  const handleBookingSelect = (date: Date, timeSlot: string) => {
    setSelectedDate(date)
    setSelectedTimeSlot(timeSlot)
    setBookingStep('confirmation')
  }

  const handleConfirmBooking = async () => {
    if (!bookingData || !selectedDate || !selectedTimeSlot) return
    
    setSubmitting(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          garageId: bookingData.garage.id,
          vehicleId: bookingData.vehicle.id,
          date: selectedDate.toISOString(),
          timeSlot: selectedTimeSlot,
          motPrice: bookingData.garage.motPrice
        })
      })

      if (response.ok) {
        const result = await response.json()
        setBookingReference(result.booking.reference)
        setBookingStep('success')
        
        // Clear session storage
        sessionStorage.removeItem('bookingData')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create booking')
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Failed to create booking. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (bookingStep === 'confirmation') {
      setBookingStep('calendar')
    } else {
      router.push('/search')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!bookingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Booking data not found</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find the booking information. Please start a new search.
            </p>
            <Button onClick={() => router.push('/search')}>Back to Search</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {bookingStep === 'calendar' && 'Book MOT Test'}
              {bookingStep === 'confirmation' && 'Confirm Booking'}
              {bookingStep === 'success' && 'Booking Confirmed'}
            </h1>
            <p className="text-muted-foreground">
              {bookingStep === 'calendar' && 'Select your preferred date and time'}
              {bookingStep === 'confirmation' && 'Review your booking details'}
              {bookingStep === 'success' && 'Your MOT test has been booked successfully'}
            </p>
          </div>
        </div>

        {/* Calendar Step */}
        {bookingStep === 'calendar' && (
          <BookingCalendar
            garage={bookingData.garage}
            vehicle={bookingData.vehicle}
            onBookingSelect={handleBookingSelect}
            onCancel={handleCancel}
          />
        )}

        {/* Confirmation Step */}
        {bookingStep === 'confirmation' && selectedDate && selectedTimeSlot && (
          <Card>
            <CardHeader>
              <CardTitle>Confirm Your Booking</CardTitle>
              <CardDescription>
                Please review your booking details before confirming.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Garage Details</h3>
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">{bookingData.garage.name}</div>
                      <div className="text-muted-foreground">{bookingData.garage.address}</div>
                      <div className="text-muted-foreground">{bookingData.garage.city}, {bookingData.garage.postcode}</div>
                      <div className="text-muted-foreground">{bookingData.garage.phone}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Vehicle Details</h3>
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">{bookingData.vehicle.registration}</div>
                      <div className="text-muted-foreground">{bookingData.vehicle.make} {bookingData.vehicle.model}</div>
                      <div className="text-muted-foreground">Year: {bookingData.vehicle.year}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Appointment Details</h3>
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">{selectedDate.toLocaleDateString('en-GB', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</div>
                      <div className="text-muted-foreground">Time: {selectedTimeSlot}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Price</h3>
                    <div className="text-2xl font-bold text-primary">
                      £{bookingData.garage.motPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={handleConfirmBooking} 
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Creating Booking...' : 'Confirm Booking'}
                </Button>
                <Button variant="outline" onClick={() => setBookingStep('calendar')}>
                  Back to Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Step */}
        {bookingStep === 'success' && bookingReference && (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Booking Confirmed!</h3>
              <p className="text-muted-foreground mb-6">
                Your MOT test has been successfully booked. You will receive a confirmation email shortly.
              </p>
              
              <div className="bg-muted p-4 rounded-lg mb-6">
                <div className="text-sm text-muted-foreground mb-1">Booking Reference</div>
                <div className="text-xl font-mono font-bold">{bookingReference}</div>
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
                <Button variant="outline" onClick={() => router.push('/search')}>Book Another Test</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}