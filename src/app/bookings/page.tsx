"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Car, MapPin, Clock, Plus, Filter } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Booking {
  id: string
  reference: string
  date: string
  timeSlot: string
  status: 'confirmed' | 'completed' | 'cancelled'
  garage: {
    id: string
    name: string
    address: string
    city: string
    postcode: string
    phone?: string
  }
  vehicle: {
    id: string
    registration: string
    make: string
    model: string
    year: number
  }
  createdAt: string
}

export default function BookingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchBookings()
  }, [session, status, router])

  useEffect(() => {
    filterBookings()
  }, [bookings, statusFilter])

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings')
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      setError('Failed to load bookings')
      console.error('Error fetching bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterBookings = () => {
    let filtered = bookings
    
    if (statusFilter !== 'all') {
      filtered = bookings.filter(booking => booking.status === statusFilter)
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    setFilteredBookings(filtered)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-blue-500 text-white">Confirmed</Badge>
      case 'completed':
        return <Badge className="bg-green-500 text-white">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">Cancelled</Badge>
      default:
        return <Badge className="bg-slate-500 text-white">{status}</Badge>
    }
  }

  const isUpcoming = (booking: Booking) => {
    const bookingDate = new Date(booking.date)
    const now = new Date()
    return bookingDate >= now && booking.status === 'confirmed'
  }

  const isPast = (booking: Booking) => {
    const bookingDate = new Date(booking.date)
    const now = new Date()
    return bookingDate < now
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">View and manage your MOT test appointments</p>
        </div>
        <Button onClick={() => router.push('/search')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Book New MOT
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('confirmed')}
          >
            Confirmed
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('completed')}
          >
            Completed
          </Button>
          <Button
            variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('cancelled')}
          >
            Cancelled
          </Button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {statusFilter === 'all' ? 'No bookings found' : `No ${statusFilter} bookings found`}
          </h3>
          <p className="text-gray-600 mb-6">
            {statusFilter === 'all' 
              ? 'Book your first MOT test to get started'
              : `You don't have any ${statusFilter} bookings`
            }
          </p>
          <Button onClick={() => router.push('/search')} className="flex items-center gap-2 mx-auto">
            <Plus className="h-4 w-4" />
            Book MOT Test
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Bookings */}
          {filteredBookings.some(isUpcoming) && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Bookings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBookings
                  .filter(isUpcoming)
                  .map((booking) => (
                    <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">Booking #{booking.reference}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <Car className="h-4 w-4" />
                              {booking.vehicle.registration}
                            </CardDescription>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                            </p>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="h-4 w-4" />
                              {formatDate(new Date(booking.date))}
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="h-4 w-4" />
                              {booking.timeSlot}
                            </div>
                            <div className="flex items-start gap-2 text-gray-600">
                              <MapPin className="h-4 w-4 mt-0.5" />
                              <div>
                                <p className="font-medium">{booking.garage.name}</p>
                                <p>{booking.garage.address}</p>
                                <p>{booking.garage.city}, {booking.garage.postcode}</p>
                                {booking.garage.phone && (
                                  <p className="mt-1">📞 {booking.garage.phone}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t">
                            <p className="text-xs text-gray-500">
                              Booked on {formatDate(new Date(booking.createdAt))}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Past Bookings */}
          {filteredBookings.some(isPast) && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Bookings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBookings
                  .filter(isPast)
                  .map((booking) => (
                    <Card key={booking.id} className="hover:shadow-lg transition-shadow opacity-90">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">Booking #{booking.reference}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <Car className="h-4 w-4" />
                              {booking.vehicle.registration}
                            </CardDescription>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                            </p>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="h-4 w-4" />
                              {formatDate(new Date(booking.date))}
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="h-4 w-4" />
                              {booking.timeSlot}
                            </div>
                            <div className="flex items-start gap-2 text-gray-600">
                              <MapPin className="h-4 w-4 mt-0.5" />
                              <div>
                                <p className="font-medium">{booking.garage.name}</p>
                                <p>{booking.garage.address}</p>
                                <p>{booking.garage.city}, {booking.garage.postcode}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t">
                            <p className="text-xs text-gray-500">
                              Booked on {formatDate(new Date(booking.createdAt))}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}