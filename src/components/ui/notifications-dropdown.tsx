'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bell, AlertCircle, CheckCircle2, XCircle, MessageSquare, Settings } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useNotifications, Notification } from '@/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'

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


export function NotificationsDropdown({ onBookingClick }: NotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications()

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
                <div className="p-2 space-y-4">
                  {notificationCategories.map((category) => {
                    const categoryNotifications = groupedNotifications[category.type] || []
                    if (categoryNotifications.length === 0) return null

                    return (
                      <div key={category.type} className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2">
                          {category.label}
                        </h4>
                        {categoryNotifications.map((notification) => {
                          const Icon = getNotificationIcon(notification.type)

                          return (
                            <div
                              key={notification.id}
                              className={cn(
                                "cursor-pointer hover:bg-accent transition-colors p-3 rounded-lg border border-border",
                                !notification.isRead && "bg-accent/30 border-l-4 border-l-primary"
                              )}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex items-start gap-3">
                                <Icon className={cn(
                                  "h-4 w-4 flex-shrink-0 mt-0.5",
                                  !notification.isRead ? "text-primary" : "text-muted-foreground"
                                )} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <p className={cn(
                                      "text-sm",
                                      !notification.isRead ? "font-semibold text-foreground" : "text-muted-foreground"
                                    )}>
                                      {notification.message}
                                    </p>
                                    {!notification.isRead && (
                                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {formatTime(notification.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
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

