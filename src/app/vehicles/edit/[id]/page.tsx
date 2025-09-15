"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Car, Save, Trash2 } from 'lucide-react'
import { updateVehicleSchema } from '@/lib/validations'
import { z } from 'zod'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

type VehicleFormData = z.infer<typeof updateVehicleSchema>

export default function EditVehiclePage({ params }: { params: { id: string } }) {
  // Acesso direto ao params.id é mais seguro neste contexto
  const id = params.id
  const { data: session, status } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState<Partial<VehicleFormData>>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    fuelType: 'PETROL',
    color: '',
    engineSize: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [vehicleRegistration, setVehicleRegistration] = useState('')
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchVehicle()
    }
  }, [status, id])

  const fetchVehicle = async () => {
    try {
      const response = await fetch(`/api/vehicles/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch vehicle')
      }
      const data = await response.json()
      setFormData({
        make: data.make,
        model: data.model,
        year: data.year,
        fuelType: data.fuelType,
        color: data.color || '',
        engineSize: data.engineSize || ''
      })
      setVehicleRegistration(data.registration)
    } catch (error) {
      console.error('Error fetching vehicle:', error)
      setFetchError('Failed to load vehicle details. Please try again.')
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (status === 'unauthenticated') {
    return null
  }

  const handleInputChange = (field: keyof VehicleFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    try {
      updateVehicleSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach(issue => {
          if (issue.path[0]) {
            newErrors[issue.path[0] as string] = issue.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/vehicles')
      } else {
        const error = await response.json()
        if (error.details) {
          const newErrors: Record<string, string> = {}
          error.details.forEach((detail: any) => {
            if (detail.path[0]) {
              newErrors[detail.path[0]] = detail.message
            }
          })
          setErrors(newErrors)
        } else {
          setErrors({ form: error.error || 'Failed to update vehicle' })
        }
      }
    } catch (error) {
      console.error('Error updating vehicle:', error)
      setErrors({ form: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/vehicles')
      } else {
        const error = await response.json()
        setErrors({ form: error.error || 'Failed to delete vehicle' })
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      setErrors({ form: 'An unexpected error occurred' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-6 flex items-center gap-2" 
        onClick={() => router.push('/vehicles')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Vehicles
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Edit Vehicle</CardTitle>
              <CardDescription>
                Update details for {vehicleRegistration}
              </CardDescription>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your vehicle {vehicleRegistration} and all associated records.
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
          </div>
        </CardHeader>
        <CardContent>
          {fetchError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{fetchError}</p>
            </div>
          )}

          {errors.form && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{errors.form}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => handleInputChange('make', e.target.value)}
                  placeholder="e.g. Ford"
                  className={errors.make ? 'border-red-500' : ''}
                />
                {errors.make && <p className="text-red-500 text-sm">{errors.make}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="e.g. Focus"
                  className={errors.model ? 'border-red-500' : ''}
                />
                {errors.model && <p className="text-red-500 text-sm">{errors.model}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                  placeholder="e.g. 2020"
                  className={errors.year ? 'border-red-500' : ''}
                />
                {errors.year && <p className="text-red-500 text-sm">{errors.year}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select
                  value={formData.fuelType}
                  onValueChange={(value: string) => handleInputChange('fuelType', value)}
                >
                  <SelectTrigger className={errors.fuelType ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PETROL">Petrol</SelectItem>
                    <SelectItem value="DIESEL">Diesel</SelectItem>
                    <SelectItem value="ELECTRIC">Electric</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                    <SelectItem value="PLUGIN_HYBRID">Plug-in Hybrid</SelectItem>
                    <SelectItem value="LPG">LPG</SelectItem>
                  </SelectContent>
                </Select>
                {errors.fuelType && <p className="text-red-500 text-sm">{errors.fuelType}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  placeholder="e.g. Blue"
                  className={errors.color ? 'border-red-500' : ''}
                />
                {errors.color && <p className="text-red-500 text-sm">{errors.color}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="engineSize">Engine Size (L)</Label>
                <Input
                  id="engineSize"
                  value={formData.engineSize}
                  onChange={(e) => handleInputChange('engineSize', e.target.value)}
                  placeholder="e.g. 2.0"
                  className={errors.engineSize ? 'border-red-500' : ''}
                />
                {errors.engineSize && <p className="text-red-500 text-sm">{errors.engineSize}</p>}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}