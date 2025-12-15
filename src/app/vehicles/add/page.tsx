"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, ArrowLeft, ArrowRight, Car, Loader2, CheckCircle, Calendar, Gauge } from 'lucide-react'
import { createVehicleSchema } from '@/lib/validations'
import { z } from 'zod'
import { MainLayout } from '@/components/layout/main-layout'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Badge } from '@/components/ui/badge'

type VehicleFormData = z.infer<typeof createVehicleSchema>

interface MotHistoryInfo {
  lastTestDate: string | null
  lastTestResult: string | null
  expiryDate: string | null
  mileage: number | null
  totalTests: number
}

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
  const [validatingReg, setValidatingReg] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [lookupSuccess, setLookupSuccess] = useState(false)
  const [motHistory, setMotHistory] = useState<MotHistoryInfo | null>(null)
  const [lastValidatedReg, setLastValidatedReg] = useState<string>('')
  const [showAllFields, setShowAllFields] = useState(false)
  const [manualFillRequired, setManualFillRequired] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
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

    // Clear lookup states when user edits the registration field
    if (field === 'registration') {
      if (lookupError) setLookupError(null)
      if (lookupSuccess) setLookupSuccess(false)
      if (motHistory) setMotHistory(null)
      setShowAllFields(false)
      setManualFillRequired(false)
    }
  }

  // Helper function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // Function to validate the vehicle registration number
  const validateRegistration = async (registration: string) => {
    if (!registration || registration.trim() === '') return

    setValidatingReg(true)
    setLookupError(null)
    setLookupSuccess(false)
    setMotHistory(null)
    setManualFillRequired(false)

    // Maximum number of retries
    const maxRetries = 3
    let currentRetry = 0
    let success = false

    while (currentRetry < maxRetries && !success) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 4000)
        const response = await fetch(`/api/vehicles/lookup?registration=${encodeURIComponent(registration.trim())}`, {
          signal: controller.signal
        })
        clearTimeout(timeout)

        if (response.ok) {
          const vehicleData = await response.json()

          // Populate form fields with the data returned from the API
          setFormData(prev => ({
            ...prev,
            make: vehicleData.make || prev.make,
            model: vehicleData.model || prev.model,
            year: vehicleData.year || prev.year,
            fuelType: vehicleData.fuelType || prev.fuelType,
            color: vehicleData.color || prev.color,
            engineSize: vehicleData.engineSize || prev.engineSize
          }))

          // Store MOT history if available
          if (vehicleData.motHistory) {
            setMotHistory(vehicleData.motHistory)
          }

          setLookupSuccess(true)
          setShowAllFields(true)
          success = true
        } else {
          // If response is not successful, increment retry count
          currentRetry++

          if (currentRetry < maxRetries) {
            // Wait a bit before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, currentRetry - 1)))
          }

          try {
            const errorBody = await response.json()
            const status = response.status
            let message = 'Não foi possível validar automaticamente os dados.'
            if (status === 400 && errorBody?.code === 'INVALID_FORMAT') {
              message = 'Formato de matrícula inválido. Verifique e tente novamente.'
            } else if (status === 404 || errorBody?.code === 'NOT_FOUND') {
              message = 'Veículo não encontrado. Preencha manualmente os campos.'
            } else if (status === 429 || errorBody?.code === 'RATE_LIMIT') {
              message = 'Limite de requisições excedido. Aguarde e tente novamente.'
            } else if (status === 504 || errorBody?.code === 'TIMEOUT') {
              message = 'Tempo de resposta do DVSA esgotado. Tente novamente.'
            } else if (status === 503 || errorBody?.code === 'DVSA_UNAVAILABLE') {
              message = 'Serviço DVSA indisponível. Preencha manualmente os campos.'
            } else if (status === 403 || errorBody?.code === 'AUTH_ERROR') {
              message = 'Falha de autenticação DVSA. Preencha manualmente os campos.'
            } else if (status === 500 || errorBody?.code === 'MISCONFIGURED_ENDPOINT') {
              message = 'Erro de configuração: URL base do DVSA incorreta.'
            } else if (errorBody?.error_message || errorBody?.error) {
              message = errorBody?.error_message || errorBody?.error
            }
            setLookupError(message)
            setShowAllFields(true)
            setManualFillRequired(true)
          } catch {
            // If body is not JSON
          }
        }
      } catch (error) {
        
        currentRetry++

        if (currentRetry < maxRetries) {
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, currentRetry - 1)))
        }
      }
    }

    if (!success) {
      if (!lookupError) {
        setLookupError('Não foi possível validar automaticamente após várias tentativas. Preencha os campos manualmente.')
      }
      setShowAllFields(true)
      setManualFillRequired(true)
    }

    setValidatingReg(false)
  }
  
  // Armazenar o último valor de registro validado

  // Manipulador para quando o campo de registro perde o foco
  const handleRegistrationBlur = () => {
    if (formData.registration && formData.registration !== lastValidatedReg) {
      validateRegistration(formData.registration)
      setLastValidatedReg(formData.registration)
    }
  }
  
  // Handler for when user clicks on another field
  const handleRegistrationValidation = () => {
    // Only validate if the specific error is present and registration is different from last validated
    if (lookupError === 'Could not retrieve vehicle information after multiple attempts. Please check the registration number or fill in the fields manually.'
        && formData.registration
        && formData.registration !== lastValidatedReg
        && !validatingReg) {
      validateRegistration(formData.registration)
      setLastValidatedReg(formData.registration)
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
        // Check if there's a booking context stored (user came from search results)
        const bookingContext = sessionStorage.getItem('bookingSearchContext')

        if (bookingContext) {
          try {
            const context = JSON.parse(bookingContext)
            // Redirect to booking page with the stored garage ID
            const bookingParams = new URLSearchParams()
            bookingParams.append('garageId', context.selectedGarageId)
            if (context.date) bookingParams.append('date', context.date)
            if (context.selectedTimeSlot) bookingParams.append('time', context.selectedTimeSlot)

            // Clear the booking context
            sessionStorage.removeItem('bookingSearchContext')

            router.push(`/booking/${context.selectedGarageId}?${bookingParams.toString()}`)
          } catch (error) {
            
            router.push('/dashboard')
          }
        } else {
          // No booking context, redirect to dashboard
          router.push('/dashboard')
        }
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
      
      alert('Failed to add vehicle. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i)

  // Check if user is in booking flow
  const getBookingContext = () => {
    if (typeof window === 'undefined') return null
    const context = sessionStorage.getItem('bookingSearchContext')
    return context ? JSON.parse(context) : null
  }

  const bookingContext = getBookingContext()

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex justify-start mb-6">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Booking Flow Info */}
          {bookingContext && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Booking in progress:</strong> After adding your vehicle, you'll be redirected to complete your MOT booking.
              </p>
            </div>
          )}

        <Card>
          <CardHeader>
          <CardTitle>Add Vehicle</CardTitle>
          <CardDescription>
            Enter the registration to automatically fetch vehicle data. Fields with * are required.
          </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Registration */}
              <div className="space-y-2">
                <Label htmlFor="registration">Registration *</Label>
                <div className="relative">
                  <Input
                    id="registration"
                    placeholder="e.g., AB12 CDE"
                    value={formData.registration || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      handleInputChange('registration', e.target.value.toUpperCase())
                    }
                    onBlur={handleRegistrationBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && formData.registration && formData.registration !== lastValidatedReg) {
                        e.preventDefault()
                        validateRegistration(formData.registration)
                        setLastValidatedReg(formData.registration)
                        // Focus the next field after validation
                        setTimeout(() => {
                          document.getElementById('make')?.focus()
                        }, 100)
                      }
                    }}
                    className={`${errors.registration ? 'border-red-500' : ''} ${validatingReg ? 'pr-10' : ''}`}
                  />
                  {validatingReg ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
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
                  <p className="text-sm text-red-500">{errors.registration}</p>
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
                      }}>
                        Retry
                      </Button>
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
                      <p className="text-xs text-muted-foreground mt-2">
                        Total MOT tests on record: {motHistory.totalTests}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Make and Model */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${showAllFields || lookupSuccess ? '' : 'hidden'}`}>
                <div className="space-y-2">
                  <Label htmlFor="make" className="flex items-center gap-2">Make * {manualFillRequired && (<Badge variant="destructive">Required</Badge>)}</Label>
                  <Input
                    id="make"
                    placeholder="e.g., Ford, BMW, Toyota"
                    value={formData.make || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      handleInputChange('make', e.target.value)
                    }
                    onFocus={() => {
                      if (lookupError && formData.registration && formData.registration !== lastValidatedReg && !validatingReg) {
                        validateRegistration(formData.registration);
                        setLastValidatedReg(formData.registration);
                      }
                    }}
                    className={errors.make ? 'border-red-500' : ''}
                  />
                  {errors.make && (
                    <p className="text-sm text-red-500">{errors.make}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="model" className="flex items-center gap-2">Model * {manualFillRequired && (<Badge variant="destructive">Required</Badge>)}</Label>
                  <Input
                    id="model"
                    placeholder="e.g., Focus, 3 Series, Corolla"
                    value={formData.model || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      handleInputChange('model', e.target.value)
                    }
                    onFocus={() => {
                      if (lookupError && formData.registration && formData.registration !== lastValidatedReg && !validatingReg) {
                        validateRegistration(formData.registration);
                        setLastValidatedReg(formData.registration);
                      }
                    }}
                    className={errors.model ? 'border-red-500' : ''}
                  />
                  {errors.model && (
                    <p className="text-sm text-red-500">{errors.model}</p>
                  )}
                </div>
              </div>

              {/* Year and Fuel Type */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${showAllFields || lookupSuccess ? '' : 'hidden'}`}>
                <div className="space-y-2">
                <Label htmlFor="year" className="flex items-center gap-2">Year * {manualFillRequired && (<Badge variant="destructive">Required</Badge>)}</Label>
                <div>
                  <div>
                    <Select 
                      value={formData.year?.toString() || ''} 
                      onValueChange={(value: string) => handleInputChange('year', parseInt(value))}
                    >
                      <SelectTrigger className={errors.year ? 'border-red-500' : ''} onClick={() => {
                        if (lookupError && formData.registration && formData.registration !== lastValidatedReg && !validatingReg) {
                          validateRegistration(formData.registration);
                          setLastValidatedReg(formData.registration);
                        }
                      }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {errors.year && (
                  <p className="text-sm text-red-500">{errors.year}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fuelType" className="flex items-center gap-2">Fuel Type * {manualFillRequired && (<Badge variant="destructive">Required</Badge>)}</Label>
                <div>
                  <div>
                    <Select 
                      value={formData.fuelType || ''} 
                      onValueChange={(value: string) => handleInputChange('fuelType', value)}
                    >
                      <SelectTrigger className={errors.fuelType ? 'border-red-500' : ''} onClick={() => {
                        if (lookupError && formData.registration && formData.registration !== lastValidatedReg && !validatingReg) {
                          validateRegistration(formData.registration);
                          setLastValidatedReg(formData.registration);
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
                {errors.fuelType && (
                  <p className="text-sm text-red-500">{errors.fuelType}</p>
                )}
              </div>
              </div>

              {/* Color and Engine Size */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${showAllFields || lookupSuccess ? '' : 'hidden'}`}>
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
                  <Label htmlFor="engineSize">Engine</Label>
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
              <div className={`flex justify-between gap-2 pt-4 ${showAllFields || lookupSuccess ? '' : 'hidden'}`}>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Adding vehicle...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </MainLayout>
  )
}
