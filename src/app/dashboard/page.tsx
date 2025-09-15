"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Car, MapPin, Plus, AlertTriangle, CheckCircle, Shield, User, LogOut } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { MainLayout } from '@/components/layout/main-layout'

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
      router.push('/signin')
      return
    }

    // Redirect garage owners to their admin dashboard
    if (session.user?.role === 'GARAGE_OWNER') {
      router.push('/garage-admin')
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isGarageOwner = session.user?.role === 'GARAGE_OWNER'

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">My Dashboard</h2>
          <p className="text-gray-600 mt-2">Welcome, {session.user?.name || session.user?.email}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Container de Bookings */}
          <Card className="shadow-lg border-t-4 border-t-blue-500">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-bold">Minhas Reservas</CardTitle>
                  <CardDescription>Gerencie suas reservas de MOT</CardDescription>
                </div>
                <Button onClick={() => router.push('/search')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  Adicionar Booking
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-16 w-16 text-blue-200 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Nenhuma reserva encontrada</p>
                  <Button onClick={() => router.push('/search')} size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Agendar MOT
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((booking) => (
                    <div 
                      key={booking.id} 
                      className="border rounded-lg p-4 hover:bg-slate-50 hover:shadow-md transition-all cursor-pointer" 
                      onClick={() => {
                        // Verificar se a reserva pode ser editada
                        const bookingDate = new Date(booking.date);
                        const isPastBooking = bookingDate < new Date();
                        const canEdit = !isPastBooking && (booking.status === 'confirmed' || booking.status === 'pending');
                        
                        if (canEdit) {
                          router.push(`/bookings/edit/${booking.id}`);
                        } else {
                          // Se não puder editar, redirecionar para a página de detalhes
                          router.push(`/bookings/${booking.id}`);
                        }
                      }}
                    >
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
                          {formatDate(new Date(booking.date))} às {booking.timeSlot}
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

          {/* Container de Vehicles */}
          <Card className="shadow-lg border-t-4 border-t-green-500">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-bold">Meus Veículos</CardTitle>
                  <CardDescription>Gerencie seus veículos e datas de MOT</CardDescription>
                </div>
                <Button onClick={() => router.push('/vehicles/add')} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4" />
                  Adicionar Veículo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {vehicles.length === 0 ? (
                <div className="text-center py-8">
                  <Car className="h-16 w-16 text-green-200 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Nenhum veículo encontrado</p>
                  <Button onClick={() => router.push('/vehicles/add')} size="sm" className="bg-green-600 hover:bg-green-700">
                    Adicionar Veículo
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
                          className={`border rounded-lg p-4 hover:bg-slate-50 hover:shadow-md transition-all cursor-pointer ${isFirstVehicle && motStatus.urgent ? 'border-red-300 bg-red-50 hover:bg-red-100' : ''}`}
                          onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{vehicle.registration}</p>
                              <p className="text-sm text-gray-600">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </p>
                            </div>
                            <Badge className={`${motStatus.urgent ? 'bg-red-500' : 'bg-green-500'} text-white flex items-center gap-1`}>
                              {motStatus.urgent ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                              {motStatus.message}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            <div className="flex justify-between items-center">
                              <span>Próximo MOT:</span>
                              <span className="font-medium">{vehicle.motExpiryDate ? formatDate(new Date(vehicle.motExpiryDate)) : 'Não disponível'}</span>
                            </div>
                          </div>
                          {isFirstVehicle && motStatus.urgent && (
                            <Button 
                              size="sm" 
                              className="w-full mt-3 bg-red-600 hover:bg-red-700"
                              onClick={() => router.push(`/search?vehicle=${vehicle.id}`)}
                            >
                              Agendar MOT
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
    </MainLayout>
  )
}