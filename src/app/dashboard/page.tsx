"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Car, Clock, MapPin, Plus, AlertTriangle, CheckCircle, Shield, Bell, User, LogOut, Settings } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

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

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
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

      if (!bookingsResponse.ok || !vehiclesResponse.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const bookingsData = await bookingsResponse.json()
      const vehiclesData = await vehiclesResponse.json()

      setBookings(bookingsData.bookings || [])
      setVehicles(vehiclesData.vehicles || [])

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
        return <Badge className="bg-blue-500 text-white">Confirmed</Badge>
      case 'completed':
        return <Badge className="bg-green-500 text-white">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">Cancelled</Badge>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isGarageOwner = session.user?.role === 'GARAGE_OWNER'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">BookaMOT</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">{session.user?.name}</span>
                <button
                  onClick={() => signOut()}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-2">Welcome back, {session.user?.name || session.user?.email}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVehicles}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Need MOT Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.vehiclesNeedingMot}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bookings</CardTitle>
              <CardDescription>Your confirmed MOT appointments</CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.filter(isBookingUpcoming).length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No upcoming bookings</p>
                  <Button onClick={() => router.push('/search')} size="sm">
                    Book MOT Test
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings
                    .filter(isBookingUpcoming)
                    .slice(0, 3)
                    .map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{booking.vehicle.registration}</p>
                            <p className="text-sm text-gray-600">
                              {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                            </p>
                          </div>
                          {getBookingStatusBadge(booking.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatDate(new Date(booking.date))} at {booking.timeSlot}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {booking.garage.name}, {booking.garage.city}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vehicles Needing Attention */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicles Needing Attention</CardTitle>
              <CardDescription>MOT expiring soon or expired</CardDescription>
            </CardHeader>
            <CardContent>
              {vehicles.filter(vehicle => getVehicleMotStatus(vehicle).urgent).length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">All vehicles have valid MOTs</p>
                  <Button onClick={() => router.push('/vehicles')} size="sm" variant="outline">
                    View Vehicles
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {vehicles
                    .filter(vehicle => getVehicleMotStatus(vehicle).urgent)
                    .slice(0, 3)
                    .map((vehicle) => {
                      const motStatus = getVehicleMotStatus(vehicle)
                      return (
                        <div key={vehicle.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{vehicle.registration}</p>
                              <p className="text-sm text-gray-600">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </p>
                            </div>
                            <Badge className="bg-red-500 text-white flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {motStatus.message}
                            </Badge>
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => router.push(`/search?vehicle=${vehicle.id}`)}
                          >
                            Book MOT Test
                          </Button>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to do</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={() => router.push('/search')} className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Book MOT Test
              </Button>
              <Button onClick={() => router.push('/vehicles/add')} variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Vehicle
              </Button>
              <Button onClick={() => router.push('/vehicles')} variant="outline" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                View Vehicles
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}