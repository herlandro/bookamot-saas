/**
 * MOT Notification Service
 * Handles creation and management of MOT expiry notifications
 */

import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

interface MotNotificationData {
  vehicleId: string
  userId: string
  type: NotificationType
  title: string
  message: string
  daysUntilExpiry?: number
}

/**
 * Create a new MOT notification
 */
export async function createMotNotification(data: MotNotificationData) {
  try {
    const notification = await prisma.motNotification.create({
      data: {
        vehicleId: data.vehicleId,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        daysUntilExpiry: data.daysUntilExpiry
      }
    })

    console.log(`📬 Created ${data.type} notification for vehicle ${data.vehicleId}`)
    return notification
  } catch (error) {
    console.error('❌ Error creating notification:', error)
    throw error
  }
}

/**
 * Check MOT status and create notifications if needed
 */
export async function checkAndNotifyMotStatus(vehicleId: string) {
  try {
    // Get vehicle with owner and latest MOT
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        owner: true,
        motHistory: {
          orderBy: { testDate: 'desc' },
          take: 1
        }
      }
    })

    if (!vehicle || !vehicle.owner) {
      console.log(`⚠️  Vehicle ${vehicleId} not found`)
      return null
    }

    const latestMot = vehicle.motHistory[0]

    if (!latestMot || !latestMot.expiryDate) {
      console.log(`⚠️  No MOT expiry date for vehicle ${vehicleId}`)
      return null
    }

    const now = new Date()
    const expiryDate = new Date(latestMot.expiryDate)
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    console.log(`📅 Vehicle ${vehicle.registration}: ${daysUntilExpiry} days until MOT expiry`)

    // Check if MOT has already expired
    if (daysUntilExpiry < 0) {
      // Check if we already sent an EXPIRED notification
      const existingNotification = await prisma.motNotification.findFirst({
        where: {
          vehicleId,
          type: 'EXPIRED',
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })

      if (!existingNotification) {
        return await createMotNotification({
          vehicleId,
          userId: vehicle.ownerId,
          type: 'EXPIRED',
          title: '⚠️ MOT Expired',
          message: `Your MOT for ${vehicle.registration} expired on ${expiryDate.toLocaleDateString()}. Please book a new MOT immediately.`,
          daysUntilExpiry: 0
        })
      }
    }
    // Check if MOT is expiring soon (within 30 days)
    else if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      // Check if we already sent an EXPIRING_SOON notification
      const existingNotification = await prisma.motNotification.findFirst({
        where: {
          vehicleId,
          type: 'EXPIRING_SOON',
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })

      if (!existingNotification) {
        return await createMotNotification({
          vehicleId,
          userId: vehicle.ownerId,
          type: 'EXPIRING_SOON',
          title: '⏰ MOT Expiring Soon',
          message: `Your MOT for ${vehicle.registration} expires in ${daysUntilExpiry} days (${expiryDate.toLocaleDateString()}). Book your next MOT now.`,
          daysUntilExpiry
        })
      }
    }

    return null
  } catch (error) {
    console.error('❌ Error checking MOT status:', error)
    throw error
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUserNotifications(userId: string, limit: number = 10) {
  try {
    const notifications = await prisma.motNotification.findMany({
      where: { userId },
      include: {
        vehicle: {
          select: {
            id: true,
            registration: true,
            make: true,
            model: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return notifications
  } catch (error) {
    console.error('❌ Error fetching notifications:', error)
    throw error
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const notification = await prisma.motNotification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    console.log(`✅ Marked notification ${notificationId} as read`)
    return notification
  } catch (error) {
    console.error('❌ Error marking notification as read:', error)
    throw error
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string) {
  try {
    const count = await prisma.motNotification.count({
      where: {
        userId,
        isRead: false
      }
    })

    return count
  } catch (error) {
    console.error('❌ Error getting unread count:', error)
    throw error
  }
}

