'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

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

interface BookingModalContextType {
  openBookingModal: (bookingId: string) => void
  setBookingData: (booking: Booking | null) => void
  booking: Booking | null
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const BookingModalContext = createContext<BookingModalContextType | undefined>(undefined)

export function BookingModalProvider({ children }: { children: React.ReactNode }) {
  const [booking, setBookingData] = useState<Booking | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const openBookingModal = useCallback(async (bookingId: string) => {
    try {
      const response = await fetch(`/api/garage-admin/bookings/${bookingId}`)
      if (response.ok) {
        const data = await response.json()
        // Transform API response to match Booking interface
        const booking: Booking = {
          id: data.booking.id,
          date: data.booking.date,
          timeSlot: data.booking.timeSlot,
          status: data.booking.status,
          reference: data.booking.reference,
          vehicle: {
            registration: data.booking.vehicle.registration,
            make: data.booking.vehicle.make,
            model: data.booking.vehicle.model,
          },
          user: {
            name: data.booking.user.name,
            email: data.booking.user.email,
          },
        }
        setBookingData(booking)
        setIsOpen(true)
      } else {
        // Fallback: navigate to booking details page
        window.location.href = `/garage-admin/bookings/${bookingId}`
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
      // Fallback: navigate to booking details page
      window.location.href = `/garage-admin/bookings/${bookingId}`
    }
  }, [])

  return (
    <BookingModalContext.Provider
      value={{
        openBookingModal,
        setBookingData,
        booking,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </BookingModalContext.Provider>
  )
}

export function useBookingModal() {
  const context = useContext(BookingModalContext)
  if (context === undefined) {
    throw new Error('useBookingModal must be used within a BookingModalProvider')
  }
  return context
}

