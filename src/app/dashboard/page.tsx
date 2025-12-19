"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Car, MapPin, Plus, AlertTriangle, CheckCircle, Star, Loader2 } from 'lucide-react'
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
  mileage?: number | null
  lastMotDate?: string | null
  lastMotResult?: string | null
  motExpiryDate?: string | null
  motStatus?: string | null
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
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
  }, [session, status, router, mounted])

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

      // No need to redirect to onboarding anymore

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
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <Badge className="bg-blue-500 text-white">Confirmed</Badge>
      case 'completed':
        return <Badge className="bg-green-500 text-white">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">Cancelled</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500 text-black">Pending</Badge>
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>
    }
  }

  const isBookingUpcoming = (booking: Booking) => {
    const bookingDate = new Date(booking.date)
    const now = new Date()
    return bookingDate >= now && booking.status === 'confirmed'
  }

  const getVehicleMotStatus = (vehicle: Vehicle) => {
    if (!vehicle.motExpiryDate) {
      return { urgent: true, warning: false, message: 'No MOT data', daysUntilExpiry: null }
    }

    const expiryDate = new Date(vehicle.motExpiryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      return { urgent: true, warning: false, message: 'Expired', daysUntilExpiry }
    } else if (daysUntilExpiry <= 30) {
      return { urgent: false, warning: true, message: `${daysUntilExpiry} days left`, daysUntilExpiry }
    } else if (daysUntilExpiry <= 60) {
      return { urgent: false, warning: true, message: `${daysUntilExpiry} days left`, daysUntilExpiry }
    } else {
      return { urgent: false, warning: false, message: 'Valid', daysUntilExpiry }
    }
  }

  // Check if Book MOT button should be enabled (within 2 months of expiry)
  const canBookMot = (vehicle: Vehicle) => {
    if (!vehicle.motExpiryDate) return true // Always allow if no MOT data

    const expiryDate = new Date(vehicle.motExpiryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    // Enable button if within 2 months (60 days) of expiry or already expired
    return daysUntilExpiry <= 60
  }

  // Format mileage with thousands separator
  const formatMileage = (mileage: number | null | undefined) => {
    if (!mileage) return 'N/A'
    return mileage.toLocaleString('en-GB') + ' mi'
  }

  // Get MOT result badge styling
  const getMotResultBadge = (result: string | null | undefined) => {
    if (!result) {
      return <Badge className="bg-gray-500 text-white">Unknown</Badge>
    }

    switch (result.toUpperCase()) {
      case 'PASS':
        return <Badge className="bg-green-500 text-white">Passed</Badge>
      case 'FAIL':
        return <Badge className="bg-red-500 text-white">Failed</Badge>
      default:
        return <Badge className="bg-gray-500 text-white">{result}</Badge>
    }
  }

  if (!mounted || status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
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
            {/* Bookings Section - 50% width */}
            <div className="lg:col-span-1">
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
                <div className="space-y-2">
                  {bookings
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((booking) => (
                    <div
                      key={booking.id}
                      className="border border-border rounded-lg p-3 hover:bg-muted/50 hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => {
                        const bookingDate = new Date(booking.date);
                        const isPastBooking = bookingDate < new Date();
                        const canEdit = !isPastBooking && (booking.status === 'confirmed' || booking.status === 'pending');

                        if (canEdit) {
                          router.push(`/bookings/edit/${booking.id}`);
                        } else {
                          router.push(`/bookings/${booking.id}`);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        {/* Left side - 2 lines of info */}
                        <div className="flex-1 min-w-0">
                          {/* Line 1: Vehicle and date/time */}
                          <div className="flex items-center gap-3 text-sm">
                            <span className="font-bold">{booking.vehicle.registration}</span>
                            <span className="text-muted-foreground">
                              {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                            </span>
                          </div>
                          {/* Line 2: Date, time, and garage */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{formatDate(new Date(booking.date))} at {booking.timeSlot}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="truncate">{booking.garage.name}, {booking.garage.city}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right side - Status badge centered vertically */}
                        <div className="flex items-center gap-2 ml-4">
                          {getBookingStatusBadge(booking.status)}
                          {booking.status === 'completed' && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedBookingForReview(booking)
                                setShowReviewModal(true)
                              }}
                              variant={booking.hasReview ? "outline" : "default"}
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Star className={`h-3.5 w-3.5 ${booking.hasReview ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                              {booking.hasReview ? 'Reviewed' : 'Review'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
              </Card>
            </div>

            {/* Vehicles Section - 50% width */}
            <div className="lg:col-span-1">
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
                <div className="overflow-x-auto">
                  {/* Desktop Table View */}
                  <table className="w-full hidden md:table">
                    <thead>
                      <tr className="border-b border-border text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium w-12"></th>
                        <th className="pb-3 font-medium">Vehicle</th>
                        <th className="pb-3 font-medium text-center">Last MOT</th>
                        <th className="pb-3 font-medium text-center">Result</th>
                        <th className="pb-3 font-medium text-center">Next MOT Due</th>
                        <th className="pb-3 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles
                        .sort((a, b) => {
                          if (!a.motExpiryDate) return -1;
                          if (!b.motExpiryDate) return 1;
                          return new Date(a.motExpiryDate).getTime() - new Date(b.motExpiryDate).getTime();
                        })
                        .map((vehicle) => {
                          const motStatus = getVehicleMotStatus(vehicle);
                          const bookingEnabled = canBookMot(vehicle);

                          return (
                            <tr
                              key={vehicle.id}
                              className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                            >
                              {/* Avatar Column */}
                              <td className="py-3 pr-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                                  <Car className="h-5 w-5 text-primary" />
                                </div>
                              </td>

                              {/* Vehicle Info Column */}
                              <td className="py-3">
                                <p className="font-bold">{vehicle.registration}</p>
                                <p className="text-sm text-muted-foreground">
                                  {vehicle.year} {vehicle.make} {vehicle.model}
                                </p>
                              </td>

                              {/* Last MOT Column */}
                              <td className="py-3 text-sm text-center">
                                {vehicle.lastMotDate ? formatDate(new Date(vehicle.lastMotDate)) : 'N/A'}
                              </td>

                              {/* Result Column */}
                              <td className="py-3 text-center">
                                {getMotResultBadge(vehicle.lastMotResult)}
                              </td>

                              {/* Next MOT Due Column */}
                              <td className="py-3 text-sm text-center">
                                <span className={`font-medium ${motStatus.urgent ? 'text-red-600 dark:text-red-400' : motStatus.warning ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                                  {vehicle.motExpiryDate ? formatDate(new Date(vehicle.motExpiryDate)) : 'N/A'}
                                </span>
                              </td>

                              {/* Action Column */}
                              <td className="py-3 text-right">
                                <Button
                                  size="sm"
                                  className={`${bookingEnabled
                                    ? (motStatus.urgent
                                        ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'
                                        : 'bg-primary hover:bg-primary/90')
                                    : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                                  disabled={!bookingEnabled}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (bookingEnabled) {
                                      router.push(`/search?vehicle=${vehicle.id}`);
                                    }
                                  }}
                                >
                                  Book
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {vehicles
                      .sort((a, b) => {
                        if (!a.motExpiryDate) return -1;
                        if (!b.motExpiryDate) return 1;
                        return new Date(a.motExpiryDate).getTime() - new Date(b.motExpiryDate).getTime();
                      })
                      .map((vehicle) => {
                        const motStatus = getVehicleMotStatus(vehicle);
                        const bookingEnabled = canBookMot(vehicle);

                        return (
                          <div
                            key={vehicle.id}
                            className="border border-border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                            onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                          >
                            <div className="flex items-start gap-3">
                              {/* Avatar */}
                              <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <Car className="h-5 w-5 text-primary" />
                              </div>

                              <div className="flex-1 min-w-0">
                                {/* Vehicle Info */}
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-bold">{vehicle.registration}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {vehicle.year} {vehicle.make} {vehicle.model}
                                    </p>
                                  </div>
                                </div>

                                {/* MOT Info Grid */}
                                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                  <div>
                                    <span className="text-muted-foreground">Last MOT: </span>
                                    <span className="font-medium">{vehicle.lastMotDate ? formatDate(new Date(vehicle.lastMotDate)) : 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-muted-foreground">Result: </span>
                                    {getMotResultBadge(vehicle.lastMotResult)}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Due: </span>
                                    <span className={`font-medium ${motStatus.urgent ? 'text-red-600 dark:text-red-400' : motStatus.warning ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                                      {vehicle.motExpiryDate ? formatDate(new Date(vehicle.motExpiryDate)) : 'N/A'}
                                    </span>
                                  </div>
                                </div>

                                {/* Book Button */}
                                <Button
                                  size="sm"
                                  className={`w-full ${bookingEnabled
                                    ? (motStatus.urgent
                                        ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'
                                        : 'bg-primary hover:bg-primary/90')
                                    : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                                  disabled={!bookingEnabled}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (bookingEnabled) {
                                      router.push(`/search?vehicle=${vehicle.id}`);
                                    }
                                  }}
                                >
                                  Book
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
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
