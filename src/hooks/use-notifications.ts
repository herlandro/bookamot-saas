'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export interface Notification {
  id: string
  type: 'BOOKING_PENDING' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'MESSAGE' | 'SYSTEM'
  title: string
  message: string
  bookingId?: string
  isRead: boolean
  createdAt: string
  metadata?: {
    booking?: {
      id: string
      reference: string
      date: string
      timeSlot: string
      vehicle: {
        make: string
        model: string
        registration: string
      }
      user: {
        name: string
        email: string
      }
    }
  }
}

export function useNotifications() {
  const { data: session, status } = useSession()
  const userId = session?.user?.id
  const userRole = session?.user?.role
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (status === 'loading' || !userId) {
      return
    }

    // Only fetch for garage owners
    if (userRole !== 'GARAGE_OWNER') {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/garage-admin/notifications', {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [status, userId, userRole])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/garage-admin/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/garage-admin/notifications/read-all', {
        method: 'PATCH',
      })
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()

    // Poll every 30 seconds for updates
    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  }
}
