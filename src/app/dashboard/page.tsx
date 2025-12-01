"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Car, MapPin, Plus, AlertTriangle, CheckCircle, Star } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { MainLayout } from '@/components/layout/main-layout'
import { ReviewSubmissionModal } from '@/components/reviews/review-submission-modal'

interface Booking {
  id: string
  reference: string
  date: string
  timeSlot: string
  status: 'confirmed' | 'completed' | 'cancelled' | 'pending'
  garage: {
    id: string
    name: string
    address: string
    city: string
    postcode: string
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

interface Vehicle {
  id: string
  registration: string
  make: string
  model: string
  year: number
  motExpiryDate?: string
}

interface DashboardStats {
  totalBookings: number
  upcomingBookings: number
  totalVehicles: number
  vehiclesNeedingMot: number
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    upcomingBookings: 0,
    totalVehicles: 0,
    vehiclesNeedingMot: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/signin')
      return
    }

    // Redirect garage owners to their admin dashboard
    if (session.user?.role === 'GARAGE_OWNER') {
      router.push('/')
      return
    }

    fetchDashboardData()
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      const [bookingsResponse, vehiclesResponse] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/vehicles')
      ])

      const bookingsData = await bookingsResponse.json()
      const vehiclesData = await vehiclesResponse.json()

      if (!bookingsData || !vehiclesData) {
        throw new Error('Failed to fetch dashboard data')
      }

      setBookings(bookingsData.bookings || [])
      setVehicles(vehiclesData.vehicles || [])

      // Check if user is new (no vehicles and no bookings) - redirect to onboarding
      const hasNoVehicles = !vehiclesData.vehicles || vehiclesData.vehicles.length === 0
      const hasNoBookings = !bookingsData.bookings || bookingsData.bookings.length === 0

      if (hasNoVehicles && hasNoBookings) {
        router.push('/onboarding')
        return
      }

      // Calculate stats
      const now = new Date()
      const upcomingBookings = bookingsData.bookings?.filter((booking: Booking) => {
        const bookingDate = new Date(booking.date)
        return bookingDate >= now && booking.status === 'confirmed'
      }).length || 0

      const vehiclesNeedingMot = vehiclesData.vehicles?.filter((vehicle: Vehicle) => {
        if (!vehicle.motExpiryDate) return true
        const expiryDate = new Date(vehicle.motExpiryDate)
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 30
      }).length || 0

      setStats({
        totalBookings: bookingsData.bookings?.length || 0,
        upcomingBookings,
        totalVehicles: vehiclesData.vehicles?.length || 0,
        vehiclesNeedingMot
      })
    } catch (error) {
      setError('Failed to load dashboard data')
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-blue-500 text-primary-foreground">Confirmed</Badge>
      case 'completed':
        return <Badge className="bg-green-500 text-primary-foreground">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-destructive text-destructive-foreground">Cancelled</Badge>
      default:
        return <Badge className="bg-muted text-muted-foreground">{status}</Badge>
    }
  }

  const isBookingUpcoming = (booking: Booking) => {
    const bookingDate = new Date(booking.date)
    const now = new Date()
    return bookingDate >= now && booking.status === 'confirmed'
  }

  const getVehicleMotStatus = (vehicle: Vehicle) => {
    if (!vehicle.motExpiryDate) {
      return { urgent: true, message: 'No MOT data' }
    }

    const expiryDate = new Date(vehicle.motExpiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      return { urgent: true, message: 'Expired' }
    } else if (daysUntilExpiry <= 30) {
      return { urgent: true, message: `${daysUntilExpiry} days left` }
    } else {
      return { urgent: false, message: 'Valid' }
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isGarageOwner = session.user?.role === 'GARAGE_OWNER'

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-destructive">{error}</p>
          </div>
        )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bookings Section */}
            <div>
              {/* Header - Outside Card */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Bookings</h2>
                  <p className="text-muted-foreground text-sm mt-1">Manage your MOT bookings</p>
                </div>
                <Button onClick={() => router.push('/search')} className="flex items-center gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  Add Booking
                </Button>
              </div>

              {/* Main Content Card */}
              <Card className="shadow-lg border border-border">
                <CardContent className="pt-6">
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No bookings found</p>
                  <Button onClick={() => router.push('/search')} size="sm" className="bg-primary hover:bg-primary/90">
                    Book MOT
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((booking) => (
                    <div 
                      key={booking.id} 
                      className="border border-border rounded-lg p-4 hover:bg-muted hover:shadow-md transition-all cursor-pointer" 
                      onClick={() => {
                        // Verificar se a reserva pode ser editada
                        const bookingDate = new Date(booking.date);
                        const isPastBooking = bookingDate < new Date();
                        const canEdit = !isPastBooking && (booking.status === 'confirmed' || booking.status === 'pending');
                        
                        if (canEdit) {
                          router.push(`/bookings/edit/${booking.id}`);
                        } else {
                          // If can't edit, redirect to details page
                          router.push(`/bookings/${booking.id}`);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{booking.vehicle.registration}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                          </p>
                        </div>
                        {getBookingStatusBadge(booking.status)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(new Date(booking.date))} at {booking.timeSlot}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {booking.garage.name}, {booking.garage.city}
                        </div>
                      </div>
                      {booking.status === 'completed' && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedBookingForReview(booking)
                            setShowReviewModal(true)
                          }}
                          variant={booking.hasReview ? "outline" : "default"}
                          size="sm"
                          className="w-full mt-3 flex items-center justify-center gap-2"
                        >
                          <Star className={`h-4 w-4 ${booking.hasReview ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          {booking.hasReview ? 'Review Submitted' : 'Write Review'}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
              </Card>
            </div>

            {/* Vehicles Section */}
            <div>
              {/* Header - Outside Card */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Vehicles</h2>
                  <p className="text-muted-foreground text-sm mt-1">Manage your vehicles and MOT dates</p>
                </div>
                <Button onClick={() => router.push('/vehicles/add')} className="flex items-center gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  Add Vehicle
                </Button>
              </div>

              {/* Main Content Card */}
              <Card className="shadow-lg border border-border">
                <CardContent className="pt-6">
              {vehicles.length === 0 ? (
                <div className="text-center py-8">
                  <Car className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No vehicles found</p>
                  <Button onClick={() => router.push('/vehicles/add')} size="sm" className="bg-primary hover:bg-primary/90">
                    Add Vehicle
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {vehicles
                    .sort((a, b) => {
                      // Ordenar por data de expiração do MOT (os mais próximos primeiro)
                      if (!a.motExpiryDate) return -1;
                      if (!b.motExpiryDate) return 1;
                      return new Date(a.motExpiryDate).getTime() - new Date(b.motExpiryDate).getTime();
                    })
                    .map((vehicle, index) => {
                      const motStatus = getVehicleMotStatus(vehicle);
                      const isFirstVehicle = index === 0;
                      return (
                        <div 
                          key={vehicle.id} 
                          className={`border border-border rounded-lg p-4 hover:bg-muted hover:shadow-md transition-all cursor-pointer ${isFirstVehicle && motStatus.urgent ? 'border-destructive/30 bg-destructive/10 hover:bg-destructive/20' : ''}`}
                          onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{vehicle.registration}</p>
                              <p className="text-sm text-muted-foreground">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </p>
                            </div>
                            <Badge className={`${motStatus.urgent ? 'bg-destructive' : 'bg-green-500'} ${motStatus.urgent ? 'text-destructive-foreground' : 'text-primary-foreground'} flex items-center gap-1`}>
                              {motStatus.urgent ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                              {motStatus.message}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">
                            <div className="flex justify-between items-center">
                              <span>Next MOT:</span>
                              <span className="font-medium">{vehicle.motExpiryDate ? formatDate(new Date(vehicle.motExpiryDate)) : 'Not available'}</span>
                            </div>
                          </div>
                          {isFirstVehicle && motStatus.urgent && (
                            <Button
                              size="sm"
                              className="w-full mt-3 bg-destructive hover:bg-destructive/90"
                              onClick={() => router.push(`/search?vehicle=${vehicle.id}`)}
                            >
                              Book MOT
                            </Button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
              </Card>
            </div>
          </div>

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
                fetchDashboardData()
              }}
            />
          )}
        </div>
      </div>
    </MainLayout>
  )
}