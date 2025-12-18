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
    const status = searchParams.get('status') || 'PENDING' // PENDING, INFO_REQUESTED, or all

    // Build where clause based on status filter
    const statusFilter = status === 'all' 
      ? { approvalStatus: { in: [GarageApprovalStatus.PENDING, GarageApprovalStatus.INFO_REQUESTED] } }
      : { approvalStatus: status as GarageApprovalStatus }

    const where = {
      ...statusFilter,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
          { owner: { name: { contains: search, mode: 'insensitive' as const } } },
          { owner: { email: { contains: search, mode: 'insensitive' as const } } }
        ]
      })
    }

    const [garages, total] = await Promise.all([
      prisma.garage.findMany({
        where,
        include: {
          owner: { 
            select: { 
              id: true, 
              name: true, 
              email: true, 
              phone: true, 
              emailVerified: true,
              createdAt: true 
            } 
          },
          approvalLogs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              admin: { select: { name: true, email: true } }
            }
          }
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
    console.error('Error fetching pending garages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

