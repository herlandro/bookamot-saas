import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/sales
 * List all purchase requests (super-admin only). Sortable and filterable.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // PENDING | APPROVED | REJECTED | ''
    const sortBy = searchParams.get('sortBy') || 'requestedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const requestId = searchParams.get('requestId') // for notification deep link

    const where: Record<string, unknown> = {}
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status
    }
    if (requestId) {
      where.id = requestId
    }

    const orderDir: Prisma.SortOrder = sortOrder === 'asc' ? 'asc' : 'desc'
    let orderBy: Prisma.PurchaseRequestOrderByWithRelationInput = { requestedAt: 'desc' }
    if (sortBy === 'garageName') {
      orderBy = { garage: { name: orderDir } }
    } else if (sortBy === 'requestedAt') {
      orderBy = { requestedAt: orderDir }
    } else if (sortBy === 'amountPence') {
      orderBy = { amountPence: orderDir }
    } else if (sortBy === 'status') {
      orderBy = { status: orderDir }
    }

    const requests = await prisma.purchaseRequest.findMany({
      where,
      orderBy,
      include: {
        garage: {
          select: {
            id: true,
            name: true,
            owner: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    const rows = requests.map((r) => ({
      id: r.id,
      garageId: r.garage.id,
      garageName: r.garage.name,
      garageOwner: r.garage.owner.name || r.garage.owner.email,
      garageOwnerEmail: r.garage.owner.email,
      requestedOn: r.requestedAt.toISOString(),
      bankReference: r.bankReference,
      amountPence: r.amountPence,
      amountFormatted: `£${(r.amountPence / 100).toFixed(2)}`,
      status: r.status,
      approvedAt: r.approvedAt?.toISOString() ?? null,
      rejectedAt: r.rejectedAt?.toISOString() ?? null,
      rejectionReason: r.rejectionReason ?? null,
    }))

    return NextResponse.json({ purchaseRequests: rows })
  } catch (error) {
    console.error('Error listing sales:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
