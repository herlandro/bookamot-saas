"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, User, Car, Phone, Mail, Calendar, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Booking {
  id: string
  date: string
  timeSlot: string
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'PENDING'
  reference: string
  vehicle: {
    registration: string
    make: string
    model: string
  }
  user: {
    name: string
    email: string
  }
}

interface BookingModalProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
  onStatusUpdate: (bookingId: string, newStatus: string) => void
}

// Usando cores consistentes do sistema
const statusColors = {
  CONFIRMED: 'bg-primary text-primary-foreground',
  COMPLETED: 'bg-success text-success-foreground',
  CANCELLED: 'bg-destructive text-destructive-foreground',
  PENDING: 'bg-warning text-warning-foreground'
}

const statusLabels = {
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  PENDING: 'Pendente'
}

export function BookingModal({ booking, isOpen, onClose, onStatusUpdate }: BookingModalProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  if (!booking) return null

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      await onStatusUpdate(booking.id, newStatus)
      onClose()
    } catch (error) {
      console.error('Error updating booking status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getAvailableActions = () => {
    switch (booking.status) {
      case 'PENDING':
        return [
          { label: 'Confirmar', status: 'CONFIRMED', variant: 'default' as const },
          { label: 'Cancelar', status: 'CANCELLED', variant: 'destructive' as const }
        ]
      case 'CONFIRMED':
        return [
          { label: 'Marcar como Concluído', status: 'COMPLETED', variant: 'default' as const },
          { label: 'Cancelar', status: 'CANCELLED', variant: 'destructive' as const }
        ]
      default:
        return []
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <Card className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-border bg-card">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-3">
                <Car className="h-5 w-5" />
                {booking.vehicle.make} {booking.vehicle.model}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Referência: {booking.reference}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

        <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge 
                className={`${statusColors[booking.status]} px-4 py-2 text-sm font-medium`}
              >
                {statusLabels[booking.status]}
              </Badge>
            </div>

            {/* Booking Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card border border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Data e Horário</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm">{formatDate(booking.date)}</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium">{booking.timeSlot}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Cliente</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{booking.user.name}</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{booking.user.email}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vehicle Details */}
            <Card className="bg-card border border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Veículo</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Marca/Modelo</p>
                    <p className="font-medium">{booking.vehicle.make} {booking.vehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Placa</p>
                    <p className="font-medium">{booking.vehicle.registration}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {getAvailableActions().length > 0 && (
              <div className="flex gap-3 justify-end pt-4 border-t">
                {getAvailableActions().map((action) => (
                  <Button
                    key={action.status}
                    variant={action.variant}
                    onClick={() => handleStatusUpdate(action.status)}
                    disabled={isUpdating}
                    className="min-w-[120px]"
                  >
                    {isUpdating ? 'Atualizando...' : action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}