"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Calendar, Car, MapPin, Clock, ArrowLeft, Trash2, Edit, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { MainLayout } from '@/components/layout/main-layout'

interface Booking {
  id: string
  reference: string
  date: string
  timeSlot: string
  status: 'confirmed' | 'completed' | 'cancelled' | 'pending'
  totalPrice: number
  notes?: string
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
  paymentStatus: string
}

export default function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const id = React.use(params).id
  const { data: session, status } = useSession()
  const router = useRouter()
  const userId = session?.user?.id
  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!userId) {
      router.push('/signin')
      return
    }

    fetchBooking()
  }, [userId, status, router, id])
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    }
  }, [status, router])

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error('Failed to fetch booking')
      }
      const data = await response.json()
      setBooking(data)
    } catch (error) {
      setError('Failed to load booking details')
      console.error('Error fetching booking:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      const response = await fetch(`/api/bookings/${id}/cancel`, {
        method: 'PATCH',
        credentials: 'include'
      })

      if (response.ok) {
        // Refresh booking data
        fetchBooking()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to cancel booking')
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        router.push('/bookings')
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to delete booking')
      }
    } catch (error) {
      console.error('Error deleting booking:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <StatusBadge variant="info">Confirmed</StatusBadge>
      case 'completed':
        return <StatusBadge variant="success">Completed</StatusBadge>
      case 'cancelled':
        return <StatusBadge variant="destructive">Cancelled</StatusBadge>
      case 'pending':
        return <StatusBadge variant="warning">Pending</StatusBadge>
      default:
        return <StatusBadge variant="default">{status}</StatusBadge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <StatusBadge variant="success">Paid</StatusBadge>
      case 'PENDING':
        return <StatusBadge variant="warning">Payment Pending</StatusBadge>
      case 'FAILED':
        return <StatusBadge variant="destructive">Payment Failed</StatusBadge>
      default:
        return <StatusBadge variant="default">{status}</StatusBadge>
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto mb-4" />
              <p className="text-slate-600">Loading booking details...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
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
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => fetchBooking()}>Try Again</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!booking) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            className="mb-6 flex items-center gap-2" 
            onClick={() => router.push('/bookings')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </Button>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <XCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-yellow-800 mb-2">Booking Not Found</h3>
            <p className="text-yellow-700 mb-4">The booking you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button onClick={() => router.push('/bookings')}>View All Bookings</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const bookingDate = new Date(booking.date)
  const isPastBooking = bookingDate < new Date()
  const canCancel = booking.status === 'confirmed' || booking.status === 'pending'
  const canEdit = booking.status === 'confirmed' || booking.status === 'pending'

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 flex items-center gap-2" 
          onClick={() => router.push('/bookings')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">Booking #{booking.reference}</CardTitle>
                    <CardDescription>
                      Created on {formatDate(new Date(booking.createdAt))}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(booking.status)}
                    {getPaymentStatusBadge(booking.paymentStatus)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Appointment Details</h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Date</p>
                          <p className="text-gray-600">{formatDate(bookingDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Time</p>
                          <p className="text-gray-600">{booking.timeSlot}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Vehicle Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Car className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">{booking.vehicle.registration}</p>
                          <p className="text-gray-600">{booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-lg mb-4">Garage Information</h3>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium">{booking.garage.name}</p>
                      <p className="text-gray-600">{booking.garage.address}</p>
                      <p className="text-gray-600">{booking.garage.city}, {booking.garage.postcode}</p>
                      {booking.garage.phone && <p className="text-gray-600">{booking.garage.phone}</p>}
                    </div>
                  </div>
                </div>

                {booking.notes && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-lg mb-2">Notes</h3>
                    <p className="text-gray-600">{booking.notes}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <div>
                  <p className="text-sm text-gray-600">Total Price</p>
                  <p className="text-xl font-bold">£{booking.totalPrice.toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  {canCancel && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                          <XCircle className="h-4 w-4" />
                          Cancel Booking
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel this booking? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>No, keep booking</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleCancel} 
                            className="bg-red-500 hover:bg-red-600"
                            disabled={isCancelling}
                          >
                            {isCancelling ? 'Cancelling...' : 'Yes, cancel booking'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {canEdit && (
                    <Button 
                      onClick={() => router.push(`/bookings/edit/${booking.id}`)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Booking
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => router.push(`/search?vehicle=${booking.vehicle.id}`)}
                  className="w-full flex items-center gap-2 justify-center"
                  variant="outline"
                >
                  <Calendar className="h-4 w-4" />
                  Book Another MOT
                </Button>
                
                <Button 
                  onClick={() => router.push(`/vehicles/edit/${booking.vehicle.id}`)}
                  className="w-full flex items-center gap-2 justify-center"
                  variant="outline"
                >
                  <Car className="h-4 w-4" />
                  View Vehicle Details
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full flex items-center gap-2 justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Booking
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this booking and remove it from our records.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete} 
                        className="bg-red-500 hover:bg-red-600"
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
