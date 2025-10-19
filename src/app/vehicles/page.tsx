"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Car, Calendar, AlertTriangle, CheckCircle, ArrowUpDown, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { MainLayout } from '@/components/layout/main-layout'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface Vehicle {
  id: string
  registration: string
  make: string
  model: string
  year: number
  fuelType: string
  color: string
  engineSize?: number
  lastMotResult?: string
  lastMotDate?: string
  motExpiryDate?: string
  hasActiveBooking?: boolean
}

type SortField = 'registration' | 'make' | 'fuelType' | 'motStatus'

export default function VehiclesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortBy, setSortBy] = useState<SortField>('registration')
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin')
      return
    }

    if (user) {
      fetchVehicles()
      fetchBookings()
    }
  }, [user, authLoading, router])

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles')
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles')
      }
      const data = await response.json()
      setVehicles(data.vehicles)
    } catch (error) {
      setError('Failed to load vehicles')
      console.error('Error fetching vehicles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings')
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const hasActiveBooking = (vehicleId: string) => {
    return bookings.some(booking =>
      booking.vehicle.id === vehicleId &&
      !['CANCELLED', 'COMPLETED'].includes(booking.status)
    )
  }

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to remove this vehicle? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete vehicle')
      }

      // Remove the vehicle from the state
      setVehicles(vehicles.filter(vehicle => vehicle.id !== vehicleId))
      setSelectedVehicles(selectedVehicles.filter(id => id !== vehicleId))
    } catch (error: any) {
      setError(error.message || 'Failed to delete vehicle')
      console.error('Error deleting vehicle:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedVehicles.length === 0) return

    if (!confirm(`Are you sure you want to remove ${selectedVehicles.length} vehicle(s)? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      const deletePromises = selectedVehicles.map(vehicleId =>
        fetch(`/api/vehicles/${vehicleId}`, { method: 'DELETE' })
      )

      const results = await Promise.all(deletePromises)
      const failedDeletes = results.filter(r => !r.ok)

      if (failedDeletes.length > 0) {
        throw new Error(`Failed to delete ${failedDeletes.length} vehicle(s)`)
      }

      // Remove deleted vehicles from state
      setVehicles(vehicles.filter(v => !selectedVehicles.includes(v.id)))
      setSelectedVehicles([])
    } catch (error: any) {
      setError(error.message || 'Failed to delete selected vehicles')
      console.error('Error deleting vehicles:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedVehicles.length === vehicles.length) {
      setSelectedVehicles([])
    } else {
      setSelectedVehicles(vehicles.map(v => v.id))
    }
  }

  const toggleSelectVehicle = (vehicleId: string) => {
    if (selectedVehicles.includes(vehicleId)) {
      setSelectedVehicles(selectedVehicles.filter(id => id !== vehicleId))
    } else {
      setSelectedVehicles([...selectedVehicles, vehicleId])
    }
  }

  const sortVehicles = (vehiclesToSort: Vehicle[]) => {
    return [...vehiclesToSort].sort((a, b) => {
      switch (sortBy) {
        case 'registration':
          return a.registration.localeCompare(b.registration)
        case 'make':
          return `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`)
        case 'fuelType':
          return a.fuelType.localeCompare(b.fuelType)
        case 'motStatus':
          const aStatus = getMotStatus(a).status
          const bStatus = getMotStatus(b).status
          const statusOrder = { expired: 0, expiring: 1, valid: 2, unknown: 3 }
          return (statusOrder[aStatus as keyof typeof statusOrder] || 3) - (statusOrder[bStatus as keyof typeof statusOrder] || 3)
        default:
          return 0
      }
    })
  }

  const getMotStatus = (vehicle: Vehicle) => {
    if (!vehicle.motExpiryDate) {
      return { status: 'unknown', label: 'Unknown', color: 'bg-slate-500' }
    }

    const expiryDate = new Date(vehicle.motExpiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expired', color: 'bg-destructive' }
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', label: `${daysUntilExpiry} days left`, color: 'bg-warning' }
    } else {
      return { status: 'valid', label: 'Valid', color: 'bg-success' }
    }
  }

  const getMotIcon = (status: string) => {
    switch (status) {
      case 'expired':
        return <AlertTriangle className="h-4 w-4" />
      case 'expiring':
        return <AlertTriangle className="h-4 w-4" />
      case 'valid':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  if (authLoading || isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading vehicles...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Vehicles</h1>
          <p className="text-muted-foreground mt-2">Manage your vehicles and MOT history</p>
        </div>
        <Button onClick={() => router.push('/vehicles/add')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="text-center py-12">
          <Car className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold text-foreground">No vehicles found</h3>
        </div>
      ) : (
        <>
        {/* Sort and Selection Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedVehicles.length === vehicles.length && vehicles.length > 0}
                onChange={toggleSelectAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select All ({selectedVehicles.length}/{vehicles.length})
              </label>
            </div>
            {selectedVehicles.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedVehicles.length})
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortField)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registration">Registration</SelectItem>
                <SelectItem value="make">Make/Model</SelectItem>
                <SelectItem value="fuelType">Fuel Type</SelectItem>
                <SelectItem value="motStatus">MOT Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vehicles List */}
        <div className="space-y-4">{sortVehicles(vehicles).map((vehicle) => {
            const motStatus = getMotStatus(vehicle)
            const vehicleHasActiveBooking = hasActiveBooking(vehicle.id)
            return (
              <Card key={vehicle.id} className="hover:shadow-md transition-shadow border border-border">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Checkbox and Vehicle Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <Checkbox
                        checked={selectedVehicles.includes(vehicle.id)}
                        onChange={() => toggleSelectVehicle(vehicle.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-foreground">{vehicle.registration}</h3>
                          <Badge className={`${motStatus.color} text-primary-foreground flex items-center gap-1`}>
                            {getMotIcon(motStatus.status)}
                            {motStatus.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="text-muted-foreground">
                            <strong>Fuel:</strong> {vehicle.fuelType}
                          </span>
                          <span className="text-muted-foreground">
                            <strong>Color:</strong> {vehicle.color}
                          </span>
                          {vehicle.engineSize && (
                            <span className="text-muted-foreground">
                              <strong>Engine:</strong> {vehicle.engineSize}L
                            </span>
                          )}
                          {vehicle.motExpiryDate && (
                            <span className="text-muted-foreground">
                              <strong>MOT Expires:</strong> {formatDate(new Date(vehicle.motExpiryDate))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 md:ml-auto">
                      {!vehicleHasActiveBooking && (
                        <Button
                          onClick={() => router.push(`/search?vehicle=${vehicle.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          Book MOT Test
                        </Button>
                      )}
                      <Button
                        onClick={() => router.push(`/vehicles/edit/${vehicle.id}`)}
                        variant="secondary"
                        size="sm"
                      >
                        Edit Vehicle
                      </Button>
                      <Button
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        variant="destructive"
                        size="sm"
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Removing...' : 'Remove Vehicle'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        </>
      )}
    </div>
    </MainLayout>
  )
}