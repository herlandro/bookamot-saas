"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/ui/status-badge'
import { Calendar, Car, MapPin, Clock, Plus, Filter, Star, Search, Download } from 'lucide-react'
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
    averageRating?: number
    reviewCount?: number
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [lastCheckedBookings, setLastCheckedBookings] = useState<string[]>([])
  const itemsPerPage = 10

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.id) {
      router.push('/signin')
      return
    }

    fetchBookings()
  }, [session, status, router, currentPage, statusFilter, searchTerm])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, searchTerm])

  // Check for newly completed bookings and auto-open review modal
  useEffect(() => {
    if (bookings.length === 0) return

    const completedBookings = bookings.filter(booking => 
      booking.status === 'COMPLETED' && !booking.hasReview
    )

    const completedBookingIds = completedBookings.map(booking => booking.id)

    // Find newly completed bookings (not in lastCheckedBookings)
    const newlyCompleted = completedBookings.filter(booking => 
      !lastCheckedBookings.includes(booking.id)
    )

    if (newlyCompleted.length > 0 && lastCheckedBookings.length > 0 && !showReviewModal) {
      // Auto-open review modal for the first newly completed booking
      const bookingToReview = newlyCompleted[0]
      setSelectedBookingForReview(bookingToReview)
      setShowReviewModal(true)
    }

    // Update the list of checked bookings only if it has changed
    if (JSON.stringify(completedBookingIds.sort()) !== JSON.stringify(lastCheckedBookings.sort())) {
      setLastCheckedBookings(completedBookingIds)
    }
  }, [bookings])

  // Periodic polling to check for booking updates
  useEffect(() => {
    if (status === 'loading' || !session?.user?.id) return

    const interval = setInterval(() => {
      // Only poll if no modal is open to avoid interrupting user interaction
      if (!showReviewModal) {
        fetchBookings()
      }
    }, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [session, status, showReviewModal])

  const fetchBookings = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter.toUpperCase() })
      })
      
      const response = await fetch(`/api/bookings?${params}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error('Failed to fetch bookings')
      }
      
      const data = await response.json()
      setBookings(data.bookings || [])
      setTotalPages(data.pagination?.pages || 1)
    } catch (error) {
      setError('Failed to load bookings')
      console.error('Error fetching bookings:', error)
    } finally {
      setIsLoading(false)
    }
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="shadow-xl rounded-lg border border-border bg-card">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Bookings
                  </CardTitle>
                  <CardDescription>
                    Manage and view all your bookings
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <form onSubmit={(e) => { e.preventDefault(); }} className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by garage or vehicle..."
                      className="pl-9 w-full sm:w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </form>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                  <p className="text-destructive">{error}</p>
                </div>
              )}

              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>

                <TabsContent value={statusFilter} className="space-y-4">
                  {bookings.length === 0 ? (
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
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/bookings/${booking.id}`)}
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{booking.reference}</span>
                                {getStatusBadge(booking.status)}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(new Date(booking.date))}</span>
                                <Clock className="h-4 w-4 ml-2" />
                                <span>{booking.timeSlot}</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{booking.garage.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-muted-foreground" />
                                <span>{booking.vehicle.make} {booking.vehicle.model} ({booking.vehicle.registration})</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedBookingForReview(booking)
                                  setShowReviewModal(true)
                                }}
                                className="flex items-center gap-1"
                              >
                                <Star className={`h-4 w-4 ${booking.hasReview ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                              </Button>
                              <Button variant="outline" size="sm" className="md:self-center">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <div className="text-sm text-muted-foreground">
                Showing page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>

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
                fetchBookings()
              }}
            />
          )}
        </div>
      </div>
    </MainLayout>
  )
}