import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserNotifications, getUnreadNotificationCount, markNotificationAsRead } from '@/lib/services/mot-notification-service'

/**
 * GET /api/notifications/mot
 * Get MOT notifications for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const includeRead = searchParams.get('includeRead') === 'true'

    let notifications = await getUserNotifications(session.user.id, limit * 2)

    // Filter unread if not requested
    if (!includeRead) {
      notifications = notifications.filter(n => !n.isRead)
    }

    notifications = notifications.slice(0, limit)

    const unreadCount = await getUnreadNotificationCount(session.user.id)

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length
    })
  } catch (error) {
    console.error('❌ Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications/mot/[id]/read
 * Mark notification as read
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    const notification = await markNotificationAsRead(notificationId)

    return NextResponse.json({
      success: true,
      notification
    })
  } catch (error) {
    console.error('❌ Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

