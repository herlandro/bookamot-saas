"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Mail, Star, Clock, Loader2, X, Calendar } from 'lucide-react'
import { formatCurrency, calculateDistance } from '@/lib/utils'
import { validateUKRegistration } from '@/lib/validations'
import { MainLayout } from '@/components/layout/main-layout'

interface Garage {
  id: string
  name: string
  address: string
  city: string
  postcode: string
  phone: string
  email: string
  motPrice: number
  latitude?: number
  longitude?: number
  rating?: number
  reviewCount?: number
  distance?: number
  availableSlots?: string[]
}

function SearchPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  // Calculate default date: today if hour <= 17, tomorrow if hour > 17
  const getDefaultDate = (): string => {
    const now = new Date()
    const currentHour = now.getHours()
    
    if (currentHour > 17) {
      // If after 17:00, use tomorrow
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    } else {
      // If 17:00 or earlier, use today
      return now.toISOString().split('T')[0]
    }
  }

  const [vehicleRegistration, setVehicleRegistration] = useState('')
  const [searchLocation, setSearchLocation] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState<string>(getDefaultDate())
  // Calculate default time based on selected date
  const getDefaultTime = (date: string): string => {
    const selectedDateObj = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    selectedDateObj.setHours(0, 0, 0, 0)
    
    // If selected date is greater than today, return empty string (no filter)
    if (selectedDateObj > today) {
      return ''
    }
    
    // If selected date is today, calculate next full hour
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    
    // If current time is past the hour (e.g., 9:05), use next hour (10:00)
    // If current time is exactly on the hour (e.g., 9:00), use current hour
    const nextHour = currentMinute > 0 ? currentHour + 1 : currentHour
    
    // Format as HH:00
    return `${nextHour.toString().padStart(2, '0')}:00`
  }

  const [selectedTime, setSelectedTime] = useState<string>(getDefaultTime(getDefaultDate()))
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<{[garageId: string]: string}>({})
  const [garages, setGarages] = useState<Garage[]>([])
  const [loading, setLoading] = useState(false)
  const [validatingRegistration, setValidatingRegistration] = useState(false)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [registrationValid, setRegistrationValid] = useState(false)
  const [vehicleData, setVehicleData] = useState<{make?: string, model?: string, year?: number} | null>(null)

  // Read URL parameters and populate form fields
  useEffect(() => {
    const location = searchParams.get('location')
    const date = searchParams.get('date')
    const vehicleReg = searchParams.get('vehicleReg')

    if (location) {
      setSearchLocation(location)
      setDebouncedSearchTerm(location)
    }

    if (date) {
      setSelectedDate(date)
    }

    if (vehicleReg) {
      setVehicleRegistration(vehicleReg)
    }
  }, [searchParams])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    }
  }, [status, router])

  // Clear results when vehicle registration becomes invalid or empty
  useEffect(() => {
    if (!registrationValid || !vehicleRegistration.trim()) {
      setGarages([])
    }
  }, [registrationValid, vehicleRegistration])

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchLocation)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchLocation])

  // Auto search when debounced search term changes
  useEffect(() => {
    const abortController = new AbortController()

    // Only search if vehicle registration is valid
    if (debouncedSearchTerm.trim() && registrationValid) {
      searchGarages(abortController)
    } else {
      setGarages([])
    }

    return () => {
      abortController.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, selectedDate, selectedTime, registrationValid])

  const searchGarages = async (abortController?: AbortController) => {
    // Don't search if vehicle registration is not valid
    if (!registrationValid || !debouncedSearchTerm.trim()) {
      setGarages([])
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        location: debouncedSearchTerm,
        date: selectedDate
      })
      
      // Only add time parameter if it has a value
      if (selectedTime && selectedTime.trim()) {
        params.append('time', selectedTime)
      }

      const response = await fetch(`/api/garages/search?${params}`, {
        signal: abortController?.signal
      })

      if (response.ok) {
        const data = await response.json()
        // Filter garages that have available slots for the selected time
        const filteredGarages = (data.garages || []).filter((garage: Garage) => {
          return garage.availableSlots && garage.availableSlots.length > 0
        })
        setGarages(filteredGarages)
        setSelectedTimeSlots({})
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Search request cancelled')
      } else {
        console.error('Error searching garages:', error)
      }
    } finally {
      setLoading(false)
    }
  }


  const handleBooking = async (garage: Garage) => {
    if (!vehicleRegistration.trim()) {
      alert('Please enter a vehicle registration')
      return
    }

    if (!registrationValid || registrationError) {
      alert('Please enter a valid vehicle registration. The registration must be validated with DVLA.')
      return
    }

    const selectedTimeSlot = selectedTimeSlots[garage.id]

    if (!selectedTimeSlot) {
      alert('Please select a time slot')
      return
    }

    // Get the actual vehicle from user's database (it should exist now since we register on validation)
    try {
      const normalizedReg = vehicleRegistration.toUpperCase().replace(/\s/g, '')
      
      // Fetch user's vehicles to find the one we just registered
      const vehiclesResponse = await fetch('/api/vehicles')
      let vehicle = null
      
      if (vehiclesResponse.ok) {
        const vehiclesData = await vehiclesResponse.json()
        vehicle = vehiclesData.vehicles?.find((v: any) => 
          v.registration.toUpperCase().replace(/\s/g, '') === normalizedReg
        )
      }
      
      // If vehicle not found, fetch from DVLA and create temporary object
      if (!vehicle) {
        const vehicleResponse = await fetch(`/api/vehicles/lookup?registration=${encodeURIComponent(normalizedReg)}`)
        
        if (vehicleResponse.ok) {
          const vehicleData = await vehicleResponse.json()
          
          // Create temporary vehicle object (shouldn't happen if registration worked, but fallback)
          vehicle = {
            id: 'temp-' + Date.now(),
            registration: vehicleData.registration || vehicleRegistration,
            make: vehicleData.make || 'Unknown',
            model: vehicleData.model || 'Unknown',
            year: vehicleData.year || new Date().getFullYear(),
            color: vehicleData.color || '',
            engineSize: vehicleData.engineSize || ''
          }
        } else {
          // Fallback: create minimal vehicle object
          vehicle = {
            id: 'temp-' + Date.now(),
            registration: vehicleRegistration,
            make: 'Unknown',
            model: 'Unknown',
            year: new Date().getFullYear(),
            color: '',
            engineSize: ''
          }
        }
      }

      // Store booking data in session storage for the booking flow
      const bookingDataToStore = {
        garage,
        vehicle,
        date: selectedDate,
        timeSlot: selectedTimeSlot
      }
      
      sessionStorage.setItem('bookingData', JSON.stringify(bookingDataToStore))
      
      router.push(`/booking/${garage.id}`)
    } catch (error) {
      // Fallback: create minimal vehicle object
      const vehicle = {
        id: 'temp-' + Date.now(),
        registration: vehicleRegistration,
        make: 'Unknown',
        model: 'Unknown',
        year: new Date().getFullYear(),
        color: '',
        engineSize: ''
      }
      
      sessionStorage.setItem('bookingData', JSON.stringify({
        garage,
        vehicle,
        date: selectedDate,
        timeSlot: selectedTimeSlot
      }))
      
      router.push(`/booking/${garage.id}`)
    }
  }

  const handleTimeSlotSelect = (garageId: string, timeSlot: string) => {
    setSelectedTimeSlots(prev => ({
      ...prev,
      [garageId]: timeSlot
    }))
  }

  const clearVehicleRegistration = () => {
    setVehicleRegistration('')
    setRegistrationError(null)
    setRegistrationValid(false)
    setVehicleData(null)
  }

  const clearSearchLocation = () => {
    setSearchLocation('')
    setDebouncedSearchTerm('')
    setGarages([])
  }

  const clearDate = () => {
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  // Register vehicle in the system when validation is successful
  const registerVehicle = async (vehicleInfo: any, registration: string) => {
    try {
      // First, check if user already has this vehicle
      const vehiclesResponse = await fetch('/api/vehicles')
      if (vehiclesResponse.ok) {
        const vehiclesData = await vehiclesResponse.json()
        const existingVehicle = vehiclesData.vehicles?.find((v: any) => 
          v.registration.toUpperCase().replace(/\s/g, '') === registration.toUpperCase().replace(/\s/g, '')
        )
        
        if (existingVehicle) {
          return // Vehicle already exists, no need to create
        }
      }
      
      // Create the vehicle
      const vehicleMake = vehicleInfo.make?.trim() || 'Unknown'
      const vehicleModel = vehicleInfo.model?.trim() || 'Unknown'
      const vehicleYear = vehicleInfo.year || new Date().getFullYear()
      
      const createResponse = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration: registration,
          make: vehicleMake,
          model: vehicleModel,
          year: vehicleYear,
          fuelType: vehicleInfo.fuelType || 'PETROL',
          color: vehicleInfo.color || '',
          engineSize: vehicleInfo.engineSize || ''
        })
      })
      
      if (createResponse.ok) {
        // Vehicle registered successfully
      } else {
        const errorData = await createResponse.json().catch(() => ({}))
        
        // If vehicle already exists (409), that's fine - it will be found later
        if (createResponse.status !== 409) {
          console.error('Failed to register vehicle:', errorData.error)
        }
      }
    } catch (error) {
      console.error('Error registering vehicle:', error)
      // Don't show error to user - validation was successful, vehicle creation can happen later
    }
  }

  // Validate vehicle registration with DVLA
  const validateVehicleRegistration = async (registration: string) => {
    const trimmedReg = registration.trim()
    
    // Reset validation state
    setRegistrationError(null)
    setRegistrationValid(false)
    
    // If empty, don't validate (but field is required)
    if (!trimmedReg) {
      return
    }

    // Basic format validation first
    if (!validateUKRegistration(trimmedReg)) {
      setRegistrationError('Invalid UK registration format. Please enter a valid format (e.g., AB12 CDE)')
      setRegistrationValid(false)
      return
    }

    // Validate with DVLA API
    setValidatingRegistration(true)
    try {
      const normalizedReg = trimmedReg.toUpperCase().replace(/\s/g, '')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(`/api/vehicles/lookup?registration=${encodeURIComponent(normalizedReg)}`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (response.ok) {
        const vehicleInfo = await response.json()
        setRegistrationValid(true)
        setRegistrationError(null)
        setVehicleData({
          make: vehicleInfo.make || '',
          model: vehicleInfo.model || '',
          year: vehicleInfo.year || undefined
        })
        
        // Automatically register the vehicle when validation is successful
        await registerVehicle(vehicleInfo, trimmedReg)
      } else {
        const errorData = await response.json().catch(() => ({}))
        const status = response.status
        
        if (status === 400 && errorData?.code === 'INVALID_FORMAT') {
          setRegistrationError('Invalid registration format. Please check and try again.')
        } else if (status === 404 || errorData?.code === 'NOT_FOUND') {
          setRegistrationError('Vehicle not found in DVLA database. Please verify the registration number.')
        } else if (status === 429 || errorData?.code === 'RATE_LIMIT') {
          setRegistrationError('Request limit exceeded. Please wait and try again.')
        } else if (status === 503 || errorData?.code === 'DVSA_UNAVAILABLE') {
          setRegistrationError('DVLA service temporarily unavailable. Please try again later.')
        } else {
          setRegistrationError('Unable to validate registration. Please verify the number.')
        }
        setRegistrationValid(false)
      }
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
        setRegistrationError('Validation timeout. Please try again.')
      } else {
        setRegistrationError('Unable to validate registration. Please verify the number.')
      }
      setRegistrationValid(false)
    } finally {
      setValidatingRegistration(false)
    }
  }

  // Debounce registration validation
  useEffect(() => {
    if (!vehicleRegistration.trim()) {
      setRegistrationError(null)
      setRegistrationValid(false)
      return
    }

    const timer = setTimeout(() => {
      validateVehicleRegistration(vehicleRegistration)
    }, 800) // Wait 800ms after user stops typing

    return () => clearTimeout(timer)
  }, [vehicleRegistration])

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Find MOT Test Centres</h1>
              <p className="text-muted-foreground mb-4">
                Enter your vehicle registration, postcode or city, and select a date to find nearby MOT test centers.
              </p>
              
              {/* Search Form */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Vehicle Registration */}
                <div className="relative flex-1">
                  <label htmlFor="vehicle-registration" className="text-sm font-medium mb-1 block">
                    Vehicle Registration <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="vehicle-registration"
                      placeholder="Vehicle Registration"
                      value={vehicleRegistration}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setVehicleRegistration(e.target.value.toUpperCase())
                        // Clear error when user starts typing
                        if (registrationError && e.target.value.trim()) {
                          setRegistrationError(null)
                        }
                      }}
                      onBlur={() => {
                        if (vehicleRegistration.trim()) {
                          validateVehicleRegistration(vehicleRegistration)
                        } else {
                          setRegistrationError('Vehicle registration is required')
                        }
                      }}
                      required
                      aria-required="true"
                      aria-invalid={!!registrationError}
                      aria-describedby={registrationError ? "registration-error" : registrationValid ? "registration-success" : undefined}
                      className={`pr-8 ${registrationError ? 'border-red-500 focus-visible:ring-red-500' : ''} ${registrationValid ? 'border-green-500 focus-visible:ring-green-500' : ''}`}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {validatingRegistration ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          {registrationValid && (
                            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {vehicleRegistration && (
                            <button
                              type="button"
                              onClick={clearVehicleRegistration}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {registrationError && (
                    <p id="registration-error" className="text-red-500 text-xs mt-1" role="alert">{registrationError}</p>
                  )}
                  {registrationValid && !registrationError && (
                    <div id="registration-success" className="mt-1">
                      <p className="text-green-600 text-xs">Registration validated</p>
                      {vehicleData && (vehicleData.make || vehicleData.model || vehicleData.year) && (
                        <p className="text-green-600 text-xs font-medium mt-0.5">
                          {vehicleData.make} {vehicleData.model} {vehicleData.year && `(${vehicleData.year})`}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Postcode/City - Conditional */}
                {registrationValid && (
                  <div className="relative flex-1">
                    <label htmlFor="postcode-city" className="text-sm font-medium mb-1 block">
                      Post Code or City
                    </label>
                    <Input
                      id="postcode-city"
                      placeholder="Postcode or City"
                      value={searchLocation}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchLocation(e.target.value)}
                      className="pr-8"
                      aria-label="Post Code or City"
                    />
                  </div>
                )}

                {/* Date - Conditional */}
                {registrationValid && (
                  <div className="relative flex-1">
                    <label htmlFor="booking-date" className="text-sm font-medium mb-1 block">
                      Date
                    </label>
                    <Input
                      id="booking-date"
                      type="date"
                      value={selectedDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newDate = e.target.value
                        setSelectedDate(newDate)
                        // Clear time if date is in the future, otherwise set to next full hour
                        const selectedDateObj = new Date(newDate)
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        selectedDateObj.setHours(0, 0, 0, 0)
                        if (selectedDateObj > today) {
                          setSelectedTime('') // Empty time for future dates
                        } else {
                          // If date is today, update to next full hour
                          setSelectedTime(getDefaultTime(newDate))
                        }
                        // Auto-search when date changes and location is filled
                        if (searchLocation.trim()) {
                          searchGarages()
                        }
                      }}
                      className="pr-8"
                      min={new Date().toISOString().split('T')[0]}
                      aria-label="Date"
                    />
                  </div>
                )}

                {/* Time - Conditional */}
                {registrationValid && (
                  <div className="relative flex-1">
                    <label htmlFor="booking-time" className="text-sm font-medium mb-1 block">
                      Time
                    </label>
                    <Input
                      id="booking-time"
                      type="time"
                      value={selectedTime}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setSelectedTime(e.target.value)
                        // Auto-search when time changes and location is filled
                        if (searchLocation.trim()) {
                          searchGarages()
                        }
                      }}
                      className="pr-8"
                      aria-label="Time"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          {garages.length > 0 && registrationValid && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">
                Found {garages.length} MOT Test Centers
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {garages.map((garage) => (
                  <Card key={garage.id} className="hover:shadow-lg transition-shadow shadow-xl rounded-lg border border-border">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{garage.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-4 w-4" />
                            {garage.address}, {garage.city}, {garage.postcode}
                          </CardDescription>
                        </div>
                        {garage.distance && (
                          <Badge variant="secondary">
                            {garage.distance.toFixed(1)} miles
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{garage.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{garage.email}</span>
                        </div>
                      </div>

                      {garage.rating && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{garage.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            ({garage.reviewCount} reviews)
                          </span>
                        </div>
                      )}

                      {/* Available Time Slots */}
                      {'availableSlots' in garage && garage.availableSlots && garage.availableSlots.length > 0 ? (
                        <div className="pt-4 border-t">
                          <div className="text-sm font-medium mb-2">Available Time Slots:</div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {garage.availableSlots.map((slot: string) => (
                              <div
                                key={slot}
                                onClick={() => handleTimeSlotSelect(garage.id, slot)}
                                className={`
                                  px-3 py-1 rounded-md text-sm cursor-pointer transition-colors
                                  border border-border hover:border-primary
                                  ${selectedTimeSlots[garage.id] === slot
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-background hover:bg-primary/5'}
                                `}
                              >
                                {slot}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="pt-4 border-t text-sm text-muted-foreground">
                          No available slots for selected date. Try another date.
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {formatCurrency(garage.motPrice)}
                          </div>
                          <div className="text-sm text-muted-foreground">MOT Test</div>
                        </div>

                        <Button
                          onClick={() => handleBooking(garage)}
                          disabled={!vehicleRegistration.trim() || !selectedTimeSlots[garage.id]}
                          className="flex items-center gap-2"
                        >
                          <Clock className="h-4 w-4" />
                          Book Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {!loading && garages.length === 0 && searchLocation && registrationValid && (
            <Card className="shadow-xl rounded-lg border border-border">
              <CardContent className="text-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No MOT centres found</h3>
                <div className="text-muted-foreground mb-4 space-y-1">
                  <p>We couldn't find any MOT test centres with available slots in the area</p>
                  <p className="font-semibold text-base">
                    {searchLocation} for {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at {selectedTime}.
                  </p>
                  <p>Please try a different postcode, date, or time.</p>
                </div>
                <Button variant="outline" onClick={clearSearchLocation}>
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        </MainLayout>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
