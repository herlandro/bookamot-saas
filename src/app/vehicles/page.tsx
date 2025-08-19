"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Car, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

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
}

export default function VehiclesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
      return
    }

    if (user) {
      fetchVehicles()
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

  const getMotStatus = (vehicle: Vehicle) => {
    if (!vehicle.motExpiryDate) {
      return { status: 'unknown', label: 'Unknown', color: 'bg-slate-500' }
    }

    const expiryDate = new Date(vehicle.motExpiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expired', color: 'bg-red-500' }
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', label: `${daysUntilExpiry} days left`, color: 'bg-yellow-500' }
    } else {
      return { status: 'valid', label: 'Valid', color: 'bg-green-500' }
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading vehicles...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Vehicles</h1>
          <p className="text-gray-600 mt-2">Manage your vehicles and MOT history</p>
        </div>
        <Button onClick={() => router.push('/vehicles/add')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="text-center py-12">
          <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No vehicles found</h3>
          <p className="text-gray-600 mb-6">Add your first vehicle to start booking MOT tests</p>
          <Button onClick={() => router.push('/vehicles/add')} className="flex items-center gap-2 mx-auto">
            <Plus className="h-4 w-4" />
            Add Your First Vehicle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => {
            const motStatus = getMotStatus(vehicle)
            return (
              <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{vehicle.registration}</CardTitle>
                      <CardDescription>
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </CardDescription>
                    </div>
                    <Badge className={`${motStatus.color} text-white flex items-center gap-1`}>
                      {getMotIcon(motStatus.status)}
                      {motStatus.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Color:</span>
                      <span className="font-medium">{vehicle.color}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel Type:</span>
                      <span className="font-medium">{vehicle.fuelType}</span>
                    </div>
                    {vehicle.engineSize && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Engine Size:</span>
                        <span className="font-medium">{vehicle.engineSize}L</span>
                      </div>
                    )}
                    {vehicle.motExpiryDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">MOT Expires:</span>
                        <span className="font-medium">{formatDate(new Date(vehicle.motExpiryDate))}</span>
                      </div>
                    )}
                    {vehicle.lastMotDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last MOT:</span>
                        <span className="font-medium">{formatDate(new Date(vehicle.lastMotDate))}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      onClick={() => router.push(`/search?vehicle=${vehicle.id}`)}
                      className="w-full"
                      variant="outline"
                    >
                      Book MOT Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}