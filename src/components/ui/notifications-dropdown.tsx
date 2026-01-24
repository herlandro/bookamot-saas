'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bell, AlertCircle, CheckCircle2, XCircle, MessageSquare, Settings } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useNotifications, Notification } from '@/hooks/use-notifications'
import { formatDistanceToNow, format } from 'date-fns'

interface NotificationsDropdownProps {
  onBookingClick?: (bookingId: string) => void
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'BOOKING_PENDING':
      return AlertCircle
    case 'BOOKING_CONFIRMED':
      return CheckCircle2
    case 'BOOKING_CANCELLED':
      return XCircle
    case 'MESSAGE':
      return MessageSquare
    case 'SYSTEM':
      return Settings
    default:
      return Bell
  }
}

// Function to generate random colour based on name (stable hash)
const getAvatarColor = (name: string): string => {
  // Accessible colour palette with good contrast for white text
  const colours = [
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#f59e0b', // amber-500
    '#10b981', // emerald-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
    '#6366f1', // indigo-500
    '#14b8a6', // teal-500
    '#a855f7', // purple-500
  ]

  // Simple hash based on name to ensure consistency
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colours[Math.abs(hash) % colours.length]
}

// Function to extract initials from name
const getInitials = (name: string): string => {
  if (!name || name.trim().length === 0) return '??'
  
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    // If only one name, take the first two letters
    return parts[0].substring(0, 2).toUpperCase()
  }
  
  // Take first letter of first name and first letter of last name
  const firstInitial = parts[0][0]?.toUpperCase() || ''
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || ''
  return `${firstInitial}${lastInitial}`
}

// Function to format date and time in the requested format
const formatBookingDateTime = (dateString: string, timeSlot: string): { date: string; time: string } => {
  try {
    // Create date from string (format YYYY-MM-DD)
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    const formattedDate = format(date, 'MMMM d, yyyy')
    
    // Format time in 12h format with AM/PM
    const [hours, minutes] = timeSlot.split(':')
    const hour24 = parseInt(hours)
    const hour12 = hour24 % 12 || 12
    const ampm = hour24 >= 12 ? 'PM' : 'AM'
    const formattedTime = `${hour12}:${minutes} ${ampm}`
    
    return { date: formattedDate, time: formattedTime }
  } catch {
    return { date: dateString, time: timeSlot }
  }
}

