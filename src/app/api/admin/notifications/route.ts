import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GarageApprovalStatus, PurchaseRequestStatus } from '@prisma/client'
import { AdminNotificationType } from '@prisma/client'

export const dynamic = 'force-dynamic'

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

    const garageNotifications = pendingGarages.map((garage) => ({
      id: garage.id,
      type: garage.approvalStatus === 'INFO_REQUESTED' ? 'GARAGE_INFO_REQUESTED' : 'GARAGE_PENDING',
      title: garage.approvalStatus === 'INFO_REQUESTED' 
        ? 'Information Requested' 
        : 'New Garage Registration',
      message: `${garage.name} is awaiting ${garage.approvalStatus === 'INFO_REQUESTED' ? 'additional information' : 'approval'}`,
      garageId: garage.id,
      garageName: garage.name,
      createdAt: garage.createdAt.toISOString(),
      isRead: false
    }))

    let purchaseRequestNotifications: Array<{
      id: string
      type: string
      title: string
      message: string
      purchaseRequestId: string
      garageName?: string
      createdAt: string
      isRead: boolean
    }> = []

    if (session.user.role === 'ADMIN') {
      // Só mostrar notificações de purchase requests que ainda estão PENDING (não aprovados/rejeitados)
      const pendingPurchases = await prisma.purchaseRequest.findMany({
        where: { status: PurchaseRequestStatus.PENDING },
        select: { id: true, garage: { select: { name: true } } }
      })
      const pendingIds = pendingPurchases.map((r) => r.id)
      const garageNameByRequestId = Object.fromEntries(
        pendingPurchases.map((r) => [r.id, r.garage.name])
      )
      if (pendingIds.length > 0) {
        const purchaseNotifications = await prisma.adminNotification.findMany({
          where: {
            type: AdminNotificationType.MOT_PURCHASE_REQUEST,
            referenceId: { in: pendingIds }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        })
        purchaseRequestNotifications = purchaseNotifications.map((n) => ({
          id: n.id,
          type: 'MOT_PURCHASE_REQUEST',
          title: n.title,
          message: n.message,
          purchaseRequestId: n.referenceId,
          garageName: garageNameByRequestId[n.referenceId],
          createdAt: n.createdAt.toISOString(),
          isRead: !!n.readAt
        }))
      }
    }

    const notifications = [...garageNotifications, ...purchaseRequestNotifications]
    const unreadCount = garageNotifications.length + purchaseRequestNotifications.filter((n) => !n.isRead).length

    return NextResponse.json({
      notifications,
      unreadCount
    })
  } catch (error) {
    console.error('Error fetching admin notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

