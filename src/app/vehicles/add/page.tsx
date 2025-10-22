"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, ArrowLeft, Car, Plus, Loader2 } from 'lucide-react'
import { createVehicleSchema } from '@/lib/validations'
import { z } from 'zod'
import { MainLayout } from '@/components/layout/main-layout'
import { Alert, AlertDescription } from '../../../components/ui/alert'

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
  const [validatingReg, setValidatingReg] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

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
    
    // Limpar mensagem de erro de lookup quando o usuário edita o campo de registro
    if (field === 'registration' && lookupError) {
      setLookupError(null)
    }
  }
  
  // Função para validar o número de registro do veículo
  const validateRegistration = async (registration: string) => {
    if (!registration || registration.trim() === '') return
    
    setValidatingReg(true)
    setLookupError(null)
    
    // Número máximo de tentativas
    const maxRetries = 3
    let currentRetry = 0
    let success = false
    
    while (currentRetry < maxRetries && !success) {
      try {
        const response = await fetch(`/api/vehicles/lookup?registration=${encodeURIComponent(registration)}`)
        
        if (response.ok) {
          const vehicleData = await response.json()
          
          // Preencher os campos do formulário com os dados retornados da API
          setFormData(prev => ({
            ...prev,
            make: vehicleData.make || prev.make,
            model: vehicleData.model || prev.model,
            year: vehicleData.year || prev.year,
            fuelType: vehicleData.fuelType || prev.fuelType,
            color: vehicleData.color || prev.color,
            engineSize: vehicleData.engineSize || prev.engineSize
          }))
          
          success = true
        } else {
          // Se a resposta não for bem-sucedida, incrementar a contagem de tentativas
          currentRetry++
          
          if (currentRetry < maxRetries) {
            // Esperar um pouco antes de tentar novamente (backoff exponencial)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, currentRetry - 1)))
          }
        }
      } catch (error) {
        console.error(`Erro ao validar registro (tentativa ${currentRetry + 1}/${maxRetries}):`, error)
        currentRetry++
        
        if (currentRetry < maxRetries) {
          // Esperar um pouco antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, currentRetry - 1)))
        }
      }
    }
    
    if (!success) {
      setLookupError('Não foi possível obter informações do veículo após várias tentativas. Verifique o número de registro ou preencha os campos manualmente.')
    }
    
    setValidatingReg(false)
  }
  
  // Armazenar o último valor de registro validado
  const [lastValidatedReg, setLastValidatedReg] = useState<string>('')
  
  // Manipulador para quando o campo de registro perde o foco
  const handleRegistrationBlur = () => {
    if (formData.registration && formData.registration !== lastValidatedReg) {
      validateRegistration(formData.registration)
      setLastValidatedReg(formData.registration)
    }
  }
  
  // Manipulador para quando o usuário clica em outro campo
  const handleRegistrationValidation = () => {
    // Só valida se o erro específico estiver presente e o registro for diferente do último validado
    if (lookupError === 'Não foi possível obter informações do veículo após várias tentativas. Verifique o número de registro ou preencha os campos manualmente.' 
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
            console.error('Error parsing booking context:', error)
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
      console.error('Error adding vehicle:', error)
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
                        // Focar no próximo campo após a validação
                        setTimeout(() => {
                          document.getElementById('make')?.focus()
                        }, 100)
                      }
                    }}
                    className={`${errors.registration ? 'border-red-500' : ''} ${validatingReg ? 'pr-10' : ''}`}
                  />
                  {validatingReg && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                {errors.registration && (
                  <p className="text-sm text-red-500">{errors.registration}</p>
                )}
                {lookupError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{lookupError}</AlertDescription>
                  </Alert>
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
                  <Label htmlFor="model">Model *</Label>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
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
                <Label htmlFor="fuelType">Fuel Type *</Label>
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
              <div className="flex justify-between gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
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
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </MainLayout>
  )
}