export function NotificationsDropdown({ onBookingClick }: NotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications()
  const [processingBooking, setProcessingBooking] = useState<string | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      refresh()
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, refresh])

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }

    setIsOpen(false)

    // If it's a booking notification, open the booking modal
    if (notification.type.startsWith('BOOKING_') && notification.bookingId) {
      if (onBookingClick) {
        onBookingClick(notification.bookingId)
      } else {
        // Fallback: navigate to booking details page
        window.location.href = `/garage-admin/bookings/${notification.bookingId}`
      }
    }
  }

  const handleConfirmBooking = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation() // Prevent click on notification
    
    if (!notification.bookingId) return
    
    setProcessingBooking(notification.id)
    try {
      const response = await fetch(`/api/garage-admin/bookings/${notification.bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CONFIRMED',
        }),
      })

      if (response.ok) {
        // Update notifications by removing the confirmed one
        await refresh()
      } else {
        const error = await response.json()
        console.error('Error confirming booking:', error)
        alert('Error confirming booking. Please try again.')
      }
    } catch (error) {
      console.error('Error confirming booking:', error)
      alert('Error confirming booking. Please try again.')
    } finally {
      setProcessingBooking(null)
    }
  }

  const handleRejectBooking = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation() // Prevent click on notification
    
    if (!notification.bookingId) return
    
    if (!confirm('Are you sure you want to reject this booking?')) {
      return
    }
    
    setProcessingBooking(notification.id)
    try {
      const response = await fetch(`/api/garage-admin/bookings/${notification.bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CANCELLED',
          notes: 'Booking rejected from notifications',
        }),
      })

      if (response.ok) {
        // Update notifications by removing the rejected one
        await refresh()
      } else {
        const error = await response.json()
        console.error('Error rejecting booking:', error)
        alert('Error rejecting booking. Please try again.')
      }
    } catch (error) {
      console.error('Error rejecting booking:', error)
      alert('Error rejecting booking. Please try again.')
    } finally {
      setProcessingBooking(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  // Group notifications by type
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const type = notification.type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(notification)
    return acc
  }, {} as Record<string, Notification[]>)

  const notificationCategories = [
    { type: 'BOOKING_PENDING' as const, label: 'Pending Bookings' },
    { type: 'BOOKING_CONFIRMED' as const, label: 'Confirmed Bookings' },
    { type: 'BOOKING_CANCELLED' as const, label: 'Cancelled Bookings' },
    { type: 'MESSAGE' as const, label: 'Messages' },
    { type: 'SYSTEM' as const, label: 'System' },
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-accent rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-xs px-1.5 rounded-full animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 md:hidden bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className={cn(
            "absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-lg shadow-lg z-50",
            "max-h-[600px] overflow-hidden flex flex-col",
            "animate-in fade-in slide-in-from-top-2 duration-200"
          )}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                <span className="sr-only">Close</span>
                <span className="text-lg">×</span>
              </Button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No notifications
                  </p>
                </div>
              ) : (
                <div>
                  {notificationCategories.map((category) => {
                    const categoryNotifications = groupedNotifications[category.type] || []
                    if (categoryNotifications.length === 0) return null

                    return (
                      <div key={category.type}>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 pt-4 pb-2">
                          {category.label}
                        </h4>
                        <div className="divide-y divide-border">
                          {categoryNotifications.map((notification) => {
                            const Icon = getNotificationIcon(notification.type)
                            const isBookingPending = notification.type === 'BOOKING_PENDING'
                            const bookingMetadata = notification.metadata?.booking
                            const customerName = bookingMetadata?.user?.name || 'Customer'
                            const initials = getInitials(customerName)
                            const avatarColor = getAvatarColor(customerName)
                            const isProcessing = processingBooking === notification.id

                            // For booking_pending, use the new format
                            if (isBookingPending && bookingMetadata) {
                              const { date, time } = formatBookingDateTime(
                                bookingMetadata.date,
                                bookingMetadata.timeSlot
                              )
                              const vehicle = bookingMetadata.vehicle
                              const vehicleInfo = `${vehicle.make} ${vehicle.model} ${vehicle.year || ''}`.trim()

                              return (
                                <div
                                  key={notification.id}
                                  className={cn(
                                    "w-full text-left p-4 hover:bg-muted/50 transition-colors",
                                    "cursor-pointer"
                                  )}
                                  onClick={() => handleNotificationClick(notification)}
                                >
                                  <div className="flex items-start gap-3">
                                    {/* Avatar with initials */}
                                    <div
                                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                      style={{ backgroundColor: avatarColor }}
                                    >
                                      {initials}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      {/* First line: Name in bold + timestamp */}
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-bold text-foreground dark:text-foreground">
                                          {customerName}
                                        </p>
                                        <p className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                          {formatTime(notification.createdAt)}
                                        </p>
                                      </div>
                                      
                                      {/* Second line: Formatted text */}
                                      <p className="text-sm text-foreground mb-2">
                                        Requested a MOT appointment for his{' '}
                                        <span className="font-bold">{vehicleInfo}</span>
                                        {' '}on {date} at {time}.
                                      </p>
                                      
                                      {/* Third line: Confirm and Reject buttons */}
                                      <div className="flex items-center gap-2 mt-2">
                                        <Button
                                          size="sm"
                                          variant="default"
                                          className="h-7 px-3 text-xs"
                                          onClick={(e) => handleConfirmBooking(e, notification)}
                                          disabled={isProcessing}
                                        >
                                          {isProcessing ? 'Processing...' : 'Confirm'}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 px-3 text-xs"
                                          onClick={(e) => handleRejectBooking(e, notification)}
                                          disabled={isProcessing}
                                        >
                                          Reject
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            }

                            // For other notification types, keep original format (but without coloured backgrounds)
                            return (
                              <button
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={cn(
                                  "w-full text-left p-4 hover:bg-muted/50 transition-colors"
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-lg">
                                    <Icon className="h-4 w-4 text-foreground/70" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {notification.status && (
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-semibold text-foreground">
                                          {notification.status}
                                        </p>
                                      </div>
                                    )}
                                    <p className="text-xs text-muted-foreground mb-1">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatTime(notification.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && unreadCount > 0 && (
              <div className="p-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="w-full text-xs"
                >
                  Mark all as read
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
