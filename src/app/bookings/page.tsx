"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Calendar, Car, MapPin, Clock, Plus, Filter, Star } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { MainLayout } from '@/components/layout/main-layout'
import { ReviewSubmissionModal } from '@/components/reviews/review-submission-modal'

interface Booking {
  id: string
  reference: string
  date: string
  timeSlot: string
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
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
  hasReview?: boolean
}

export default function BookingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.id) {
      router.push('/signin')
      return
    }

    fetchBookings()
  }, [session, status, router])

  useEffect(() => {
    filterBookings()
  }, [bookings, statusFilter])

  const fetchBookings = async () => {
    try {
      console.log('Fetching bookings...')
      const response = await fetch('/api/bookings', {
        credentials: 'include'
      })
      console.log('Response status:', response.status)
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error('Failed to fetch bookings')
      }
      const data = await response.json()
      console.log('Bookings data:', data)
      console.log('Number of bookings:', data.bookings?.length || 0)
      setBookings(data.bookings || [])
    } catch (error) {
      setError('Failed to load bookings')
      console.error('Error fetching bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterBookings = () => {
    console.log('Filtering bookings. Total bookings:', bookings.length)
    console.log('Status filter:', statusFilter)
    let filtered = bookings

    if (statusFilter !== 'all') {
      filtered = bookings.filter(booking => {
        // Convert database status (uppercase) to frontend status (lowercase)
        const normalizedStatus = booking.status.toLowerCase()
        console.log(`Booking ${booking.reference}: status=${booking.status}, normalized=${normalizedStatus}, filter=${statusFilter}, match=${normalizedStatus === statusFilter}`)
        return normalizedStatus === statusFilter
      })
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    console.log('Filtered bookings:', filtered.length)
    setFilteredBookings(filtered)
  }

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    switch (normalizedStatus) {
      case 'confirmed':
        return <StatusBadge variant="info">Confirmed</StatusBadge>
      case 'completed':
        return <StatusBadge variant="success">Completed</StatusBadge>
      case 'cancelled':
        return <StatusBadge variant="destructive">Cancelled</StatusBadge>
      case 'pending':
        return <StatusBadge variant="warning">Pending</StatusBadge>
      case 'in_progress':
        return <StatusBadge variant="info">In Progress</StatusBadge>
      case 'no_show':
        return <StatusBadge variant="destructive">No Show</StatusBadge>
      default:
        return <StatusBadge variant="default">{status}</StatusBadge>
    }
  }

  const isUpcoming = (booking: Booking) => {
    const bookingDate = new Date(booking.date)
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Reset to start of day for comparison
    return bookingDate >= now && !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(booking.status)
  }

  const isPast = (booking: Booking) => {
    const bookingDate = new Date(booking.date)
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Reset to start of day for comparison
    return bookingDate < now || ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(booking.status)
  }

  if (status === 'loading' || isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading bookings...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!session) {
    return null
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
                <p className="text-muted-foreground text-sm">View and manage your MOT test appointments</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filter by status:</span>
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
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </Button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {statusFilter === 'all' ? 'No bookings found' : `No ${statusFilter} bookings found`}
          </h3>
          <p className="text-muted-foreground mb-6">
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
          {(() => {
            const upcomingCount = filteredBookings.filter(isUpcoming).length
            const pastCount = filteredBookings.filter(isPast).length
            console.log(`Upcoming bookings: ${upcomingCount}, Past bookings: ${pastCount}`)
            return null
          })()}

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
                            <p className="font-medium text-foreground">
                              {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                            </p>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {formatDate(new Date(booking.date))}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {booking.timeSlot}
                            </div>
                            <div className="flex items-start gap-2 text-muted-foreground">
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
                          
                          <div className="pt-3 border-t border-border flex justify-between items-center">
                            <p className="text-xs text-muted-foreground">
                              Booked on {formatDate(new Date(booking.createdAt))}
                            </p>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => router.push(`/bookings/${booking.id}`)}
                              >
                                View Details
                              </Button>
                              {(booking.status === 'CONFIRMED') && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => router.push(`/bookings/edit/${booking.id}`)}
                                >
                                  Edit
                                </Button>
                              )}
                            </div>
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
                            <p className="font-medium text-foreground">
                              {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                            </p>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {formatDate(new Date(booking.date))}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {booking.timeSlot}
                            </div>
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4 mt-0.5" />
                              <div>
                                <p className="font-medium">{booking.garage.name}</p>
                                <p>{booking.garage.address}</p>
                                <p>{booking.garage.city}, {booking.garage.postcode}</p>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-border space-y-3">
                            <p className="text-xs text-muted-foreground">
                              Booked on {formatDate(new Date(booking.createdAt))}
                            </p>
                            {booking.status === 'COMPLETED' && (
                              <Button
                                onClick={() => {
                                  setSelectedBookingForReview(booking)
                                  setShowReviewModal(true)
                                }}
                                variant={booking.hasReview ? "outline" : "default"}
                                size="sm"
                                className="w-full flex items-center justify-center gap-2"
                              >
                                <Star className={`h-4 w-4 ${booking.hasReview ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                {booking.hasReview ? 'Review Submitted' : 'Write Review'}
                              </Button>
                            )}
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

          {/* Review Modal */}
          {selectedBookingForReview && (
            <ReviewSubmissionModal
              isOpen={showReviewModal}
              onClose={() => {
                setShowReviewModal(false)
                setSelectedBookingForReview(null)
              }}
              bookingId={selectedBookingForReview.id}
              reviewerType="CUSTOMER"
              revieweeName={selectedBookingForReview.garage.name}
              onSuccess={() => {
                // Refresh bookings to show updated review status
                fetchBookings()
              }}
            />
          )}
        </div>
      </div>
    </MainLayout>
  )
}