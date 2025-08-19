"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Car, Plus } from 'lucide-react'
import { createVehicleSchema } from '@/lib/validations'
import { z } from 'zod'

type VehicleFormData = z.infer<typeof createVehicleSchema>

export default function AddVehiclePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState<Partial<VehicleFormData>>({
    registration: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    fuelType: 'PETROL',
    color: '',
    engineSize: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
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
      createVehicleSchema.parse(formData)
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
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/dashboard')
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
          alert(error.error || 'Failed to add vehicle')
        }
      }
    } catch (error) {
      console.error('Error adding vehicle:', error)
      alert('Failed to add vehicle. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Car className="h-6 w-6" />
              Add Vehicle
            </h1>
            <p className="text-muted-foreground">
              Add your vehicle details to book MOT tests
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>
              Enter your vehicle details. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Registration */}
              <div className="space-y-2">
                <Label htmlFor="registration">Registration Number *</Label>
                <Input
                  id="registration"
                  placeholder="e.g., AB12 CDE"
                  value={formData.registration || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleInputChange('registration', e.target.value.toUpperCase())
                  }
                  className={errors.registration ? 'border-red-500' : ''}
                />
                {errors.registration && (
                  <p className="text-sm text-red-500">{errors.registration}</p>
                )}
              </div>

              {/* Make and Model */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    placeholder="e.g., Ford, BMW, Toyota"
                    value={formData.make || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      handleInputChange('make', e.target.value)
                    }
                    className={errors.make ? 'border-red-500' : ''}
                  />
                  {errors.make && (
                    <p className="text-sm text-red-500">{errors.make}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    placeholder="e.g., Focus, 3 Series, Corolla"
                    value={formData.model || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      handleInputChange('model', e.target.value)
                    }
                    className={errors.model ? 'border-red-500' : ''}
                  />
                  {errors.model && (
                    <p className="text-sm text-red-500">{errors.model}</p>
                  )}
                </div>
              </div>

              {/* Year and Fuel Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Select 
                    value={formData.year?.toString() || ''} 
                    onValueChange={(value) => handleInputChange('year', parseInt(value))}
                  >
                    <SelectTrigger className={errors.year ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.year && (
                    <p className="text-sm text-red-500">{errors.year}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fuelType">Fuel Type *</Label>
                  <Select 
                    value={formData.fuelType || ''} 
                    onValueChange={(value) => handleInputChange('fuelType', value)}
                  >
                    <SelectTrigger className={errors.fuelType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PETROL">Petrol</SelectItem>
                      <SelectItem value="DIESEL">Diesel</SelectItem>
                      <SelectItem value="ELECTRIC">Electric</SelectItem>
                      <SelectItem value="HYBRID">Hybrid</SelectItem>
                      <SelectItem value="LPG">LPG</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.fuelType && (
                    <p className="text-sm text-red-500">{errors.fuelType}</p>
                  )}
                </div>
              </div>

              {/* Color and Engine Size */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    placeholder="e.g., Red, Blue, Silver"
                    value={formData.color || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      handleInputChange('color', e.target.value)
                    }
                    className={errors.color ? 'border-red-500' : ''}
                  />
                  {errors.color && (
                    <p className="text-sm text-red-500">{errors.color}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="engineSize">Engine Size</Label>
                  <Input
                    id="engineSize"
                    placeholder="e.g., 1.6L, 2.0L, 3.0L"
                    value={formData.engineSize || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      handleInputChange('engineSize', e.target.value)
                    }
                    className={errors.engineSize ? 'border-red-500' : ''}
                  />
                  {errors.engineSize && (
                    <p className="text-sm text-red-500">{errors.engineSize}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding Vehicle...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Vehicle
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}