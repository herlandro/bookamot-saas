import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const rating = searchParams.get('rating')

    const where = {
      ...(rating && { rating: parseInt(rating) }),
      ...(search && {
        OR: [
          { comment: { contains: search, mode: 'insensitive' as const } },
          { customer: { name: { contains: search, mode: 'insensitive' as const } } },
          { garage: { name: { contains: search, mode: 'insensitive' as const } } }
        ]
      })
    }

    const [reviews, total, avgRating] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          customer: { select: { name: true, email: true } },
          garage: { select: { name: true } },
          booking: { select: { date: true, timeSlot: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        _avg: { rating: true }
      })
    ])

    return NextResponse.json({
      reviews,
      averageRating: avgRating._avg.rating || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

