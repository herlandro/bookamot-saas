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

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    const where: any = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    }

    // Filtro de status: 'all', 'active', 'inactive', 'approved', 'rejected', 'pending', 'info_requested'
    if (status !== 'all') {
      if (status === 'active') {
        where.isActive = true
      } else if (status === 'inactive') {
        where.isActive = false
      } else if (['APPROVED', 'REJECTED', 'PENDING', 'INFO_REQUESTED'].includes(status)) {
        where.approvalStatus = status as GarageApprovalStatus
      }
    }

    const [garages, total] = await Promise.all([
      prisma.garage.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          city: true,
          postcode: true,
          motPrice: true,
          isActive: true,
          dvlaApproved: true,
          approvalStatus: true,
          createdAt: true,
          owner: { select: { name: true, email: true } },
          _count: { select: { bookings: true, reviews: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.garage.count({ where })
    ])

    return NextResponse.json({
      garages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching garages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

