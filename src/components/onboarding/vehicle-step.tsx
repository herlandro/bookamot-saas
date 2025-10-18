'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Car, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { createVehicleSchema } from '@/lib/validations'
import { z } from 'zod'
import gsap from 'gsap'

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

  const formRef = useRef<HTMLDivElement>(null)
  const successMessageRef = useRef<HTMLParagraphElement>(null)
  const carIconRef = useRef<HTMLDivElement>(null)
  const carContainerRef = useRef<HTMLDivElement>(null)

  // Entrance animation
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || !formRef.current) {
      return
    }

    const ctx = gsap.context(() => {
      gsap.from('.form-field', {
        y: 20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.out',
      })
    }, formRef)

    return () => ctx.revert()
  }, [])

  // Car animation - drives in from left and bounces
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || !carContainerRef.current || !carIconRef.current) {
      return
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      // Car drives in from left
      tl.from(carContainerRef.current, {
        x: -100,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      })
      // Bounce effect
      .to(carContainerRef.current, {
        y: -8,
        duration: 0.3,
        ease: 'power1.out',
      })
      .to(carContainerRef.current, {
        y: 0,
        duration: 0.3,
        ease: 'bounce.out',
      })

      // Continuous subtle bounce
      gsap.to(carIconRef.current, {
        y: -3,
        duration: 1.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
    }, carContainerRef)

    return () => ctx.revert()
  }, [])

  // Success animation when lookup succeeds
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || !successMessageRef.current || !lookupSuccess) {
      return
    }

    gsap.fromTo(
      successMessageRef.current,
      {
        scale: 0.8,
        opacity: 0,
      },
      {
        scale: 1,
        opacity: 1,
        duration: 0.4,
        ease: 'back.out(1.7)',
      }
    )
  }, [lookupSuccess])

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
        <div ref={carContainerRef} className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <div ref={carIconRef}>
            <Car className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Tell us about your vehicle
        </h2>
      </div>

      {/* Form */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Registration, Make, Model */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 form-field">
          {/* Registration Number */}
          <div className="space-y-2 md:col-span-3">
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
              <p ref={successMessageRef} className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Vehicle details found and filled in!
              </p>
            )}
          </div>
        </div>

        {/* Row 2: Make, Model, Year, Fuel Type */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 form-field">
          {/* Make */}
          <div className="space-y-2">
            <Label htmlFor="make">Make *</Label>
            <Input
              id="make"
              placeholder="e.g., Ford"
              value={formData.make || ''}
              onChange={(e) => handleInputChange('make', e.target.value)}
              className={errors.make ? 'border-red-500' : ''}
              disabled={loading}
            />
            {errors.make && (
              <p className="text-sm text-red-500">{errors.make}</p>
            )}
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              placeholder="e.g., Focus"
              value={formData.model || ''}
              onChange={(e) => handleInputChange('model', e.target.value)}
              className={errors.model ? 'border-red-500' : ''}
              disabled={loading}
            />
            {errors.model && (
              <p className="text-sm text-red-500">{errors.model}</p>
            )}
          </div>

          {/* Year */}
          <div className="space-y-2">
            <Label htmlFor="year">Year *</Label>
            <Select
              value={formData.year?.toString()}
              onValueChange={(value) => handleInputChange('year', parseInt(value))}
              disabled={loading}
            >
              <SelectTrigger className={errors.year ? 'border-red-500' : ''}>
                <SelectValue placeholder="Year" />
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

          {/* Fuel Type */}
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
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between form-field">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="w-full sm:w-auto order-2 sm:order-1"
            disabled={loading}
          >
            Back
          </Button>

          <Button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto group order-1 sm:order-2"
            size="lg"
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

