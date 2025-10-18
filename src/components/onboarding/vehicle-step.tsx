'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Car, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { createVehicleSchema } from '@/lib/validations'
import { z } from 'zod'

interface VehicleStepProps {
  onNext: (vehicleData: any) => void
  onBack: () => void
}

type VehicleFormData = z.infer<typeof createVehicleSchema>

/**
 * Vehicle Step Component
 * Second step in onboarding - collects vehicle information
 */
export function VehicleStep({ onNext, onBack }: VehicleStepProps) {
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
  const [validatingReg, setValidatingReg] = useState(false)
  const [lookupSuccess, setLookupSuccess] = useState(false)

  // Auto-lookup vehicle details from registration
  const validateRegistration = async (registration: string) => {
    if (!registration || registration.trim() === '') return

    setValidatingReg(true)
    setLookupSuccess(false)

    try {
      const response = await fetch(`/api/vehicles/lookup?registration=${encodeURIComponent(registration)}`)

      if (response.ok) {
        const vehicleData = await response.json()

        setFormData(prev => ({
          ...prev,
          make: vehicleData.make || prev.make,
          model: vehicleData.model || prev.model,
          year: vehicleData.year || prev.year,
          fuelType: vehicleData.fuelType || prev.fuelType,
          color: vehicleData.color || prev.color,
          engineSize: vehicleData.engineSize || prev.engineSize
        }))

        setLookupSuccess(true)
      }
    } catch (error) {
      console.error('Error looking up vehicle:', error)
    } finally {
      setValidatingReg(false)
    }
  }

  const handleInputChange = (field: keyof VehicleFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
        const data = await response.json()
        onNext(data.vehicle)
      } else {
        // Try to parse error response
        let error: any = {}
        try {
          error = await response.json()
        } catch (e) {
          console.error('Failed to parse error response:', e)
          error = { error: 'An unexpected error occurred' }
        }

        console.error('API Error Response:', error)

        // Handle invalid session error
        if (response.status === 401) {
          alert(error.error || 'Your session has expired. Please log out and log in again.')
          // Redirect to sign in page
          window.location.href = '/api/auth/signout?callbackUrl=/signin'
          return
        }

        // Handle duplicate registration error (same user, same vehicle)
        if (response.status === 409) {
          setErrors({
            registration: error.error || 'You have already registered this vehicle. Please use a different registration number or manage your existing vehicles in the dashboard.'
          })
        } else if (error.details && Array.isArray(error.details)) {
          // Handle Zod validation errors
          const newErrors: Record<string, string> = {}
          error.details.forEach((detail: any) => {
            if (detail.path && detail.path[0]) {
              newErrors[detail.path[0]] = detail.message
            }
          })
          setErrors(newErrors)
        } else {
          // Show the actual error message from the server
          const errorMessage = error.error || 'Failed to add vehicle. Please try again.'
          console.error('Server error:', errorMessage)
          setErrors({
            registration: errorMessage
          })
        }
      }
    } catch (error) {
      console.error('Error adding vehicle:', error)
      setErrors({
        registration: 'Failed to add vehicle. Please check your connection and try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i)

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Car className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Tell us about your vehicle
        </h2>
        <p className="text-muted-foreground">
          Enter your registration number and we'll look up the details for you
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Try: <span className="font-mono font-semibold">AB12CDE</span>, <span className="font-mono font-semibold">WJ11USE</span>, or <span className="font-mono font-semibold">XY99ZZZ</span>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Registration Number */}
        <div className="space-y-2">
          <Label htmlFor="registration" className="text-base font-medium">
            Registration Number *
          </Label>
          <div className="relative">
            <Input
              id="registration"
              placeholder="e.g., AB12 CDE"
              value={formData.registration || ''}
              onChange={(e) => handleInputChange('registration', e.target.value.toUpperCase())}
              onBlur={() => validateRegistration(formData.registration || '')}
              className={`text-lg h-12 pr-10 ${errors.registration ? 'border-red-500' : ''} ${lookupSuccess ? 'border-green-500' : ''}`}
              disabled={loading}
            />
            {validatingReg && (
              <Loader2 className="absolute right-3 top-3 h-6 w-6 animate-spin text-muted-foreground" />
            )}
            {lookupSuccess && !validatingReg && (
              <CheckCircle className="absolute right-3 top-3 h-6 w-6 text-green-500" />
            )}
          </div>
          {errors.registration && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.registration}
            </p>
          )}
          {lookupSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Vehicle details found and filled in!
            </p>
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
              onChange={(e) => handleInputChange('make', e.target.value)}
              className={errors.make ? 'border-red-500' : ''}
              disabled={loading}
            />
            {errors.make && (
              <p className="text-sm text-red-500">{errors.make}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              placeholder="e.g., Focus, 3 Series"
              value={formData.model || ''}
              onChange={(e) => handleInputChange('model', e.target.value)}
              className={errors.model ? 'border-red-500' : ''}
              disabled={loading}
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
              value={formData.year?.toString()}
              onValueChange={(value) => handleInputChange('year', parseInt(value))}
              disabled={loading}
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
              value={formData.fuelType}
              onValueChange={(value) => handleInputChange('fuelType', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PETROL">Petrol</SelectItem>
                <SelectItem value="DIESEL">Diesel</SelectItem>
                <SelectItem value="ELECTRIC">Electric</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse md:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="w-full md:w-auto"
            disabled={loading}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="w-full md:flex-1 h-12 text-base font-semibold group"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Adding Vehicle...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

