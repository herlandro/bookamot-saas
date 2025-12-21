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
    // Note: We'll try to use approvalStatus, but handle gracefully if it doesn't exist in DB
    let statusFilter: any = {}
    try {
      if (status === 'all') {
        statusFilter = { approvalStatus: { in: [GarageApprovalStatus.PENDING, GarageApprovalStatus.INFO_REQUESTED] } }
      } else {
        // Validate status is a valid enum value
        const validStatuses = Object.values(GarageApprovalStatus)
        if (validStatuses.includes(status as GarageApprovalStatus)) {
          statusFilter = { approvalStatus: status as GarageApprovalStatus }
        } else {
          // Default to PENDING if invalid status provided
          statusFilter = { approvalStatus: GarageApprovalStatus.PENDING }
        }
      }
    } catch (error) {
      // If GarageApprovalStatus enum doesn't exist, just use empty filter
      console.warn('GarageApprovalStatus enum not available, filtering by status disabled')
      statusFilter = {}
    }

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

    // Build where clause
    const where: any = {}
    
    // Only add statusFilter if it has content
    if (Object.keys(statusFilter).length > 0) {
      Object.assign(where, statusFilter)
    }
    
    // Add AND conditions if any
    if (and.length > 0) {
      where.AND = and
    }

    const orderBy = { [sortBy]: sortOrder } as any

    // Try to fetch garages with approvalLogs, but fallback if the relation doesn't exist
    let garages: any[]
    let total: number

    try {
      // First try with approvalLogs included
      [garages, total] = await Promise.all([
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
                admin: { 
                  select: { 
                    name: true, 
                    email: true 
                  } 
                }
              }
            }
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.garage.count({ where })
      ])
    } catch (error: any) {
      // If error is related to approvalStatus or approvalLogs, try without them
      if (error?.message?.includes('approvalStatus') || error?.message?.includes('approvalLogs') || error?.message?.includes('GarageApprovalLog')) {
        console.warn('approvalStatus or approvalLogs not available, fetching without them:', error.message)
        
        // Remove approvalStatus from where clause if it exists
        const whereWithoutStatus = { ...where }
        delete whereWithoutStatus.approvalStatus
        
        [garages, total] = await Promise.all([
          prisma.garage.findMany({
            where: whereWithoutStatus,
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
              }
            },
            orderBy,
            skip: (page - 1) * limit,
            take: limit
          }),
          prisma.garage.count({ where: whereWithoutStatus })
        ])
        
        // Add default approvalStatus to each garage
        garages = garages.map(garage => ({
          ...garage,
          approvalStatus: garage.approvalStatus || 'PENDING',
          approvalLogs: []
        }))
      } else {
        // Re-throw if it's a different error
        throw error
      }
    }

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
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
