'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'
import { z } from 'zod'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, image: true } },
        garage: { select: { id: true, name: true, email: true } },
        vehicle: true
      }
    })
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      id: booking.id,
      reference: booking.bookingRef,
      dateISO: booking.date.toISOString(),
      timeSlot: booking.timeSlot,
      status: booking.status,
      totalPrice: booking.totalPrice,
      notes: booking.notes || null,
      paymentStatus: booking.paymentStatus,
      customer: booking.customer,
      garage: booking.garage,
      vehicle: booking.vehicle
    })
  } catch (error) {
    console.error('Error fetching booking by id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()
    const schema = z.object({
      status: z.enum(['PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW']).optional(),
      notes: z.string().max(2000).optional(),
      timeSlot: z.string().min(1).optional(),
      totalPrice: z.number().nonnegative().optional()
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }
    const { status, notes, timeSlot, totalPrice } = parsed.data

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: status ? (status as BookingStatus) : undefined,
        notes: notes !== undefined ? String(notes) : undefined,
        timeSlot: timeSlot || undefined,
        totalPrice: typeof totalPrice === 'number' ? totalPrice : undefined
      }
    })
    return NextResponse.json({ message: 'Updated', booking: { id: updated.id, status: updated.status, notes: updated.notes, timeSlot: updated.timeSlot, totalPrice: updated.totalPrice } })
  } catch (error) {
    console.error('Error updating booking by id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    await prisma.booking.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    console.error('Error deleting booking by id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
