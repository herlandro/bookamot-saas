import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PurchaseRequestStatus } from '@prisma/client'

/**
 * PATCH /api/admin/sales/[id]
 * Approve or reject a purchase request (super-admin only). Idempotent and audited.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const action = body.action === 'reject' ? 'reject' : 'approve'
    const rejectionReason = typeof body.rejectionReason === 'string' ? body.rejectionReason.trim() : undefined

    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        garage: {
          include: { owner: { select: { email: true, name: true } } },
        },
      },
    })

    if (!purchaseRequest) {
      return NextResponse.json({ error: 'Purchase request not found' }, { status: 404 })
    }

    // Idempotent: already in terminal state
    if (purchaseRequest.status === PurchaseRequestStatus.APPROVED) {
      return NextResponse.json({
        message: 'Already approved',
        status: 'APPROVED',
        purchaseRequestId: id,
      })
    }
    if (purchaseRequest.status === PurchaseRequestStatus.REJECTED) {
      return NextResponse.json({
        message: 'Already rejected',
        status: 'REJECTED',
        purchaseRequestId: id,
      })
    }

    if (action === 'approve') {
      await prisma.$transaction(async (tx) => {
        await tx.purchaseRequest.update({
          where: { id },
          data: {
            status: PurchaseRequestStatus.APPROVED,
            approvedAt: new Date(),
            approvedById: session!.user!.id,
          },
        })
        await tx.garage.update({
          where: { id: purchaseRequest.garageId },
          data: {
            motQuota: { increment: purchaseRequest.quantity },
            isActive: true,
          },
        })
        await tx.purchaseRequestAuditLog.create({
          data: {
            purchaseRequestId: id,
            action: 'APPROVED',
            performedById: session!.user!.id,
            details: JSON.stringify({ quantity: purchaseRequest.quantity }),
          },
        })
      })

      const { sendPurchaseApprovedEmail } = await import('@/lib/email/purchase-email')
      await sendPurchaseApprovedEmail(
        purchaseRequest.garage.name,
        purchaseRequest.garage.owner.email,
        purchaseRequest.garage.owner.name ?? undefined
      ).catch((e) => console.error('Send approval email failed:', e))

      return NextResponse.json({
        message: 'Approved',
        status: 'APPROVED',
        purchaseRequestId: id,
      })
    }

    // Reject
    await prisma.$transaction(async (tx) => {
      await tx.purchaseRequest.update({
        where: { id },
        data: {
          status: PurchaseRequestStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: rejectionReason ?? null,
        },
      })
      await tx.purchaseRequestAuditLog.create({
        data: {
          purchaseRequestId: id,
          action: 'REJECTED',
          performedById: session!.user!.id,
          details: rejectionReason ?? null,
        },
      })
    })

    const { sendPurchaseRejectedEmail } = await import('@/lib/email/purchase-email')
    await sendPurchaseRejectedEmail(
      purchaseRequest.garage.name,
      purchaseRequest.garage.owner.email,
      purchaseRequest.garage.owner.name ?? undefined,
      rejectionReason
    ).catch((e) => console.error('Send rejection email failed:', e))

    return NextResponse.json({
      message: 'Rejected',
      status: 'REJECTED',
      purchaseRequestId: id,
    })
  } catch (error) {
    console.error('Error updating purchase request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
