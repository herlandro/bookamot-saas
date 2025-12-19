import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GarageApprovalStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get pending garages that need approval
    const pendingGarages = await prisma.garage.findMany({
      where: {
        approvalStatus: {
          in: [GarageApprovalStatus.PENDING, GarageApprovalStatus.INFO_REQUESTED]
        }
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    // Transform to notifications
    const notifications = pendingGarages.map((garage) => ({
      id: garage.id,
      type: garage.approvalStatus === 'INFO_REQUESTED' ? 'GARAGE_INFO_REQUESTED' : 'GARAGE_PENDING',
      title: garage.approvalStatus === 'INFO_REQUESTED' 
        ? 'Information Requested' 
        : 'New Garage Registration',
      message: `${garage.name} is awaiting ${garage.approvalStatus === 'INFO_REQUESTED' ? 'additional information' : 'approval'}`,
      garageId: garage.id,
      garageName: garage.name,
      createdAt: garage.createdAt.toISOString(),
      isRead: false // For now, we'll mark all as unread to show them
    }))

    const unreadCount = notifications.length

    return NextResponse.json({
      notifications,
      unreadCount
    })
  } catch (error) {
    console.error('Error fetching admin notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

