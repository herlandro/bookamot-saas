'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function parseNumber(value: string | null, fallback: number) {
  if (!value) return fallback
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function parseSort(sortBy: string | null, sortOrder: string | null) {
  const allowed = new Set(['date', 'status', 'totalPrice', 'createdAt'])
  const by = allowed.has(String(sortBy)) ? String(sortBy) : 'date'
  const order = sortOrder === 'asc' ? 'asc' : 'desc'
  return { by, order }
}

function mapStatusBadge(status: string) {
  switch (status) {
    case 'PENDING': return 'warning'
    case 'CONFIRMED': return 'info'
    case 'IN_PROGRESS': return 'info'
    case 'COMPLETED': return 'success'
    case 'CANCELLED': return 'destructive'
    case 'NO_SHOW': return 'destructive'
    default: return 'outline'
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseNumber(searchParams.get('page'), 1)
    const limit = parseNumber(searchParams.get('limit'), 25)
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')
    const { by, order } = parseSort(searchParams.get('sortBy'), searchParams.get('sortOrder'))

    const where: any = {}
    const allowedStatuses = new Set(['PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'])
    if (status && allowedStatuses.has(String(status).toUpperCase())) where.status = String(status).toUpperCase()
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom)
      if (dateTo) where.date.lte = new Date(dateTo)
    }
    if (search) {
      const s = search.trim()
      where.OR = [
        { bookingRef: { contains: s, mode: 'insensitive' } },
        { customer: { name: { contains: s, mode: 'insensitive' } } },
        { garage: { name: { contains: s, mode: 'insensitive' } } },
        { vehicle: { registration: { contains: s, mode: 'insensitive' } } }
      ]
    }

    const skip = (page - 1) * limit

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, name: true, email: true, image: true } },
          garage: { select: { id: true, name: true, email: true } },
          vehicle: { select: { id: true, registration: true, make: true, model: true } }
        },
        orderBy: { [by]: order }
      }),
      prisma.booking.count({ where })
    ])

    const items = bookings.map((b) => ({
      id: b.id,
      reference: b.bookingRef,
      dateISO: b.date.toISOString(),
      timeSlot: b.timeSlot,
      status: b.status,
      statusBadge: mapStatusBadge(b.status),
      totalPrice: b.totalPrice,
      customer: { id: b.customer.id, name: b.customer.name || 'Unknown', email: b.customer.email, image: b.customer.image || null },
      garage: { id: b.garage.id, name: b.garage.name, email: b.garage.email, image: null },
      vehicle: b.vehicle,
      createdAt: b.createdAt.toISOString()
    }))

    const res = NextResponse.json({
      bookings: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
    res.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=120')
    return res
  } catch (error) {
    console.error('Error fetching admin bookings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
