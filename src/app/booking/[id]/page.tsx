"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { BookingCalendar } from '@/components/booking/booking-calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, MapPin, Phone, Mail, Calendar, Clock, Car } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'

// Componente para redirecionamento automático
interface AutoRedirectProps {
  redirectTo: string;
  delay?: number;
}

function AutoRedirect({ redirectTo, delay = 5000 }: AutoRedirectProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(Math.floor(delay / 1000))
  
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(redirectTo)
    }, delay)
    
    const interval = setInterval(() => {
      setCountdown(prev => prev - 1)
    }, 1000)
    
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [redirectTo, delay, router])
  
  return (
    <div className="mt-4 text-center text-sm text-muted-foreground">
      Redirecionando para {redirectTo} em {countdown} segundos...
    </div>
  )
}

interface Garage {
  id: string
  name: string
  address: string
  city: string
  postcode: string
  phone: string
  email: string
  motPrice: number
}

interface Vehicle {
  id: string
  registration: string
  make: string
  model: string
  year: number
}

interface BookingData {
  garage: Garage
  vehicle: Vehicle
  date?: Date
  timeSlot?: string
}

export default function BookingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const garageId = params.id as string
  
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingStep, setBookingStep] = useState<'calendar' | 'confirmation' | 'success'>('confirmation')
  const [bookingReference, setBookingReference] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    // Try to get booking data from session storage
    const storedData = sessionStorage.getItem('bookingData')
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData)
        if (parsed.garage?.id === garageId) {
          setBookingData(parsed)
        } else {
          // Garage ID doesn't match, fetch garage data
          fetchGarageData()
        }
      } catch (error) {
        console.error('Error parsing booking data:', error)
        fetchGarageData()
      }
    } else {
      fetchGarageData()
    }
    
    setLoading(false)
  }, [garageId])



  const fetchGarageData = async () => {
    try {
      const response = await fetch(`/api/garages/${garageId}`)
      if (response.ok) {
        const garage = await response.json()
        
        // Get user's first vehicle as default
        const vehiclesResponse = await fetch('/api/vehicles')
        if (vehiclesResponse.ok) {
          const vehiclesData = await vehiclesResponse.json()
          if (vehiclesData.vehicles?.length > 0) {
            setBookingData({
              garage,
              vehicle: vehiclesData.vehicles[0]
            })
          } else {
            // No vehicles, redirect to add vehicle page
            router.push('/vehicles/add')
          }
        }
      } else {
        router.push('/search')
      }
    } catch (error) {
      console.error('Error fetching garage data:', error)
      router.push('/search')
    }
  }

  const handleBookingSelect = (date: Date, timeSlot: string) => {
    setBookingData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        date: date,
        timeSlot: timeSlot
      };
    });
    setBookingStep('confirmation')
  }

  const handleConfirmBooking = async () => {
    if (!bookingData || !bookingData.date || !bookingData.timeSlot) {
      alert('Por favor, selecione uma data e horário para a reserva.')
      return
    }
    
    setSubmitting(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          garageId: bookingData.garage.id,
          vehicleId: bookingData.vehicle.id,
          date: bookingData.date instanceof Date ? bookingData.date.toISOString().split('T')[0] : bookingData.date,
          timeSlot: bookingData.timeSlot,
          notes: 'Reserva criada através do sistema BookaMOT'
        })
      })

      if (response.ok) {
        const result = await response.json()
        setBookingReference(result.booking.reference)
        setShowSuccess(true)
        
        // Clear session storage
        sessionStorage.removeItem('bookingData')
        
        // Show success message and redirect to dashboard after 3 seconds
        alert(`Reserva confirmada com sucesso! Referência: ${result.booking.reference}\n\nRedirecionando para o dashboard...`)
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        const error = await response.json()
        alert(`Erro ao confirmar reserva: ${error.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Erro ao confirmar reserva. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (bookingStep === 'confirmation') {
      setBookingStep('calendar')
    } else {
      router.push('/search')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!bookingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Booking data not found</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find the booking information. Please start a new search.
            </p>
            <Button onClick={() => router.push('/search')}>Back to Search</Button>
          </CardContent>
        </Card>
      </div>
    )
  }



  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Confirmar Reserva</h1>
            <p className="text-muted-foreground">Revise os detalhes da sua reserva antes de confirmar.</p>
          </div>
        </div>

        {/* Booking Summary */}
          <Card className="shadow-lg border border-border">
            <CardHeader>
              <CardTitle>Resumo da Reserva</CardTitle>
              <CardDescription>
                Por favor, revise os detalhes da sua reserva antes de confirmar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Informações da Garagem
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-base">{bookingData.garage.name}</div>
                      <div className="text-muted-foreground">{bookingData.garage.address}</div>
                      <div className="text-muted-foreground">{bookingData.garage.city}, {bookingData.garage.postcode}</div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {bookingData.garage.phone}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {bookingData.garage.email}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Car className="h-4 w-4 text-primary" />
                      Dados do Veículo
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-base">{bookingData.vehicle.registration}</div>
                      <div className="text-muted-foreground">{bookingData.vehicle.make} {bookingData.vehicle.model}</div>
                      <div className="text-muted-foreground">Ano: {bookingData.vehicle.year}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Data e Horário
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-base">{bookingData.date && bookingData.date instanceof Date ? bookingData.date.toLocaleDateString('pt-BR', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : ''}</div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">Horário:</span> {bookingData.timeSlot || ''}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <h3 className="font-semibold mb-2 text-primary">Valor do Teste MOT</h3>
                    <div className="text-2xl font-bold text-primary">
                      £{bookingData.garage.motPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Pagamento na garagem no dia do teste
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleConfirmBooking}
                    disabled={submitting || !bookingData.date || !bookingData.timeSlot}
                    className="w-full mt-4"
                    size="lg"
                  >
                    {submitting ? 'Processando...' : 'Confirmar Reserva'}
                  </Button>
                </div>
              </div>
              

            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}