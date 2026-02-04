import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminNotificationType } from '@prisma/client'

const MOTB10_AMOUNT_PENCE = 1000 // £10
const MOTB10_QUANTITY = 10

/**
 * GET /api/garage-admin/purchase-requests
 * List all purchase requests for the current garage (for Shopping screen table).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'GARAGE_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const garage = await prisma.garage.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true },
    })
    if (!garage) {
      return NextResponse.json({ error: 'Garage not found' }, { status: 404 })
    }

    const requests = await prisma.purchaseRequest.findMany({
      where: { garageId: garage.id },
      orderBy: { requestedAt: 'desc' },
    })

    // Get confirmed count per "batch" - we don't have batch tracking per purchase, so we show:
    // For each request: quota added = 10, consumed = we'd need to track per-request consumption.
    // Simplified: show total garage confirmed count and total quota; per-row "consumed" would require
    // either allocating consumption to oldest purchase first or storing consumed per PurchaseRequest.
    const confirmedCount = await prisma.booking.count({
      where: {
        garageId: garage.id,
        status: 'CONFIRMED',
      },
    })

    const garageWithQuota = await prisma.garage.findUnique({
      where: { id: garage.id },
      select: { motQuota: true },
    })
    const totalQuota = garageWithQuota?.motQuota ?? 0

    const rows = requests.map((r) => ({
      id: r.id,
      dateRequested: r.requestedAt.toISOString(),
      dateApprovedRejected: r.approvedAt?.toISOString() ?? r.rejectedAt?.toISOString() ?? null,
      bankReference: r.bankReference,
      quotaAdded: r.status === 'APPROVED' ? r.quantity : 0,
      status: r.status,
      // Consumed from this batch: not stored; show "–" or derive from FIFO if we add that later.
      consumed: null as number | null,
      remaining: r.status === 'APPROVED' ? r.quantity : null as number | null,
    }))

    return NextResponse.json({
      purchaseRequests: rows,
      totalConfirmed: confirmedCount,
      totalQuota,
    })
  } catch (error) {
    console.error('Error listing purchase requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/garage-admin/purchase-requests
 * Create a purchase request (status = PENDING), trigger notification + email.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'GARAGE_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const garage = await prisma.garage.findFirst({
      where: { ownerId: session.user.id },
      include: { owner: { select: { name: true, email: true } } },
    })
    if (!garage) {
      return NextResponse.json({ error: 'Garage not found' }, { status: 404 })
    }

    const timestamp = Date.now()
    const bankReference =
      typeof body.bankReference === 'string' && body.bankReference.trim()
        ? body.bankReference.trim()
        : `${garage.id.slice(-6)}-${timestamp}`

    const purchaseRequest = await prisma.purchaseRequest.create({
      data: {
        garageId: garage.id,
        bankReference,
        amountPence: MOTB10_AMOUNT_PENCE,
        quantity: MOTB10_QUANTITY,
        status: 'PENDING',
      },
    })

    // Admin notification for super-admins (Accept / Reject → Sales screen)
    await prisma.adminNotification.create({
      data: {
        type: AdminNotificationType.MOT_PURCHASE_REQUEST,
        referenceId: purchaseRequest.id,
        title: 'New MOT Booking Purchase Request',
        message: `${garage.name} requested ${MOTB10_QUANTITY} MOT bookings (reference: ${bankReference}).`,
      },
    })

    // Email to bookanmot@gmail.com (queued)
    const { queuePurchaseRequestEmail } = await import('@/lib/email/purchase-email')
    await queuePurchaseRequestEmail(garage.name, purchaseRequest.id, bankReference)

    return NextResponse.json({
      id: purchaseRequest.id,
      bankReference: purchaseRequest.bankReference,
      status: purchaseRequest.status,
    })
  } catch (error) {
    console.error('Error creating purchase request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
