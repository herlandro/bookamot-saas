"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Mail, Star, Clock, Car, ArrowLeft, Calendar, Loader2 } from 'lucide-react'
import { formatCurrency, calculateDistance } from '@/lib/utils'
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

interface Vehicle {
  id: string
  registration: string
  make: string
  model: string
  year: number
}

function SearchPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchLocation, setSearchLocation] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]) // Today's date
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<{[garageId: string]: string}>({})
  const [selectedGridDate, setSelectedGridDate] = useState<string>(new Date().toISOString().split('T')[0]) // Initialize with current date
  const [garages, setGarages] = useState<Garage[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(false)
  const [urlParamsLoaded, setUrlParamsLoaded] = useState(false)

  // Read URL parameters and populate form fields
  useEffect(() => {
    const location = searchParams.get('location')
    const date = searchParams.get('date')
    const time = searchParams.get('time')
    const vehicleId = searchParams.get('vehicle')

    console.log('📥 URL Parameters:', { location, date, time, vehicleId })

    if (location) {
      setSearchLocation(location)
      setDebouncedSearchTerm(location) // Set immediately to trigger search
    }

    if (date) {
      setSelectedDate(date)
      setSelectedGridDate(date)
    }

    // Vehicle selection from URL will be handled after vehicles are loaded
    // Mark that URL params have been loaded
    setUrlParamsLoaded(true)
  }, [searchParams])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchUserVehicles()
    }
  }, [session])

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchLocation)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchLocation])

  // Auto search when debounced search term changes
  useEffect(() => {
    const abortController = new AbortController()

    if (debouncedSearchTerm.trim()) {
      searchGarages(abortController)
    } else {
      setGarages([])
    }

    return () => {
      abortController.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, selectedDate])

  const fetchUserVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles')
      if (response.ok) {
        const data = await response.json()
        const vehiclesList = data.vehicles || []
        setVehicles(vehiclesList)

        // Check if there's a vehicle ID in the URL
        const vehicleIdFromUrl = searchParams.get('vehicle')

        if (vehicleIdFromUrl && vehiclesList.length > 0) {
          // Try to find the vehicle with the matching ID
          const vehicleFromUrl = vehiclesList.find((v: Vehicle) => v.id === vehicleIdFromUrl)
          if (vehicleFromUrl) {
            setSelectedVehicle(vehicleFromUrl)
            console.log('🚗 Selected vehicle from URL:', vehicleFromUrl.registration)
          } else {
            // Vehicle ID not found, select first vehicle
            setSelectedVehicle(vehiclesList[0])
            console.log('⚠️ Vehicle ID from URL not found, selecting first vehicle')
          }
        } else if (vehiclesList.length > 0) {
          // No vehicle in URL, select first vehicle
          setSelectedVehicle(vehiclesList[0])
        }
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  // Update URL when vehicle selection changes
  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)

    // Update URL with the selected vehicle ID
    const params = new URLSearchParams(searchParams.toString())
    params.set('vehicle', vehicle.id)
    router.replace(`/search?${params.toString()}`, { scroll: false })
    console.log('🔄 Updated URL with vehicle:', vehicle.id)
  }

  const searchGarages = async (abortController?: AbortController) => {
    if (!debouncedSearchTerm.trim()) {
      setGarages([])
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        location: debouncedSearchTerm,
        date: selectedDate // Include date to get available slots
      })

      console.log('🔍 Searching garages with params:', { location: debouncedSearchTerm, date: selectedDate })

      const response = await fetch(`/api/garages/search?${params}`, {
        signal: abortController?.signal
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Search results:', data)
        console.log('📊 Garages order:', data.garages?.map((g: any, i: number) =>
          `${i+1}. ${g.name} (${g.distance?.toFixed(2) || 'N/A'} miles)`
        ))
        setGarages(data.garages || [])
        // Reset selected time slots when new search results come in
        setSelectedTimeSlots({})
      } else {
        console.error('❌ Search failed:', response.status, response.statusText)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🚫 Search request cancelled')
      } else {
        console.error('Error searching garages:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = (garage: Garage) => {
    if (!selectedVehicle) {
      alert('Please select a vehicle first')
      return
    }

    const selectedTimeSlot = selectedTimeSlots[garage.id]

    // Store booking data in session storage for the booking flow
    sessionStorage.setItem('bookingData', JSON.stringify({
      garage,
      vehicle: selectedVehicle,
      date: selectedDate,
      timeSlot: selectedTimeSlot
    }))

    router.push(`/booking/${garage.id}`)
  }

  const handleTimeSlotSelect = (garageId: string, timeSlot: string) => {
    setSelectedTimeSlots(prev => ({
      ...prev,
      [garageId]: timeSlot
    }))
  }

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
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Find MOT Test Centres</h1>
            <p className="text-muted-foreground">
              Search for approved MOT test centres near you and book your test online.
            </p>
          </div>
        </div>

        {/* Vehicle Selection */}
        {vehicles.length > 0 && (
          <Card className="mb-6 shadow-xl rounded-lg border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Select Vehicle
              </CardTitle>
              <CardDescription>
                Choose the vehicle you want to book an MOT test for.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedVehicle?.id === vehicle.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleVehicleSelect(vehicle)}
                  >
                    <div className="font-semibold">{vehicle.registration}</div>
                    <div className="text-sm text-muted-foreground">
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card className="mb-6 shadow-xl rounded-lg border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Search Location
            </CardTitle>
            <CardDescription>
              Enter your postcode or city to find nearby MOT test centers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter postcode or city (e.g., SW1A 1AA, London)"
                  value={searchLocation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchLocation(e.target.value)}
                  className="flex-1"
                />
                {searchLocation && (
                  <Button variant="ghost" onClick={() => {
                    setSearchLocation('')
                    setGarages([])
                  }}>
                    Clear
                  </Button>
                )}
                <Button onClick={() => searchGarages()} disabled={loading || !searchLocation.trim()}>
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Select date for available slots:</span>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setSelectedDate(e.target.value)
                      setSelectedGridDate(e.target.value) // Atualiza também a data selecionada no grid
                      if (searchLocation.trim()) {
                        // Re-search with new date
                        searchGarages()
                      }
                    }}
                    className="w-auto"
                    min={new Date().toISOString().split('T')[0]} // Can't select dates in the past
                  />
                </div>

                <div className="border rounded-lg p-4">
                  <div className="text-sm font-medium mb-3">Select date for available slots:</div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 14 }, (_, i) => {
                      const date = new Date(selectedDate);
                      date.setDate(date.getDate() + i);
                      const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
                      const dayName = date.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 3);
                      const dateString = date.toISOString().split('T')[0];

                      return (
                        <div
                          key={dateString}
                          onClick={() => {
                            // Synchronize both date fields
                            setSelectedDate(dateString);
                            setSelectedGridDate(dateString);

                            if (searchLocation.trim()) {
                              const params = new URLSearchParams({
                                location: searchLocation,
                                date: dateString
                              });

                              setLoading(true);
                              fetch(`/api/garages/search?${params}`)
                                .then(response => {
                                  if (response.ok) return response.json();
                                  throw new Error('Search failed');
                                })
                                .then(data => {
                                  setGarages(data.garages || []);
                                  setSelectedTimeSlots({});
                                })
                                .catch(error => {
                                  console.error('Error searching garages:', error);
                                })
                                .finally(() => {
                                  setLoading(false);
                                });
                            }
                          }}
                          className={`
                            px-3 py-2 rounded-md text-sm cursor-pointer transition-colors
                            border hover:border-primary flex flex-col items-center
                            ${loading && searchLocation.trim() ? 'opacity-50 pointer-events-none' : ''}
                            ${selectedGridDate === dateString
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background hover:bg-primary/5 border-border'}
                          `}
                        >
                          <span className="font-medium">{dayName}</span>
                          <span>{formattedDate}</span>
                        </div>
                       );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {garages.length > 0 && (
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
                        No available slots for today. Try another date.
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
                        disabled={!selectedVehicle || !selectedTimeSlots[garage.id]}
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
        {!loading && garages.length === 0 && searchLocation && (
          <Card className="shadow-xl rounded-lg border border-border">
            <CardContent className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No MOT centers found</h3>
              <p className="text-muted-foreground mb-4">
                We couldn't find any MOT test centers in your area. Try searching with a different location.
              </p>
              <Button variant="outline" onClick={() => setSearchLocation('')}>
                Clear Search
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No Vehicle Warning */}
        {vehicles.length === 0 && (
          <Card className="border-yellow-200 bg-yellow-50 border border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-yellow-800">
                <Car className="h-5 w-5" />
                <span className="font-medium">No vehicles found</span>
              </div>
              <p className="text-yellow-700 mt-2">
                You need to add a vehicle before you can book an MOT test.
              </p>
              <Button
                variant="outline"
                className="mt-4 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                onClick={() => router.push('/vehicles/add')}
              >
                Add Vehicle
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
