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
    const search = (searchParams.get('search') || '').trim()
    const status = searchParams.get('status') || 'PENDING' // PENDING, INFO_REQUESTED, or all
    const region = (searchParams.get('region') || '').trim()
    const dateFrom = (searchParams.get('dateFrom') || '').trim()
    const dateTo = (searchParams.get('dateTo') || '').trim()
    const sortByRaw = (searchParams.get('sortBy') || 'createdAt').trim()
    const sortOrderRaw = (searchParams.get('sortOrder') || 'desc').trim().toLowerCase()
    const sortOrder = sortOrderRaw === 'asc' ? 'asc' : 'desc'

    const allowedSortBy = new Set(['createdAt', 'name', 'city', 'postcode', 'id'])
    const sortBy = allowedSortBy.has(sortByRaw) ? sortByRaw : 'createdAt'

    // Build where clause based on status filter
    const statusFilter = status === 'all' 
      ? { approvalStatus: { in: [GarageApprovalStatus.PENDING, GarageApprovalStatus.INFO_REQUESTED] } }
      : { approvalStatus: status as GarageApprovalStatus }

    const and: any[] = []

    if (search) {
      and.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
          { owner: { name: { contains: search, mode: 'insensitive' as const } } },
          { owner: { email: { contains: search, mode: 'insensitive' as const } } },
        ],
      })
    }

    if (region) {
      and.push({
        OR: [
          { city: { contains: region, mode: 'insensitive' as const } },
          { postcode: { contains: region, mode: 'insensitive' as const } },
          { address: { contains: region, mode: 'insensitive' as const } },
        ],
      })
    }

    if (dateFrom || dateTo) {
      const createdAt: { gte?: Date; lte?: Date } = {}
      if (dateFrom) {
        const from = new Date(dateFrom)
        if (!Number.isNaN(from.getTime())) createdAt.gte = from
      }
      if (dateTo) {
        const to = new Date(dateTo)
        if (!Number.isNaN(to.getTime())) {
          to.setUTCHours(23, 59, 59, 999)
          createdAt.lte = to
        }
      }
      if (createdAt.gte || createdAt.lte) and.push({ createdAt })
    }

    const where: any = {
      ...statusFilter,
      ...(and.length ? { AND: and } : {}),
    }

    const orderBy = { [sortBy]: sortOrder } as any

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
        orderBy,
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
