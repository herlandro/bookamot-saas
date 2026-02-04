'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Building2, AlertCircle, CheckCircle2, Loader2, ShoppingBag, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface AdminNotification {
  id: string
  type: 'GARAGE_PENDING' | 'GARAGE_INFO_REQUESTED' | 'MOT_PURCHASE_REQUEST'
  title: string
  message: string
  garageId?: string
  garageName?: string
  purchaseRequestId?: string
  createdAt: string
  isRead: boolean
}

export function AdminNotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications', {
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
  }

  useEffect(() => {
    fetchNotifications()
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      fetchNotifications()
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const handleNotificationClick = (garageId: string) => {
    setIsOpen(false)
    router.push(`/admin/garages/pending`)
  }

  const handlePurchaseRequestAction = async (requestId: string, action: 'approve' | 'reject', notificationId: string) => {
    setActionLoadingId(notificationId)
    try {
      const res = await fetch(`/api/admin/sales/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'reject' ? { action: 'reject', rejectionReason: '' } : { action: 'approve' }),
      })
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        setUnreadCount((c) => Math.max(0, c - 1))
      }
    } catch (e) {
      console.error('Purchase request action failed:', e)
    } finally {
      setActionLoadingId(null)
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'GARAGE_PENDING':
        return Building2
      case 'GARAGE_INFO_REQUESTED':
        return AlertCircle
      case 'MOT_PURCHASE_REQUEST':
        return ShoppingBag
      default:
        return Bell
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2 hover:bg-accent rounded-lg transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-xs px-1"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
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
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No pending notifications
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type)
                    const isPurchaseRequest = notification.type === 'MOT_PURCHASE_REQUEST'
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "w-full p-4 text-left transition-colors",
                          !notification.isRead && "bg-blue-50/50 dark:bg-blue-950/20",
                          !isPurchaseRequest && "hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg shrink-0",
                            notification.type === 'GARAGE_PENDING' 
                              ? "bg-blue-100 dark:bg-blue-900/30" 
                              : notification.type === 'MOT_PURCHASE_REQUEST'
                                ? "bg-green-100 dark:bg-green-900/30"
                                : "bg-yellow-100 dark:bg-yellow-900/30"
                          )}>
                            <Icon className={cn(
                              "h-4 w-4",
                              notification.type === 'GARAGE_PENDING'
                                ? "text-blue-600 dark:text-blue-400"
                                : notification.type === 'MOT_PURCHASE_REQUEST'
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-yellow-600 dark:text-yellow-400"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {notification.garageName ?? notification.title}
                              </p>
                              {!notification.isRead && (
                                <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 ml-2" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mb-2">
                              {formatTime(notification.createdAt)}
                            </p>
                            {isPurchaseRequest && notification.purchaseRequestId && (
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-7 text-xs"
                                  disabled={actionLoadingId === notification.id}
                                  onClick={() => handlePurchaseRequestAction(notification.purchaseRequestId!, 'approve', notification.id)}
                                >
                                  {actionLoadingId === notification.id ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <Check className="h-3 w-3 mr-1" />
                                  )}
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  disabled={actionLoadingId === notification.id}
                                  onClick={() => handlePurchaseRequestAction(notification.purchaseRequestId!, 'reject', notification.id)}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                            {!isPurchaseRequest && notification.garageId && (
                              <button
                                type="button"
                                className="text-xs font-medium text-primary hover:underline"
                                onClick={() => handleNotificationClick(notification.garageId!)}
                              >
                                View
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-border p-3 space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setIsOpen(false)
                    router.push('/admin/garages/pending')
                  }}
                >
                  View All Pending Garages
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setIsOpen(false)
                    router.push('/admin/sales')
                  }}
                >
                  View All Pending Purchase
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

