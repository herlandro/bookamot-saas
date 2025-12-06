'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Car, Loader2, CheckCircle, AlertCircle, ArrowRight, Calendar, Gauge } from 'lucide-react'
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
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [motHistory, setMotHistory] = useState<{ lastTestDate: string | null; lastTestResult: string | null; expiryDate: string | null; mileage: number | null; totalTests: number } | null>(null)
  const [lastValidatedReg, setLastValidatedReg] = useState<string>('')
  const [manualFillRequired, setManualFillRequired] = useState(false)
  const [showAllFields, setShowAllFields] = useState(false)

  const formRef = useRef<HTMLFormElement | null>(null)
  const successMessageRef = useRef<HTMLParagraphElement>(null)
  const carIconRef = useRef<HTMLDivElement>(null)
  const carContainerRef = useRef<HTMLDivElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)

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

  const isFormValid = createVehicleSchema.safeParse(formData).success

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || !buttonsRef.current) return
    if (isFormValid) {
      gsap.fromTo(
        buttonsRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      )
    }
  }, [isFormValid])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateString || 'N/A'
    }
  }

  const validateRegistration = async (registration: string) => {
    if (!registration || registration.trim() === '') return

    setValidatingReg(true)
    setLookupError(null)
    setLookupSuccess(false)
    setMotHistory(null)
    setManualFillRequired(false)

    const maxRetries = 3
    let currentRetry = 0
    let success = false

    while (currentRetry < maxRetries && !success) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 4000)
        const response = await fetch(`/api/vehicles/lookup?registration=${encodeURIComponent(registration.trim())}`, { signal: controller.signal })
        clearTimeout(timeout)

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
          if (vehicleData.motHistory) setMotHistory(vehicleData.motHistory)
          setLookupSuccess(true)
          setShowAllFields(true)
          success = true
        } else {
          currentRetry++
          if (currentRetry < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, currentRetry - 1)))
          }
          try {
            const errorBody = await response.json()
            const status = response.status
            let message = 'Lookup failed.'
            if (status === 400 && errorBody?.code === 'INVALID_FORMAT') {
              message = 'Invalid registration format. Please check and try again.'
            } else if (status === 404 || errorBody?.code === 'NOT_FOUND') {
              message = 'Vehicle not found. Please fill in the fields manually.'
            } else if (status === 429 || errorBody?.code === 'RATE_LIMIT') {
              message = 'Rate limit exceeded. Please wait and try again.'
            } else if (status === 504 || errorBody?.code === 'TIMEOUT') {
              message = 'DVSA request timed out. You can try again.'
            } else if (status === 503 || errorBody?.code === 'DVSA_UNAVAILABLE') {
              message = 'DVSA service unavailable. Please try again later or fill in manually.'
            } else if (status === 403 || errorBody?.code === 'AUTH_ERROR') {
              message = 'DVSA authentication error. Please contact support.'
            } else if (status === 500 || errorBody?.code === 'MISCONFIGURED_ENDPOINT') {
              message = 'Configuration error: DVSA API base URL is misconfigured.'
            } else if (errorBody?.error_message || errorBody?.error) {
              message = errorBody?.error_message || errorBody?.error
            }
            setLookupError(message)
            setShowAllFields(true)
            setManualFillRequired(true)
          } catch {}
        }
      } catch {
        currentRetry++
        if (currentRetry < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, currentRetry - 1)))
        }
      }
    }

    if (!success && !lookupError) {
      setLookupError('Could not retrieve vehicle information after multiple attempts. Please check the registration number or fill in the fields manually.')
      setShowAllFields(true)
      setManualFillRequired(true)
    }

    setValidatingReg(false)
  }

  const handleInputChange = (field: keyof VehicleFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    if (field === 'registration') {
      if (lookupError) setLookupError(null)
      if (lookupSuccess) setLookupSuccess(false)
      if (motHistory) setMotHistory(null)
      setShowAllFields(false)
      setManualFillRequired(false)
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
                onBlur={() => {
                  if (formData.registration && formData.registration !== lastValidatedReg) {
                    validateRegistration(formData.registration)
                    setLastValidatedReg(formData.registration)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && formData.registration && formData.registration !== lastValidatedReg) {
                    e.preventDefault()
                    validateRegistration(formData.registration)
                    setLastValidatedReg(formData.registration)
                    setTimeout(() => {
                      document.getElementById('make')?.focus()
                    }, 100)
                  }
                }}
                className={`text-lg h-12 pr-10 ${errors.registration ? 'border-red-500' : ''}`}
                disabled={loading}
              />
              {validatingReg ? (
                <Loader2 className="absolute right-3 top-3 h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Validate registration"
                  title="Validate registration"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  disabled={!formData.registration}
                  onClick={() => {
                    if (formData.registration && formData.registration !== lastValidatedReg) {
                      validateRegistration(formData.registration)
                      setLastValidatedReg(formData.registration)
                      setTimeout(() => {
                        document.getElementById('make')?.focus()
                      }, 100)
                    } else if (formData.registration) {
                      validateRegistration(formData.registration)
                    }
                  }}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
            {errors.registration && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.registration}
              </p>
            )}
            {lookupError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between gap-2">
                  <span>{lookupError} All form fields will be shown for manual entry.</span>
                  <Button type="button" size="sm" variant="outline" onClick={() => {
                    if (!validatingReg && formData.registration) {
                      validateRegistration(formData.registration)
                      setLastValidatedReg(formData.registration)
                    }
                  }}>Retry</Button>
                </AlertDescription>
              </Alert>
            )}
            {lookupSuccess && (
              <Alert className="mt-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Vehicle data retrieved from DVSA. Fields have been autofilled.
                </AlertDescription>
              </Alert>
            )}
            {motHistory && (
              <div className="mt-3 p-3 rounded-lg border border-border bg-muted/30">
                <p className="text-sm font-medium mb-2 text-foreground">MOT History Summary</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Last Test:</span>
                    <span className="font-medium">{formatDate(motHistory.lastTestDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Result:</span>
                    {motHistory.lastTestResult === 'PASSED' ? (
                      <Badge className="bg-green-500 text-white text-xs">Passed</Badge>
                    ) : motHistory.lastTestResult === 'FAILED' ? (
                      <Badge className="bg-red-500 text-white text-xs">Failed</Badge>
                    ) : (
                      <Badge className="bg-gray-500 text-white text-xs">Unknown</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="font-medium">{formatDate(motHistory.expiryDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Mileage:</span>
                    <span className="font-medium">{motHistory.mileage ? motHistory.mileage.toLocaleString() : 'N/A'} mi</span>
                  </div>
                </div>
                {motHistory.totalTests > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">Total MOT tests on record: {motHistory.totalTests}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Make, Model, Year, Fuel Type */}
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 form-field ${showAllFields || lookupSuccess ? '' : 'hidden'}`}>
          {/* Make */}
          <div className="space-y-2">
            <Label htmlFor="make" className="flex items-center gap-2">Make * {manualFillRequired && (<Badge variant="destructive">Required</Badge>)}</Label>
            <Input
              id="make"
              placeholder="e.g., Ford"
              value={formData.make || ''}
              onChange={(e) => handleInputChange('make', e.target.value)}
              className={errors.make ? 'border-red-500' : ''}
              disabled={loading}
              onFocus={() => {
                if (lookupError && formData.registration && formData.registration !== lastValidatedReg && !validatingReg) {
                  validateRegistration(formData.registration)
                  setLastValidatedReg(formData.registration)
                }
              }}
            />
            {errors.make && (
              <p className="text-sm text-red-500">{errors.make}</p>
            )}
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model" className="flex items-center gap-2">Model * {manualFillRequired && (<Badge variant="destructive">Required</Badge>)}</Label>
            <Input
              id="model"
              placeholder="e.g., Focus"
              value={formData.model || ''}
              onChange={(e) => handleInputChange('model', e.target.value)}
              className={errors.model ? 'border-red-500' : ''}
              disabled={loading}
              onFocus={() => {
                if (lookupError && formData.registration && formData.registration !== lastValidatedReg && !validatingReg) {
                  validateRegistration(formData.registration)
                  setLastValidatedReg(formData.registration)
                }
              }}
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
              <SelectTrigger className={errors.year ? 'border-red-500' : ''} onClick={() => {
                if (lookupError && formData.registration && formData.registration !== lastValidatedReg && !validatingReg) {
                  validateRegistration(formData.registration)
                  setLastValidatedReg(formData.registration)
                }
              }}>
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
              <SelectTrigger onClick={() => {
                if (lookupError && formData.registration && formData.registration !== lastValidatedReg && !validatingReg) {
                  validateRegistration(formData.registration)
                  setLastValidatedReg(formData.registration)
                }
              }}>
                <SelectValue />
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
          </div>
        </div>

        {/* Action Buttons */}
        <div ref={buttonsRef} className={`flex flex-col sm:flex-row gap-4 items-center justify-between form-field ${(showAllFields || lookupSuccess) && isFormValid ? '' : 'hidden'}`}>
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
